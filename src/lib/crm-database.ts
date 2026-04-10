import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, InsertCustomer, Contact, InsertContact, Opportunity, InsertOpportunity, Activity, InsertActivity } from '@/storage/database/shared/schema';

// CRM 数据库服务 - 支持线索管理

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

// ============ Sales Lead 操作 (销售线索) ============

export interface SalesLead {
  id: string;
  title: string;
  source: string;
  customer_id: string;
  customer_name: string;
  contact_id?: string;
  contact_name?: string;
  estimated_value: number;
  probability: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InsertSalesLead {
  id: string;
  title: string;
  source: string;
  customer_id: string;
  customer_name: string;
  contact_id?: string;
  contact_name?: string;
  estimated_value: number;
  probability?: number;
  status?: string;
  notes?: string;
}

export async function getAllLeads(): Promise<SalesLead[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取销售线索列表失败: ${error.message}`);
  return data as SalesLead[];
}

export async function getLeadById(id: string): Promise<SalesLead | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取销售线索失败: ${error.message}`);
  return data as SalesLead | null;
}

export async function getLeadsByCustomerId(customerId: string): Promise<SalesLead[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户销售线索失败: ${error.message}`);
  return data as SalesLead[];
}

export async function createLead(lead: InsertSalesLead): Promise<SalesLead> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .insert({
      id: lead.id,
      title: lead.title,
      source: lead.source,
      customer_id: lead.customer_id,
      customer_name: lead.customer_name,
      contact_id: lead.contact_id || null,
      contact_name: lead.contact_name || null,
      estimated_value: lead.estimated_value,
      probability: lead.probability ?? 10,
      status: lead.status ?? 'new',
      notes: lead.notes || null,
    })
    .select()
    .single();
  if (error) throw new Error(`创建销售线索失败: ${error.message}`);
  return data as SalesLead;
}

export async function updateLead(id: string, updates: Partial<InsertSalesLead>): Promise<SalesLead> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString(),
      contact_id: updates.contact_id || null,
      contact_name: updates.contact_name || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新销售线索失败: ${error.message}`);
  return data as SalesLead;
}

export async function deleteLead(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('leads')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除销售线索失败: ${error.message}`);
}

// ============ Opportunity 操作 (销售机会) ============

export async function getAllOpportunities(excludeLead: boolean = false): Promise<Opportunity[]> {
  const client = getSupabaseClient();
  let query = client
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (excludeLead) {
    query = query.neq('stage', 'lead');
  }
  
  const { data, error } = await query;
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

// ============ 统计数据 ============

export async function getDashboardStats(): Promise<{
  totalCustomers: number;
  totalContacts: number;
  totalLeads: number;
  totalOpportunities: number;
  totalRevenue: number;
  wonOpportunities: number;
  activeCustomers: number;
}> {
  const client = getSupabaseClient();
  
  const [
    customersResult,
    contactsResult,
    leadsResult,
    opportunitiesResult,
    wonResult,
    activeCustomersResult,
  ] = await Promise.all([
    client.from('customers').select('count', { count: 'exact' }),
    client.from('contacts').select('count', { count: 'exact' }),
    client.from('leads').select('count', { count: 'exact' }).neq('status', 'disqualified'),
    client.from('opportunities').select('count', { count: 'exact' }).neq('stage', 'lead'),
    client.from('opportunities').select('count', { count: 'exact' }).eq('stage', 'closed_won'),
    client.from('customers').select('count', { count: 'exact' }).eq('status', 'active'),
  ]);

  // 计算成交总额
  const { data: wonOpps } = await client
    .from('opportunities')
    .select('value')
    .eq('stage', 'closed_won');
  
  const totalRevenue = wonOpps?.reduce((sum, opp) => sum + Number(opp.value), 0) || 0;

  return {
    totalCustomers: customersResult.count || 0,
    totalContacts: contactsResult.count || 0,
    totalLeads: leadsResult.count || 0,
    totalOpportunities: opportunitiesResult.count || 0,
    totalRevenue,
    wonOpportunities: wonResult.count || 0,
    activeCustomers: activeCustomersResult.count || 0,
  };
}
