import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

function buildSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !key) {
    return null
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST' && request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabase = buildSupabaseClient()
  if (!supabase) {
    return jsonResponse({ error: 'Server configuration error.' }, 500)
  }

  try {
    const { data: profiles, error: profileError } = await supabase.from('profile').select('*')

    if (profileError) {
      throw profileError
    }

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      throw authError
    }

    const emailByUserId = new Map(authUsers.users.map((user) => [user.id, user.email || '']))

    const merged = (profiles || []).map((profile) => ({
      ...profile,
      id: profile.user_id,
      email: emailByUserId.get(profile.user_id) || '',
    }))

    return jsonResponse({ users: merged })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error.' }, 500)
  }
})
