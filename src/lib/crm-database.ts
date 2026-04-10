import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, InsertCustomer, Contact, InsertContact, Opportunity, InsertOpportunity, Activity, InsertActivity } from '@/storage/database/shared/schema';

// CRM 数据库服务

// ============ Customer 操作 ============

export async function getAllCustomers(): Promise<Customer[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户列表失败: ${error.message}`);
  return data as Customer[];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取客户失败: ${error.message}`);
  return data as Customer | null;
}

export async function createCustomer(customer: InsertCustomer): Promise<Customer> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .insert(customer)
    .select()
    .single();
  if (error) throw new Error(`创建客户失败: ${error.message}`);
  return data as Customer;
}

export async function updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新客户失败: ${error.message}`);
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除客户失败: ${error.message}`);
}

// ============ Contact 操作 ============

export async function getAllContacts(): Promise<Contact[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取联系人列表失败: ${error.message}`);
  return data as Contact[];
}

export async function getContactsByCustomerId(customerId: string): Promise<Contact[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_primary', { ascending: false });
  if (error) throw new Error(`获取客户联系人失败: ${error.message}`);
  return data as Contact[];
}

export async function getContactById(id: string): Promise<Contact | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取联系人失败: ${error.message}`);
  return data as Contact | null;
}

export async function createContact(contact: InsertContact): Promise<Contact> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .insert(contact)
    .select()
    .single();
  if (error) throw new Error(`创建联系人失败: ${error.message}`);
  return data as Contact;
}

export async function updateContact(id: string, updates: Partial<InsertContact>): Promise<Contact> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新联系人失败: ${error.message}`);
  return data as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('contacts')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除联系人失败: ${error.message}`);
}

// ============ Opportunity 操作 ============

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`获取销售机会列表失败: ${error.message}`);
  return data as Opportunity[];
}

export async function getOpportunitiesByCustomerId(customerId: string): Promise<Opportunity[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`获取客户销售机会失败: ${error.message}`);
  return data as Opportunity[];
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取销售机会失败: ${error.message}`);
  return data as Opportunity | null;
}

export async function createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .insert(opportunity)
    .select()
    .single();
  if (error) throw new Error(`创建销售机会失败: ${error.message}`);
  return data as Opportunity;
}

export async function updateOpportunity(id: string, updates: Partial<InsertOpportunity>): Promise<Opportunity> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新销售机会失败: ${error.message}`);
  return data as Opportunity;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('opportunities')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除销售机会失败: ${error.message}`);
}

// ============ Activity 操作 ============

export async function getRecentActivities(limit: number = 50): Promise<Activity[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('activities')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`获取活动记录失败: ${error.message}`);
  return data as Activity[];
}

export async function createActivity(activity: InsertActivity): Promise<Activity> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('activities')
    .insert(activity)
    .select()
    .single();
  if (error) throw new Error(`创建活动记录失败: ${error.message}`);
  return data as Activity;
}

// ============ Dashboard Stats ============

export interface DashboardStats {
  totalCustomers: number;
  totalContacts: number;
  totalOpportunities: number;
  totalRevenue: number;
  wonOpportunities: number;
  activeCustomers: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = getSupabaseClient();
  
  const [customersResult, contactsResult, opportunitiesResult] = await Promise.all([
    client.from('customers').select('*', { count: 'exact', head: true }),
    client.from('contacts').select('*', { count: 'exact', head: true }),
    client.from('opportunities').select('*', { count: 'exact', head: true }),
  ]);

  if (customersResult.error) throw new Error(`统计客户失败: ${customersResult.error.message}`);
  if (contactsResult.error) throw new Error(`统计联系人失败: ${contactsResult.error.message}`);
  if (opportunitiesResult.error) throw new Error(`统计销售机会失败: ${opportunitiesResult.error.message}`);

  // 获取成交总额
  const { data: wonOpps, error: wonError } = await client
    .from('opportunities')
    .select('value')
    .eq('stage', 'closed_won');
  if (wonError) throw new Error(`获取成交机会失败: ${wonError.message}`);

  const totalRevenue = wonOpps?.reduce((sum, opp) => sum + Number(opp.value), 0) || 0;

  // 获取活跃客户数
  const { count: activeCount, error: activeError } = await client
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (activeError) throw new Error(`统计活跃客户失败: ${activeError.message}`);

  return {
    totalCustomers: customersResult.count || 0,
    totalContacts: contactsResult.count || 0,
    totalOpportunities: opportunitiesResult.count || 0,
    totalRevenue,
    wonOpportunities: wonOpps?.length || 0,
    activeCustomers: activeCount || 0,
  };
}
