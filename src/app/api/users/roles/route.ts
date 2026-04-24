// 获取所有用户角色列表
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client.server';

// 获取所有用户及其角色
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    const client = getSupabaseClient();
    
    // 如果指定了用户ID，只获取该用户的角色
    if (userId) {
      const { data: userRoles, error } = await client
        .from('user_roles')
        .select(`
          id,
          user_id,
          created_at,
          roles (
            id,
            name,
            description,
            is_system
          )
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('获取用户角色失败:', error);
        return NextResponse.json(
          { error: '获取用户角色失败' },
          { status: 500 }
        );
      }
      
      const formattedRoles = (userRoles as Array<{
        id: string;
        user_id: string;
        created_at: string;
        roles: Array<{ id: string; name: string; description: string | null; is_system: boolean }>;
      }>)?.map((ur) => {
        const role = ur.roles?.[0] || {};
        return {
          user_role_id: ur.id,
          user_id: ur.user_id,
          created_at: ur.created_at,
          role_id: role.id,
          role_name: role.name,
          description: role.description,
          is_system: role.is_system,
        };
      }) || [];
      
      return NextResponse.json(formattedRoles);
    }
    
    // 获取所有用户角色
    const { data: allUserRoles, error } = await client
      .from('user_roles')
      .select(`
        id,
        user_id,
        created_at,
        roles (
          id,
          name,
          description,
          is_system
        )
      `);
    
    if (error) {
      console.error('获取用户角色列表失败:', error);
      return NextResponse.json(
        { error: '获取用户角色列表失败' },
        { status: 500 }
      );
    }
    
    // 按用户分组
    const usersMap = new Map<string, {
      id: string;
      user_id: string;
      user_name?: string;
      email?: string;
      roles: Array<{
        id: string;
        name: string;
        description: string | null;
        is_system: boolean;
      }>;
    }>();

    (allUserRoles as Array<{
      id: string;
      user_id: string;
      created_at: string;
      roles: { id: string; name: string; description: string | null; is_system: boolean } | Array<{ id: string; name: string; description: string | null; is_system: boolean }>;
    }>)?.forEach((ur) => {
      if (!usersMap.has(ur.user_id)) {
        usersMap.set(ur.user_id, {
          id: ur.id,
          user_id: ur.user_id,
          roles: [],
        });
      }
      const roleList = Array.isArray(ur.roles) ? ur.roles : ur.roles ? [ur.roles] : [];
      usersMap.get(ur.user_id)?.roles.push(...roleList);
    });

    // Fetch auth users to get names/emails
    try {
      const { url } = getSupabaseCredentials();
      const serviceRoleKey = getSupabaseServiceRoleKey();
      if (serviceRoleKey) {
        const adminClient = createClient(url, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: authUsers } = await adminClient.auth.admin.listUsers();
        authUsers?.users?.forEach((authUser) => {
          const entry = usersMap.get(authUser.id);
          if (entry) {
            entry.email = authUser.email || undefined;
            entry.user_name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || undefined;
          }
        });
      }
    } catch {
      // Ignore auth fetch errors
    }

    const users = Array.from(usersMap.values());

    return NextResponse.json(users);
  } catch (error) {
    console.error('获取用户角色列表失败:', error);
    return NextResponse.json(
      { error: '获取用户角色列表失败' },
      { status: 500 }
    );
  }
}
