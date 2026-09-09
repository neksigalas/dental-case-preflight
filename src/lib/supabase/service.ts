// Service-role Supabase client — server-side only, bypasses RLS
// NEVER use this in client components or expose to browser
import { createClient as _createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Alias for backwards compatibility
export const createClient = createServiceClient
