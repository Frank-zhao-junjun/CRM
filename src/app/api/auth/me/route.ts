import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client.server';

function getSupabaseCredentials() {
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured');
  }
  return { url, anonKey };
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('sb-token')?.value;
    const token = authHeader?.replace('Bearer ', '') || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, anonKey } = getSupabaseCredentials();
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = userData.user;
    const db = getSupabaseClient();

    // Fetch roles
    const { data: userRoles } = await db
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id, name, description
        )
      `)
      .eq('user_id', user.id);

    const roles =
      (userRoles as Array<{ role_id: string; roles: { id: string; name: string; description: string | null } | Array<{ id: string; name: string; description: string | null }> }>)?.map(
        (ur) => {
          const roleList = Array.isArray(ur.roles) ? ur.roles : ur.roles ? [ur.roles] : [];
          return roleList[0];
        }
      ).filter(Boolean) || [];

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      roles,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
