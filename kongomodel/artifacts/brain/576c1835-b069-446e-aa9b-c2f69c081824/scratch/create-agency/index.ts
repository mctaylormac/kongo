// @ts-ignore: Deno URL imports are not recognized by the standard TS language server
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno URL imports are not recognized by the standard TS language server
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { name, commission_rate, description, admin_email, admin_password, admin_name } = await req.json()

    // 1. Create Agency
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .insert({
        name,
        commission_rate,
        description,
        status: 'active'
      })
      .select()
      .single()

    if (agencyError) throw agencyError

    // 2. Create Admin User
    const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: admin_name,
        role: 'admin',
        agency_id: agency.id
      }
    })

    if (userError) {
      // Rollback agency creation if user creation fails
      await supabaseClient.from('agencies').delete().eq('id', agency.id)
      throw userError
    }

    return new Response(
      JSON.stringify({ agency, user: userData.user }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
