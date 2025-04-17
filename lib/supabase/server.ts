import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Create a server-side supabase client with service role key
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
