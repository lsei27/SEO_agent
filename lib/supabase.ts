import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Set user context for RLS policies
 * Call this after authentication
 */
export async function setSupabaseUserContext(userId: string) {
    const { error } = await supabase.rpc('set_config', {
        setting: 'app.user_id',
        value: userId,
        is_local: false,
    })

    if (error) {
        console.error('Failed to set user context:', error)
    }
}
