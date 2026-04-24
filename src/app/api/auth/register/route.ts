import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client.server';

function getSupabaseCredentials() {
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured');
  }
  return { url, anonKey, serviceRoleKey };
}

const DEFAULT_PERMISSIONS = [
  { name: 'customers.view', label: '查看客户', description: '查看客户列表和详情', category: 'customers' },
  { name: 'customers.create', label: '创建客户', description: '创建新客户', category: 'customers' },
  { name: 'customers.update', label: '编辑客户', description: '编辑客户信息', category: 'customers' },
  { name: 'customers.delete', label: '删除客户', description: '删除客户', category: 'customers' },
  { name: 'customers.export', label: '导出客户', description: '导出客户数据', category: 'customers' },
  { name: 'leads.view', label: '查看线索', description: '查看销售线索', category: 'leads' },
  { name: 'leads.create', label: '创建线索', description: '创建新线索', category: 'leads' },
  { name: 'leads.update', label: '编辑线索', description: '编辑线索信息', category: 'leads' },
  { name: 'leads.delete', label: '删除线索', description: '删除线索', category: 'leads' },
  { name: 'leads.qualify', label: 'Qualified 线索', description: '将线索转为商机', category: 'leads' },
  { name: 'opportunities.view', label: '查看商机', description: '查看商机列表', category: 'opportunities' },
  { name: 'opportunities.create', label: '创建商机', description: '创建新商机', category: 'opportunities' },
  { name: 'opportunities.update', label: '编辑商机', description: '编辑商机信息', category: 'opportunities' },
  { name: 'opportunities.delete', label: '删除商机', description: '删除商机', category: 'opportunities' },
  { name: 'opportunities.stage', label: '变更阶段', description: '变更商机阶段', category: 'opportunities' },
  { name: 'contacts.view', label: '查看联系人', description: '查看联系人', category: 'contacts' },
  { name: 'contacts.create', label: '创建联系人', description: '创建联系人', category: 'contacts' },
  { name: 'contacts.update', label: '编辑联系人', description: '编辑联系人', category: 'contacts' },
  { name: 'contacts.delete', label: '删除联系人', description: '删除联系人', category: 'contacts' },
  { name: 'contracts.view', label: '查看合同', description: '查看合同', category: 'contracts' },
  { name: 'contracts.create', label: '创建合同', description: '创建合同', category: 'contracts' },
  { name: 'contracts.update', label: '编辑合同', description: '编辑合同', category: 'contracts' },
  { name: 'contracts.delete', label: '删除合同', description: '删除合同', category: 'contracts' },
  { name: 'invoices.view', label: '查看发票', description: '查看发票', category: 'invoices' },
  { name: 'invoices.create', label: '创建发票', description: '创建发票', category: 'invoices' },
  { name: 'invoices.update', label: '编辑发票', description: '编辑发票', category: 'invoices' },
  { name: 'invoices.delete', label: '删除发票', description: '删除发票', category: 'invoices' },
  { name: 'orders.view', label: '查看订单', description: '查看订单', category: 'orders' },
  { name: 'orders.create', label: '创建订单', description: '创建订单', category: 'orders' },
  { name: 'orders.update', label: '编辑订单', description: '编辑订单', category: 'orders' },
  { name: 'orders.delete', label: '删除订单', description: '删除订单', category: 'orders' },
  { name: 'quotes.view', label: '查看报价单', description: '查看报价单', category: 'quotes' },
  { name: 'quotes.create', label: '创建报价单', description: '创建报价单', category: 'quotes' },
  { name: 'quotes.update', label: '编辑报价单', description: '编辑报价单', category: 'quotes' },
  { name: 'quotes.delete', label: '删除报价单', description: '删除报价单', category: 'quotes' },
  { name: 'tasks.view', label: '查看任务', description: '查看任务', category: 'tasks' },
  { name: 'tasks.create', label: '创建任务', description: '创建任务', category: 'tasks' },
  { name: 'tasks.update', label: '编辑任务', description: '编辑任务', category: 'tasks' },
  { name: 'tasks.delete', label: '删除任务', description: '删除任务', category: 'tasks' },
  { name: 'reports.view', label: '查看报表', description: '查看数据报表', category: 'reports' },
  { name: 'reports.export', label: '导出报表', description: '导出报表数据', category: 'reports' },
  { name: 'reports.team', label: '团队报表', description: '查看团队报表', category: 'reports' },
  { name: 'system.settings', label: '系统设置', description: '修改系统设置', category: 'system' },
  { name: 'system.users', label: '用户管理', description: '管理用户和权限', category: 'system' },
];

