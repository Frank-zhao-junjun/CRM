export type PermissionName =
  | 'customers.view' | 'customers.create' | 'customers.edit' | 'customers.delete' | 'customers.export'
  | 'leads.view' | 'leads.create' | 'leads.edit' | 'leads.delete' | 'leads.qualify'
  | 'opportunities.view' | 'opportunities.create' | 'opportunities.edit' | 'opportunities.delete' | 'opportunities.close' | 'opportunities.export'
  | 'contracts.view' | 'contracts.create' | 'contracts.edit' | 'contracts.delete' | 'contracts.sign'
  | 'invoices.view' | 'invoices.create' | 'invoices.edit' | 'invoices.delete' | 'invoices.send'
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.delete'
  | 'quotes.view' | 'quotes.create' | 'quotes.edit' | 'quotes.delete' | 'quotes.send'
  | 'reports.view' | 'reports.export' | 'reports.team'
  | 'settings.view' | 'settings.edit' | 'settings.fields' | 'settings.workflows' | 'settings.roles'
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete';

export type PermissionCategory =
  | 'customers' | 'leads' | 'opportunities' | 'contracts'
  | 'invoices' | 'orders' | 'quotes' | 'reports'
  | 'settings' | 'users';

export type RoleName = 'admin' | 'sales_manager' | 'sales_rep' | 'guest';

export const defaultPermissions: Array<{
  name: string;
  label: string;
  description: string;
  category: string;
}> = [
  { name: 'customers.view', label: '查看客户', description: '查看客户列表和详情', category: 'customers' },
  { name: 'customers.create', label: '创建客户', description: '创建新客户', category: 'customers' },
  { name: 'customers.edit', label: '编辑客户', description: '编辑客户信息', category: 'customers' },
  { name: 'customers.delete', label: '删除客户', description: '删除客户', category: 'customers' },
  { name: 'customers.export', label: '导出客户', description: '导出客户数据', category: 'customers' },
  { name: 'leads.view', label: '查看线索', description: '查看线索列表和详情', category: 'leads' },
  { name: 'leads.create', label: '创建线索', description: '创建新线索', category: 'leads' },
  { name: 'leads.edit', label: '编辑线索', description: '编辑线索信息', category: 'leads' },
  { name: 'leads.delete', label: '删除线索', description: '删除线索', category: 'leads' },
  { name: 'leads.qualify', label: '认定线索', description: '认定线索资质', category: 'leads' },
  { name: 'opportunities.view', label: '查看商机', description: '查看商机列表和详情', category: 'opportunities' },
  { name: 'opportunities.create', label: '创建商机', description: '创建新商机', category: 'opportunities' },
  { name: 'opportunities.edit', label: '编辑商机', description: '编辑商机信息', category: 'opportunities' },
  { name: 'opportunities.delete', label: '删除商机', description: '删除商机', category: 'opportunities' },
  { name: 'opportunities.close', label: '关闭商机', description: '关闭商机（成交或失败）', category: 'opportunities' },
  { name: 'opportunities.export', label: '导出商机', description: '导出商机数据', category: 'opportunities' },
  { name: 'contracts.view', label: '查看合同', description: '查看合同列表和详情', category: 'contracts' },
  { name: 'contracts.create', label: '创建合同', description: '创建新合同', category: 'contracts' },
  { name: 'contracts.edit', label: '编辑合同', description: '编辑合同信息', category: 'contracts' },
  { name: 'contracts.delete', label: '删除合同', description: '删除合同', category: 'contracts' },
  { name: 'contracts.sign', label: '签署合同', description: '签署合同', category: 'contracts' },
  { name: 'invoices.view', label: '查看发票', description: '查看发票列表和详情', category: 'invoices' },
  { name: 'invoices.create', label: '创建发票', description: '创建新发票', category: 'invoices' },
  { name: 'invoices.edit', label: '编辑发票', description: '编辑发票信息', category: 'invoices' },
  { name: 'invoices.delete', label: '删除发票', description: '删除发票', category: 'invoices' },
  { name: 'invoices.send', label: '发送发票', description: '发送发票给客户', category: 'invoices' },
  { name: 'orders.view', label: '查看订单', description: '查看订单列表和详情', category: 'orders' },
  { name: 'orders.create', label: '创建订单', description: '创建新订单', category: 'orders' },
  { name: 'orders.edit', label: '编辑订单', description: '编辑订单信息', category: 'orders' },
  { name: 'orders.delete', label: '删除订单', description: '删除订单', category: 'orders' },
  { name: 'quotes.view', label: '查看报价', description: '查看报价列表和详情', category: 'quotes' },
  { name: 'quotes.create', label: '创建报价', description: '创建新报价', category: 'quotes' },
  { name: 'quotes.edit', label: '编辑报价', description: '编辑报价信息', category: 'quotes' },
  { name: 'quotes.delete', label: '删除报价', description: '删除报价', category: 'quotes' },
  { name: 'quotes.send', label: '发送报价', description: '发送报价给客户', category: 'quotes' },
  { name: 'reports.view', label: '查看报表', description: '查看各种报表', category: 'reports' },
  { name: 'reports.export', label: '导出报表', description: '导出报表数据', category: 'reports' },
  { name: 'reports.team', label: '团队报表', description: '查看团队报表', category: 'reports' },
  { name: 'settings.view', label: '查看设置', description: '查看系统设置', category: 'settings' },
  { name: 'settings.edit', label: '编辑设置', description: '编辑系统设置', category: 'settings' },
  { name: 'settings.fields', label: '自定义字段', description: '管理自定义字段', category: 'settings' },
  { name: 'settings.workflows', label: '工作流设置', description: '管理工作流', category: 'settings' },
  { name: 'settings.roles', label: '角色管理', description: '管理角色和权限', category: 'settings' },
  { name: 'users.view', label: '查看用户', description: '查看用户列表', category: 'users' },
  { name: 'users.create', label: '创建用户', description: '创建新用户', category: 'users' },
  { name: 'users.edit', label: '编辑用户', description: '编辑用户信息', category: 'users' },
  { name: 'users.delete', label: '删除用户', description: '删除用户', category: 'users' },
];

