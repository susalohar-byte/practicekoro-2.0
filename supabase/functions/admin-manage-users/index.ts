import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { manageUsers } from '../_shared/admin-user-management.ts';
Deno.serve(async (req: Request) => {
  const allowed = (
    Deno.env.get('ALLOWED_ORIGINS') || 'https://practicekoro.online,https://www.practicekoro.online'
  )
    .split(',')
    .map((s) => s.trim());
  const origin = req.headers.get('Origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.includes(origin))
    return respond({ success: false, error: 'Origin not allowed.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return respond({ success: false, error: 'Method not allowed.' }, 405);
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond({ success: false, error: 'Authentication required.' }, 401);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key)
    return respond({ success: false, error: 'Server configuration unavailable.' }, 500);
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return respond({ success: false, error: 'Invalid session.' }, 401);
  try {
    const input = await req.json();
    const result = await manageUsers(client, data.user.id, input);
    return respond(result, result.success || result.deletedIds?.length ? 200 : 400);
  } catch {
    return respond({ success: false, error: 'Invalid request.' }, 400);
  }
});
