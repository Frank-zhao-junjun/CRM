// 权限类型和纯数据 - 可用于客户端
export type PermissionName = 
  | 'customers.view' | 'customers.create' | 'customers.update' | 'customers.delete' | 'customers.export'
  | 'leads.view' | 'leads.create' | 'leads.update' | 'leads.delete' | 'leads.qualify'
  | 'opportunities.view' | 'opportunities.create' | 'opportunities.update' | 'opportunities.delete' | 'opportunities.close' | 'opportunities.export'
  | 'contacts.view' | 'contacts.create' | 'contacts.update' | 'contacts.delete'
  | 'contracts.view' | 'contracts.create' | 'contracts.update' | 'contracts.delete'
  | 'invoices.view' | 'invoices.create' | 'invoices.update' | 'invoices.delete'
  | 'orders.view' | 'orders.create' | 'orders.update' | 'orders.delete'
  | 'quotes.view' | 'quotes.create' | 'quotes.update' | 'quotes.delete'
  | 'tasks.view' | 'tasks.create' | 'tasks.update' | 'tasks.delete'
  | 'reports.view' | 'reports.export' | 'reports.team'
  | 'system.settings' | 'system.users';

export type PermissionCategory = 'customers' | 'leads' | 'opportunities' | 'contacts' | 'contracts' | 'invoices' | 'orders' | 'quotes' | 'tasks' | 'reports' | 'system';

export const defaultPermissions: Array<{ name: PermissionName; label: string; description: string; category: PermissionCategory }> = [
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
  { name: 'opportunities.close', label: '关闭商机', description: '成交或失败商机', category: 'opportunities' },
  { name: 'opportunities.export', label: '导出商机', description: '导出商机数据', category: 'opportunities' },
  { name: 'reports.view', label: '查看报表', description: '查看数据分析报表', category: 'reports' },
  { name: 'reports.export', label: '导出报表', description: '导出报表数据', category: 'reports' },
  { name: 'reports.team', label: '团队报表', description: '查看团队排名等', category: 'reports' },
];

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    customers: '客户管理', leads: '销售线索', opportunities: '商机管理',
    contacts: '联系人', contracts: '合同管理', invoices: '发票管理',
    orders: '订单管理', quotes: '报价单', tasks: '任务管理',
    reports: '数据分析', system: '系统设置',
  };
  return labels[category] || category;
}

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
    permissions: defaultPermissions.map(p => p.name),
  },
  {
    name: 'sales_manager',
    description: '销售经理，管理团队和销售流程',
    is_system: true,
    permissions: [
      ...defaultPermissions.filter(p => ['customers', 'leads', 'opportunities', 'contracts', 'invoices', 'orders', 'quotes'].includes(p.category)).map(p => p.name),
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
export function clearPermissionCache(): void {}

// Client-side permission check - returns empty for now, real impl via API
export async function getUserPermissions(_userId?: string): Promise<PermissionName[]> {
  return [];
}
