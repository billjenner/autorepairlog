import { createClient } from 'npm:@supabase/supabase-js@2'

type SessionAction = 'restore' | 'login' | 'logout'

type SessionRow = {
  id: number
  users_email: string
  public_ip: string
  is_logged_in: boolean
  updated_at: string
}

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

function getRequestIp(request: Request) {
  const headers = request.headers
  const candidates = [
    headers.get('x-forwarded-for'),
    headers.get('x-real-ip'),
    headers.get('cf-connecting-ip'),
    headers.get('true-client-ip'),
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    const [firstIp] = candidate
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
    if (firstIp) {
      return firstIp
    }
  }

  return null
}

async function fetchSessionByEmail(supabase: ReturnType<typeof createClient>, usersEmail: string) {
  const { data, error } = await supabase
    .from('users_logged_in')
    .select('id, users_email, public_ip, is_logged_in, updated_at')
    .eq('users_email', usersEmail)
    .maybeSingle<SessionRow>()

  if (error) {
    throw error
  }

  return data || null
}

async function fetchSessionByIp(supabase: ReturnType<typeof createClient>, publicIp: string) {
  const { data, error } = await supabase
    .from('users_logged_in')
    .select('id, users_email, public_ip, is_logged_in, updated_at')
    .eq('public_ip', publicIp)
    .maybeSingle<SessionRow>()

  if (error) {
    throw error
  }

  return data || null
}

async function upsertSession(
  supabase: ReturnType<typeof createClient>,
  usersEmail: string,
  publicIp: string,
  isLoggedIn: boolean,
) {
  const sessionByEmail = await fetchSessionByEmail(supabase, usersEmail)
  const sessionByIp = await fetchSessionByIp(supabase, publicIp)

  if (sessionByEmail?.id && sessionByIp?.id && sessionByEmail.id !== sessionByIp.id) {
    const { error: deleteError } = await supabase
      .from('users_logged_in')
      .delete()
      .eq('id', sessionByIp.id)

    if (deleteError) {
      throw deleteError
    }
  }

  const targetId = sessionByEmail?.id || sessionByIp?.id
  const payload = {
    users_email: usersEmail,
    public_ip: publicIp,
    is_logged_in: isLoggedIn,
    updated_at: new Date().toISOString(),
  }

  if (targetId) {
    const { data, error } = await supabase
      .from('users_logged_in')
      .update(payload)
      .eq('id', targetId)
      .select('id, users_email, public_ip, is_logged_in, updated_at')
      .single<SessionRow>()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await supabase
    .from('users_logged_in')
    .insert(payload)
    .select('id, users_email, public_ip, is_logged_in, updated_at')
    .single<SessionRow>()

  if (error) {
    throw error
  }

  return data
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabase = buildSupabaseClient()
  if (!supabase) {
    return jsonResponse({ error: 'Server configuration error.' }, 500)
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: SessionAction
    email?: string
  }

  const action = body.action || 'restore'
  const publicIp = getRequestIp(request)

  if (!publicIp) {
    return jsonResponse({ error: 'Unable to determine the public IP address.' }, 400)
  }

  try {
    if (action === 'restore') {
      const sessionRow = await fetchSessionByIp(supabase, publicIp)

      if (!sessionRow || !sessionRow.is_logged_in) {
        return jsonResponse({
          public_ip: publicIp,
          users_email: null,
          is_logged_in: false,
          date: null,
        })
      }

      const now = new Date().toISOString()
      const { error } = await supabase
        .from('users_logged_in')
        .update({ updated_at: now })
        .eq('id', sessionRow.id)

      if (error) {
        throw error
      }

      return jsonResponse({
        public_ip: publicIp,
        users_email: sessionRow.users_email,
        is_logged_in: true,
        updated_at: now,
      })
    }

    const usersEmail = String(body.email || '')
      .trim()
      .toLowerCase()
    if (!usersEmail) {
      return jsonResponse({ error: 'Email is required for login and logout actions.' }, 400)
    }

    const sessionRow = await upsertSession(supabase, usersEmail, publicIp, action === 'login')

    return jsonResponse({
      public_ip: sessionRow.public_ip,
      users_email: sessionRow.users_email,
      is_logged_in: sessionRow.is_logged_in,
      updated_at: sessionRow.updated_at,
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unexpected error while syncing session.',
      },
      500,
    )
  }
})
