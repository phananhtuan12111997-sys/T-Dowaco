import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get auth token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check if the caller is admin or HR
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin, department')
      .eq('id', user.id)
      .single()

    const isHR = profile?.department?.toLowerCase().includes('tổ chức') || profile?.department?.toLowerCase().includes('kế hoạch')

    if (!profile?.is_admin && !isHR) {
      return new Response(JSON.stringify({ error: 'Forbidden. Requires Admin or HR privileges.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Parse payload
    const payload = await req.json()
    const { action, data } = payload

    if (!action || !data) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Handle actions
    if (action === 'CREATE_USER') {
      const { username, password, full_name, department, role, email, phone, gender, address, cccd, hometown, social_insurance_number, health_insurance_number } = data
      
      const authEmail = email || (username.includes('@') ? username : `${username}@tdowaco.vn`)

      // Create Auth User
      const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password: password,
        email_confirm: true,
      })

      if (createAuthError) {
        return new Response(JSON.stringify({ error: createAuthError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Create Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user!.id,
          username,
          full_name,
          department,
          role,
          email,
          phone,
          gender,
          address,
          cccd,
          hometown,
          social_insurance_number,
          health_insurance_number,
          is_admin: false,
          force_password_change: true
        })

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user!.id) // Rollback
        return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true, user: authData.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    
    } else if (action === 'UPDATE_USER') {
      const { id, username, full_name, department, role, email, phone, gender, address, cccd, hometown, social_insurance_number, health_insurance_number, is_active } = data
      
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          username,
          full_name,
          department,
          role,
          email,
          phone,
          gender,
          address,
          cccd,
          hometown,
          social_insurance_number,
          health_insurance_number,
          is_active
        })
        .eq('id', id)

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
    } else if (action === 'RESET_PASSWORD') {
      const { id, password } = data
      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: password
      })
      if (resetError) {
        return new Response(JSON.stringify({ error: resetError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
    } else if (action === 'DELETE_USER') {
      const { id } = data
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
