import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

// Whop signs webhooks the Standard Webhooks way (docs.whop.com/developer/guides/webhooks):
//   webhook-id, webhook-timestamp, webhook-signature: "v1,<base64>" (space-separated if several)
//   signature = base64(HMAC-SHA256(key, "${id}.${timestamp}.${rawBody}"))
// The key is the ws_... secret used as-is; the base64 decoding of the part after
// the prefix (the Standard Webhooks convention) is accepted too, so a change on
// either side cannot silently reject every payment again. The older
// "x-whop-signature: sha256=<hex>" of the body is still accepted.
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret) {
    console.error('WHOP_WEBHOOK_SECRET not set')
    return false
  }

  const id = req.headers.get('webhook-id')
  const ts = req.headers.get('webhook-timestamp')
  const sigHeader = req.headers.get('webhook-signature')
  if (id && ts && sigHeader) {
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) {
      console.warn('[whop webhook] timestamp outside 5 minutes')
      return false
    }
    const keys: Buffer[] = [Buffer.from(secret, 'utf8')]
    const bare = secret.replace(/^(ws|whsec)_/, '')
    try { keys.push(Buffer.from(bare, 'base64')) } catch {}
    const signed = `${id}.${ts}.${rawBody}`
    const given = sigHeader.split(' ').map(s => s.split(',')[1]).filter(Boolean)
    return keys.some(k => {
      const mac = createHmac('sha256', k).update(signed, 'utf8').digest('base64')
      return given.some(g => safeEqual(mac, g))
    })
  }

  const legacy = req.headers.get('x-whop-signature') ?? req.headers.get('whop-signature') ?? ''
  if (legacy) {
    const hex = legacy.startsWith('sha256=') ? legacy.slice(7) : legacy
    return safeEqual(createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex'), hex)
  }

  // Header names only (never values), so a future format change is diagnosable
  console.warn('[whop webhook] no signature header; headers were:', [...req.headers.keys()].join(','))
  return false
}

// ── Event handlers ─────────────────────────────────────────────────────────────

async function handleMembershipWentValid(data: Record<string, unknown>) {
  const supabase = createServiceClient()

  // WHOP v1 membership payload
  const membership = (data.membership ?? data) as Record<string, unknown>
  const user = membership.user as Record<string, unknown> | undefined
  const email = (user?.email ?? membership.email) as string | undefined
  const licenseKey = (membership.license_key ?? membership.id) as string | undefined
  const productId = (
    (membership.product as Record<string, unknown> | undefined)?.id ??
    membership.product_id
  ) as string | undefined

  console.log('[whop webhook] membership.went_valid', { email, licenseKey, productId })

  if (!email) {
    console.error('[whop webhook] No email in payload — cannot activate lab')
    return { error: 'no_email' }
  }

  // Find Supabase user by email
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers()
  if (userErr) {
    console.error('[whop webhook] Failed to list users:', userErr)
    return { error: 'list_users_failed' }
  }

  const supabaseUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!supabaseUser) {
    console.warn('[whop webhook] No Supabase user found for email:', email)
    return { error: 'user_not_found' }
  }

  // Update the lab record
  const { error: updateErr } = await supabase
    .from('labs')
    .update({
      subscription_status: 'active',
      ...(licenseKey ? { whop_license_key: licenseKey } : {}),
    })
    .eq('owner_id', supabaseUser.id)

  if (updateErr) {
    console.error('[whop webhook] Failed to activate lab:', updateErr)
    return { error: updateErr.message }
  }

  console.log('[whop webhook] ✅ Lab activated for user:', email)
  return { ok: true, email }
}

async function handleMembershipWentInvalid(data: Record<string, unknown>) {
  const supabase = createServiceClient()

  const membership = (data.membership ?? data) as Record<string, unknown>
  const user = membership.user as Record<string, unknown> | undefined
  const email = (user?.email ?? membership.email) as string | undefined

  console.log('[whop webhook] membership.went_invalid', { email })

  if (!email) {
    console.error('[whop webhook] No email in payload')
    return { error: 'no_email' }
  }

  const { data: users, error: userErr } = await supabase.auth.admin.listUsers()
  if (userErr) return { error: 'list_users_failed' }

  const supabaseUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!supabaseUser) return { error: 'user_not_found' }

  const { error: updateErr } = await supabase
    .from('labs')
    .update({ subscription_status: 'inactive' })
    .eq('owner_id', supabaseUser.id)

  if (updateErr) {
    console.error('[whop webhook] Failed to deactivate lab:', updateErr)
    return { error: updateErr.message }
  }

  console.log('[whop webhook] ⚠️ Lab deactivated for user:', email)
  return { ok: true, email }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Verify signature (skip in development if secret not set)
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const valid = await verifySignature(req, rawBody)
    if (!valid) {
      console.warn('[whop webhook] Invalid signature — rejecting')
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // WHOP v1 webhook payload: { action: "membership.went_valid", data: { ... } }
  const action = (payload.action ?? payload.event ?? payload.type) as string
  const data = (payload.data ?? payload) as Record<string, unknown>

  console.log('[whop webhook] Received action:', action)

  let result: Record<string, unknown> = { skipped: true }

  switch (action) {
    case 'membership.went_valid':
    case 'membership.activated':
      result = await handleMembershipWentValid(data)
      break
    case 'membership.went_invalid':
    case 'membership.deactivated':
      result = await handleMembershipWentInvalid(data)
      break
    default:
      console.log('[whop webhook] Unhandled action:', action, '— ignoring')
  }

  // Always return 200 to WHOP (so it doesn't retry)
  return NextResponse.json({ received: true, action, result })
}