export const defaultRoles: Array<{
  name: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}> = [
  {
    name: 'admin',
    description: '系统管理员，拥有所有权限',
    is_system: true,
    permissions: defaultPermissions.map((permission) => permission.name),
  },
  {
    name: 'sales_manager',
    description: '销售经理，管理团队和销售流程',
    is_system: true,
    permissions: [
      ...defaultPermissions
        .filter((permission) => ['customers', 'leads', 'opportunities', 'contracts', 'invoices', 'orders', 'quotes'].includes(permission.category))
        .map((permission) => permission.name),
      'reports.view', 'reports.export', 'reports.team',
      'settings.view', 'settings.fields', 'settings.workflows',
      'users.view',
    ],
  },
  {
    name: 'sales_rep',
    description: '销售人员，负责客户跟进',
    is_system: true,
    permissions: [
      'customers.view', 'customers.create', 'customers.edit',
      'leads.view', 'leads.create', 'leads.edit', 'leads.qualify',
      'opportunities.view', 'opportunities.create', 'opportunities.edit',
      'contracts.view', 'contracts.create', 'contracts.sign',
      'invoices.view',
      'orders.view', 'orders.create',
      'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.send',
      'reports.view',
    ],
  },
  {
    name: 'guest',
    description: '访客，只有查看权限',
    is_system: true,
    permissions: [
      'customers.view', 'leads.view', 'opportunities.view',
      'contracts.view', 'invoices.view', 'orders.view', 'quotes.view',
    ],
  },
];

export function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    customers: '客户管理',
    leads: '线索管理',
    opportunities: '商机管理',
    contracts: '合同管理',
    invoices: '发票管理',
    orders: '订单管理',
    quotes: '报价管理',
    reports: '报表管理',
    settings: '系统设置',
    users: '用户管理',
  };

  return categoryLabels[category] || category;
}
