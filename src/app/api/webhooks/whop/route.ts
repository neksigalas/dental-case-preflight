import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

// WHOP sends: x-whop-signature: sha256=<hex>
// Verified with HMAC-SHA256(rawBody, WHOP_WEBHOOK_SECRET)
async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.WHOP_WEBHOOK_SECRET
  if (!secret) {
    console.error('WHOP_WEBHOOK_SECRET not set')
    return false
  }

  const signature = req.headers.get('x-whop-signature') ?? req.headers.get('whop-signature') ?? ''
  if (!signature) {
    console.warn('No WHOP signature header present — rejecting')
    return false
  }

  // Header format: "sha256=<hex>" or just "<hex>"
  const expectedHex = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature

  const computed = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  // Constant-time comparison
  if (computed.length !== expectedHex.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ expectedHex.charCodeAt(i)
  }
  return diff === 0
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
      result = await handleMembershipWentValid(data)
      break
    case 'membership.went_invalid':
      result = await handleMembershipWentInvalid(data)
      break
    default:
      console.log('[whop webhook] Unhandled action:', action, '— ignoring')
  }

  // Always return 200 to WHOP (so it doesn't retry)
  return NextResponse.json({ received: true, action, result })
}
