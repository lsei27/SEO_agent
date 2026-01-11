import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY')
}

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Admin operations will fail.')
}

// Client for public operations (RLS enforced)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for admin operations (Bypasses RLS)
// Use this in API routes where you verify the user yourself
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