const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: '系统管理员，拥有所有权限',
    is_system: true,
    permissions: DEFAULT_PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'sales_manager',
    description: '销售经理，管理团队和销售流程',
    is_system: true,
    permissions: [
      ...DEFAULT_PERMISSIONS.filter((p) => ['customers', 'leads', 'opportunities', 'contracts', 'invoices', 'orders', 'quotes'].includes(p.category)).map((p) => p.name),
      'reports.view', 'reports.export', 'reports.team',
    ],
  },
  {
    name: 'sales_rep',
    description: '销售人员，负责客户跟进',
    is_system: true,
    permissions: [
      'customers.view', 'customers.create', 'customers.update',
      'leads.view', 'leads.create', 'leads.update', 'leads.qualify',
      'opportunities.view', 'opportunities.create', 'opportunities.update',
      'contacts.view', 'contacts.create', 'contacts.update',
      'tasks.view', 'tasks.create', 'tasks.update',
    ],
  },
  {
    name: 'guest',
    description: '访客，只读权限',
    is_system: true,
    permissions: ['customers.view', 'leads.view', 'opportunities.view', 'reports.view'],
  },
];

async function ensureDefaultData(db: ReturnType<typeof getSupabaseClient>) {
  // Check if roles exist
  const { data: existingRoles } = await db.from('roles').select('name');
  const existingRoleNames = new Set((existingRoles as Array<{ name: string }>)?.map((r) => r.name) || []);

  if (existingRoleNames.size === 0) {
    // Insert permissions
    const { data: insertedPerms } = await db
      .from('permissions')
      .insert(DEFAULT_PERMISSIONS.map((p) => ({ name: p.name, label: p.label, description: p.description, category: p.category })))
      .select('id,name');

    const permMap = new Map<string, string>();
    (insertedPerms as Array<{ id: string; name: string }>)?.forEach((p) => permMap.set(p.name, p.id));

    // Insert roles
    for (const role of DEFAULT_ROLES) {
      const { data: insertedRole } = await db
        .from('roles')
        .insert({
          name: role.name,
          description: role.description,
          is_system: role.is_system,
        })
        .select('id')
        .single();

      if (insertedRole?.id) {
        const rolePerms = role.permissions
          .map((pName) => permMap.get(pName))
          .filter(Boolean) as string[];

        if (rolePerms.length > 0) {
          await db.from('role_permissions').insert(
            rolePerms.map((permId) => ({ role_id: insertedRole.id, permission_id: permId }))
          );
        }
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = getSupabaseClient();

    // Ensure default roles and permissions exist
    await ensureDefaultData(db);

    const { url, serviceRoleKey } = getSupabaseCredentials();

    // Use service role to create user and auto-confirm email
    const key = serviceRoleKey || getSupabaseCredentials().anonKey;
    const adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    // Assign default role (sales_rep)
    const { data: roleData } = await db.from('roles').select('id').eq('name', 'sales_rep').single();

    if (roleData?.id) {
      await db.from('user_roles').insert({
        user_id: userId,
        role_id: roleData.id,
      });
    }

    // Check if this is the first user, if so assign admin too
    const { count } = await db.from('user_roles').select('*', { count: 'exact', head: true });
    if ((count || 0) <= 1) {
      const { data: adminRole } = await db.from('roles').select('id').eq('name', 'admin').single();
      if (adminRole?.id) {
        await db.from('user_roles').upsert({
          user_id: userId,
          role_id: adminRole.id,
        }, { onConflict: 'user_id,role_id' });
      }
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email: authData.user.email },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
