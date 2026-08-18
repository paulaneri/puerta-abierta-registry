import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'No autenticado' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'No autenticado' }, 401)

    const { data: isAdmin, error: roleError } = await admin.rpc('is_admin', {
      _user_id: userData.user.id,
    })
    if (roleError) return json({ error: 'Error al verificar permisos' }, 500)
    if (!isAdmin) return json({ error: 'No autorizado' }, 403)

    const body = await req.json().catch(() => null)
    const userId = typeof body?.userId === 'string' ? body.userId : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: 'Usuario inválido' }, 400)
    if (password.length < 8 || password.length > 72) {
      return json({ error: 'La contraseña debe tener entre 8 y 72 caracteres' }, 400)
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password })
    if (updateError) return json({ error: updateError.message }, 400)

    return json({ success: true })
  } catch (e) {
    console.error('admin-set-password error', e)
    return json({ error: 'Error interno' }, 500)
  }
})
