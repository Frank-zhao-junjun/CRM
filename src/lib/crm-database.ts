import 'server-only';
import { createHash } from 'node:crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, InsertCustomer, Contact, InsertContact, Opportunity, InsertOpportunity, Activity, InsertActivity, FollowUp, InsertFollowUp, Notification, InsertNotification, Quote, InsertQuote, QuoteItem, InsertQuoteItem, Order, InsertOrder, OrderItem, InsertOrderItem, Contract, InsertContract, ContractMilestone, InsertContractMilestone } from '@/storage/database/shared/schema';
import type { NotificationType, Task, TaskPriority, TaskType } from '@/lib/crm-types';

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

// ============ Product 操作 (US-10 产品持久化) ============

export interface InsertProduct {
  id: string;
  name: string;
  sku: string;
  category: 'software' | 'hardware' | 'service' | 'consulting' | 'other';
  description?: string;
  unitPrice: number;
  unit: string;
  cost: number;
  stock?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: 'software' | 'hardware' | 'service' | 'consulting' | 'other';
  description: string | null;
  unit_price: string | number;
  unit: string;
  cost: string | number;
  stock: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function rowToProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description || undefined,
    unitPrice: Number(row.unit_price),
    unit: row.unit,
    cost: Number(row.cost),
    stock: row.stock ?? 0,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllProducts(): Promise<Array<ReturnType<typeof rowToProduct>>> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取产品列表失败: ${error.message}`);
  return ((data || []) as ProductRow[]).map(rowToProduct);
}

export async function getProductById(id: string): Promise<ReturnType<typeof rowToProduct> | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取产品失败: ${error.message}`);
  return data ? rowToProduct(data as ProductRow) : null;
}

export async function createProduct(product: InsertProduct): Promise<ReturnType<typeof rowToProduct>> {
  const now = new Date().toISOString();
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('products')
    .insert({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description || null,
      unit_price: product.unitPrice,
      unit: product.unit,
      cost: product.cost,
      stock: product.stock ?? 0,
      is_active: product.isActive,
      created_at: product.createdAt || now,
      updated_at: product.updatedAt || now,
    })
    .select()
    .single();
  if (error) throw new Error(`创建产品失败: ${error.message}`);
  return rowToProduct(data as ProductRow);
}

export async function updateProduct(id: string, updates: Partial<InsertProduct>): Promise<ReturnType<typeof rowToProduct>> {
  const updateData: Record<string, unknown> = {
    updated_at: updates.updatedAt || new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.sku !== undefined) updateData.sku = updates.sku;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.description !== undefined) updateData.description = updates.description || null;
  if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
  if (updates.unit !== undefined) updateData.unit = updates.unit;
  if (updates.cost !== undefined) updateData.cost = updates.cost;
  if (updates.stock !== undefined) updateData.stock = updates.stock;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新产品失败: ${error.message}`);
  return rowToProduct(data as ProductRow);
}

export async function deleteProduct(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除产品失败: ${error.message}`);
}

// ============ Opportunity 操作 (商机) ============

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
  if (error) throw new Error(`获取商机列表失败: ${error.message}`);
  return data as Opportunity[];
}

export async function getOpportunitiesByCustomerId(customerId: string): Promise<Opportunity[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`获取客户商机失败: ${error.message}`);
  return data as Opportunity[];
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取商机失败: ${error.message}`);
  return data as Opportunity | null;
}

export async function createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .insert(opportunity)
    .select()
    .single();
  if (error) throw new Error(`创建商机失败: ${error.message}`);
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
  if (error) throw new Error(`更新商机失败: ${error.message}`);
  return data as Opportunity;
}

export async function deleteOpportunity(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('opportunities')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除商机失败: ${error.message}`);
}

// ============ Activity 操作 ============

// 活动筛选参数
export interface ActivityFilters {
  entity_type?: string;
  entity_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}

// 活动分页结果
export interface ActivityListResult {
  activities: Activity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

export async function getActivities(filters: ActivityFilters = {}): Promise<ActivityListResult> {
  const client = getSupabaseClient();
  
  const {
    entity_type,
    entity_id,
    type,
    start_date,
    end_date,
    page = 1,
    pageSize = 20,
  } = filters;

  let query = client
    .from('activities')
    .select('*', { count: 'exact' });

  // 应用筛选条件
  if (entity_type) {
    query = query.eq('entity_type', entity_type);
  }
  if (entity_id) {
    query = query.eq('entity_id', entity_id);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (start_date) {
    query = query.gte('timestamp', start_date);
  }
  if (end_date) {
    query = query.lte('timestamp', end_date);
  }

  // 分页
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await query
    .order('timestamp', { ascending: false })
    .range(from, to);

  if (error) throw new Error(`获取活动列表失败: ${error.message}`);

  const total = count || 0;
  return {
    activities: data as Activity[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getActivitiesByEntityId(entityId: string): Promise<Activity[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('activities')
    .select('*')
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false });
  if (error) throw new Error(`获取实体活动失败: ${error.message}`);
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

// ============ FollowUp 操作 (V3.0) ============

export async function getAllFollowUps(): Promise<FollowUp[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取跟进记录失败: ${error.message}`);
  return data as FollowUp[];
}

export async function getFollowUpsByEntity(entityType: string, entityId: string): Promise<FollowUp[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取跟进记录失败: ${error.message}`);
  return data as FollowUp[];
}

export async function getOverdueFollowUps(): Promise<FollowUp[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .is('completed_at', null)
    .lt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(`获取逾期跟进失败: ${error.message}`);
  return data as FollowUp[];
}

export async function getUpcomingFollowUps(hours: number = 24): Promise<FollowUp[]> {
  const client = getSupabaseClient();
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .is('completed_at', null)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', future.toISOString())
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(`获取待办跟进失败: ${error.message}`);
  return data as FollowUp[];
}

export async function createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .insert(followUp)
    .select()
    .single();
  if (error) throw new Error(`创建跟进记录失败: ${error.message}`);
  return data as FollowUp;
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`完成跟进记录失败: ${error.message}`);
  return data as FollowUp;
}

// ============ Notification 操作 (V3.0) ============

export async function getAllNotifications(): Promise<Notification[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`获取通知失败: ${error.message}`);
  return data as Notification[];
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取未读通知失败: ${error.message}`);
  return data as Notification[];
}

export async function createNotification(notification: InsertNotification): Promise<Notification> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  if (error) throw new Error(`创建通知失败: ${error.message}`);
  return data as Notification;
}

export async function markNotificationRead(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error(`标记通知已读失败: ${error.message}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false);
  if (error) throw new Error(`标记全部已读失败: ${error.message}`);
}

// ============ 逾期提醒生成 (V3.0) ============

export async function generateOverdueNotifications(): Promise<number> {
  const overdue = await getOverdueFollowUps();
  let created = 0;
  for (const fu of overdue) {
    // 检查是否已存在同类通知
    const client = getSupabaseClient();
    const { data: existing } = await client
      .from('notifications')
      .select('id')
      .eq('entity_type', fu.entity_type)
      .eq('entity_id', fu.entity_id)
      .eq('type', 'overdue')
      .eq('is_read', false)
      .limit(1);
    if (existing && existing.length > 0) continue;

    await createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'overdue',
      title: '跟进逾期提醒',
      message: `${fu.entity_name} 的跟进计划已逾期，请尽快处理`,
      entity_type: fu.entity_type,
      entity_id: fu.entity_id,
      is_read: false,
    });
    created++;
  }
  return created;
}

// ============ Quote 操作 ============

export async function getAllQuotes(): Promise<Quote[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取报价单列表失败: ${error.message}`);
  return data as Quote[];
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取报价单失败: ${error.message}`);
  if (!data) return null;

  // Fetch items
  const { data: items } = await client
    .from('quote_items')
    .select('*')
    .eq('quote_id', id)
    .order('sort_order', { ascending: true });

  return { ...data, items: (items || []) as QuoteItem[] } as Quote & { items: QuoteItem[] };
}

export async function getQuotesByOpportunity(opportunityId: string): Promise<Quote[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取报价单失败: ${error.message}`);
  return data as Quote[];
}

export async function createQuote(quote: InsertQuote, items?: Omit<InsertQuoteItem, 'quote_id'>[]): Promise<Quote> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  if (error) throw new Error(`创建报价单失败: ${error.message}`);

  const createdQuote = data as Quote;

  // Insert items if provided
  if (items && items.length > 0) {
    const itemsWithQuoteId = items.map((item, index) => ({
      ...item,
      quote_id: createdQuote.id,
      sort_order: index,
    }));
    const { error: itemsError } = await client
      .from('quote_items')
      .insert(itemsWithQuoteId);
    if (itemsError) throw new Error(`创建报价明细失败: ${itemsError.message}`);
  }

  return createdQuote;
}

export async function updateQuote(id: string, updates: Partial<InsertQuote>): Promise<Quote> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新报价单失败: ${error.message}`);
  return data as Quote;
}

export async function deleteQuote(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('quotes')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除报价单失败: ${error.message}`);
}

export async function updateQuoteItems(quoteId: string, items: Omit<InsertQuoteItem, 'quote_id'>[]): Promise<QuoteItem[]> {
  const client = getSupabaseClient();
  // Delete existing items
  await client.from('quote_items').delete().eq('quote_id', quoteId);
  // Insert new items
  const itemsWithQuoteId = items.map((item, index) => ({
    ...item,
    quote_id: quoteId,
    sort_order: index,
  }));
  const { data, error } = await client
    .from('quote_items')
    .insert(itemsWithQuoteId)
    .select();
  if (error) throw new Error(`更新报价明细失败: ${error.message}`);
  return data as QuoteItem[];
}

// ============ Order 操作 ============

function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${dateStr}-${seq}`;
}

export async function getAllOrders(): Promise<Order[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取订单列表失败: ${error.message}`);
  return data as Order[];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取订单失败: ${error.message}`);
  if (!data) return null;

  // Fetch items
  const { data: items } = await client
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('sort_order', { ascending: true });

  return { ...data, items: (items || []) as OrderItem[] } as Order & { items: OrderItem[] };
}

export async function createOrder(order: Omit<InsertOrder, 'order_number'>, items?: Omit<InsertOrderItem, 'order_id'>[]): Promise<Order> {
  const client = getSupabaseClient();
  const orderNumber = generateOrderNumber();
  const { data, error } = await client
    .from('orders')
    .insert({ ...order, order_number: orderNumber })
    .select()
    .single();
  if (error) throw new Error(`创建订单失败: ${error.message}`);

  const createdOrder = data as Order;

  // Insert items if provided
  if (items && items.length > 0) {
    const itemsWithOrderId = items.map((item, index) => ({
      ...item,
      order_id: createdOrder.id,
      sort_order: index,
    }));
    const { error: itemsError } = await client
      .from('order_items')
      .insert(itemsWithOrderId);
    if (itemsError) throw new Error(`创建订单明细失败: ${itemsError.message}`);
  }

  return createdOrder;
}

export async function updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新订单失败: ${error.message}`);
  return data as Order;
}

export async function deleteOrder(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('orders')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除订单失败: ${error.message}`);
}

export async function convertQuoteToOrder(quoteId: string): Promise<Order> {
  const client = getSupabaseClient();
  
  // Fetch quote
  const { data: quoteData, error: quoteError } = await client
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();
  if (quoteError || !quoteData) throw new Error('报价单不存在');
  if (quoteData.status !== 'accepted') throw new Error('仅已接受的报价单可转为订单');

  // Fetch quote items
  const { data: quoteItemsData } = await client
    .from('quote_items')
    .select('*')
    .eq('quote_id', quoteId);

  // Get opportunity to find customer_id and customer_name
  const { data: opp } = await client
    .from('opportunities')
    .select('customer_id, customer_name')
    .eq('id', quoteData.opportunity_id)
    .maybeSingle();
  if (!opp) throw new Error('关联商机不存在');

  // Generate order number
  const timestamp = Date.now();
  const orderNumber = `ORD-${timestamp.toString(36).toUpperCase()}`;

  // Create order from quote
  const orderItems = (quoteItemsData || []).map((item: Record<string, unknown>) => ({
    product_name: item.product_name as string,
    description: item.description as string | null,
    quantity: item.quantity as number,
    unit_price: item.unit_price as string,
    discount: item.discount as string || '0',
    subtotal: item.subtotal as string,
  }));

  const order = await createOrder(
    {
      quote_id: quoteId,
      order_number: orderNumber,
      opportunity_id: quoteData.opportunity_id,
      customer_id: opp.customer_id,
      customer_name: opp.customer_name || quoteData.customer_name,
      status: 'draft', // New status: draft
      subtotal: quoteData.subtotal,
      discount: quoteData.discount || '0',
      tax: quoteData.tax,
      total: quoteData.total,
      notes: quoteData.notes,
    },
    orderItems
  );

  return order;
}

// ============ 今日待办 ============

export async function getTodayTodos(overdueDays: number = 7): Promise<{
  todayClosing: Opportunity[];
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
}> {
  const client = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  // 今日应成交: expected_close_date = today and not closed
  const { data: closingData } = await client
    .from('opportunities')
    .select('*')
    .gte('expected_close_date', `${today}T00:00:00`)
    .lte('expected_close_date', `${today}T23:59:59`)
    .not('stage', 'in', '("closed_won","closed_lost")');

  // 今日应跟进: next_follow_up_at = today and not completed
  const { data: followUpData } = await client
    .from('follow_ups')
    .select('*')
    .is('completed_at', null)
    .is('deleted_at', null)
    .gte('next_follow_up_at', `${today}T00:00:00`)
    .lte('next_follow_up_at', `${today}T23:59:59`);

  // 逾期未跟进: next_follow_up_at < today - overdueDays
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - overdueDays);
  const { data: overdueData } = await client
    .from('follow_ups')
    .select('*')
    .is('completed_at', null)
    .is('deleted_at', null)
    .lt('next_follow_up_at', overdueDate.toISOString());

  return {
    todayClosing: (closingData || []) as Opportunity[],
    todayFollowUps: (followUpData || []) as FollowUp[],
    overdueFollowUps: (overdueData || []) as FollowUp[],
  };
}

// ============ Contract 操作 (合同管理) ============

export async function getAllContracts(): Promise<Contract[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取合同列表失败: ${error.message}`);
  return data as Contract[];
}

export async function getContractById(id: string): Promise<Contract | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取合同失败: ${error.message}`);
  return data as Contract | null;
}

export async function getContractByNumber(contractNumber: string): Promise<Contract | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('contract_number', contractNumber)
    .maybeSingle();
  if (error) throw new Error(`获取合同失败: ${error.message}`);
  return data as Contract | null;
}

export async function getContractsByCustomer(customerId: string): Promise<Contract[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户合同失败: ${error.message}`);
  return data as Contract[];
}

export async function getContractsByOpportunity(opportunityId: string): Promise<Contract[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取商机合同失败: ${error.message}`);
  return data as Contract[];
}

export async function getContractsByQuote(quoteId: string): Promise<Contract[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取报价单合同失败: ${error.message}`);
  return data as Contract[];
}

export async function createContract(contract: InsertContract, milestones?: InsertContractMilestone[]): Promise<Contract> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .insert(contract)
    .select()
    .single();
  if (error) throw new Error(`创建合同失败: ${error.message}`);
  
  // 如果有履约节点，一并创建
  if (milestones && milestones.length > 0) {
    const milestonesWithContractId = milestones.map(m => ({
      ...m,
      contract_id: data.id,
    }));
    const { error: milestoneError } = await client
      .from('contract_milestones')
      .insert(milestonesWithContractId);
    if (milestoneError) throw new Error(`创建合同履约节点失败: ${milestoneError.message}`);
  }
  
  return data as Contract;
}

export async function updateContract(id: string, updates: Partial<InsertContract>): Promise<Contract> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新合同失败: ${error.message}`);
  return data as Contract;
}

export async function deleteContract(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('contracts')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除合同失败: ${error.message}`);
}

// ============ Contract Milestone 操作 (合同履约节点) ============

export async function getMilestonesByContract(contractId: string): Promise<ContractMilestone[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contract_milestones')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`获取合同履约节点失败: ${error.message}`);
  return data as ContractMilestone[];
}

export async function createMilestone(milestone: InsertContractMilestone): Promise<ContractMilestone> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contract_milestones')
    .insert(milestone)
    .select()
    .single();
  if (error) throw new Error(`创建履约节点失败: ${error.message}`);
  return data as ContractMilestone;
}

export async function updateMilestone(id: string, updates: Partial<InsertContractMilestone>): Promise<ContractMilestone> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contract_milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新履约节点失败: ${error.message}`);
  return data as ContractMilestone;
}

export async function completeMilestone(id: string): Promise<ContractMilestone> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('contract_milestones')
    .update({ 
      is_completed: true, 
      completed_date: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`完成履约节点失败: ${error.message}`);
  return data as ContractMilestone;
}

export async function deleteMilestone(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('contract_milestones')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除履约节点失败: ${error.message}`);
}

// ============ 从报价单创建合同 ============

export async function createContractFromQuote(quoteId: string, contractData?: Partial<InsertContract>): Promise<Contract> {
  // 获取报价单信息
  const quote = await getQuoteById(quoteId);
  if (!quote) throw new Error('报价单不存在');
  
  // 生成合同编号
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const contractNumber = `CT${timestamp}${random}`;
  
  // 获取商机信息
  const opp = await getOpportunityById(quote.opportunity_id);
  
  const contract = await createContract({
    id: `contract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    contract_number: contractNumber,
    customer_id: quote.customer_id,
    customer_name: quote.customer_name,
    opportunity_id: quote.opportunity_id,
    opportunity_name: opp?.title,
    quote_id: quoteId,
    quote_title: quote.title,
    status: 'draft',
    amount: quote.total,
    terms: quote.terms,
    ...contractData,
  });
  
  return contract;
}

// ============ Payment Plan (回款计划) V3.3 ============

export interface InsertPaymentPlan {
  id: string;
  plan_number: string;
  contract_id: string | null;
  contract_number: string | null;
  customer_id: string | null;
  customer_name: string | null;
  opportunity_id: string | null;
  opportunity_name: string | null;
  title: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'partial' | 'paid' | 'cancelled';
  payment_method?: string | null;
  installments?: string;
  overdue_days: number;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlan {
  id: string;
  planNumber: string;
  contractId?: string;
  contractNumber?: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'partial' | 'paid' | 'cancelled';
  paymentMethod?: string;
  installments?: unknown[];
  overdueDays: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

function transformPaymentPlan(row: Record<string, unknown>): PaymentPlan {
  const rawInstallments = typeof row.installments === 'string' ? row.installments : null;
  const installments: unknown[] = rawInstallments ? parseJsonValue<unknown[]>(rawInstallments, []) : [];
  return {
    id: String(row.id),
    planNumber: String(row.plan_number),
    contractId: (row.contract_id as string | null) || undefined,
    contractNumber: (row.contract_number as string | null) || undefined,
    customerId: (row.customer_id as string | null) || undefined,
    customerName: (row.customer_name as string | null) || undefined,
    opportunityId: (row.opportunity_id as string | null) || undefined,
    opportunityName: (row.opportunity_name as string | null) || undefined,
    title: String(row.title),
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    pendingAmount: Number(row.pending_amount),
    dueDate: String(row.due_date),
    status: row.status as PaymentPlan['status'],
    paymentMethod: (row.payment_method as string | null) || undefined,
    installments,
    overdueDays: Number(row.overdue_days || 0),
    isOverdue: Boolean(row.is_overdue || false),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAllPaymentPlans(): Promise<PaymentPlan[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function getPaymentPlanById(id: string): Promise<PaymentPlan | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`获取回款计划失败: ${error.message}`);
  return data ? transformPaymentPlan(data) : null;
}

export async function getPaymentPlansByCustomer(customerId: string): Promise<PaymentPlan[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('customer_id', customerId)
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取客户回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function getPaymentPlansByContract(contractId: string): Promise<PaymentPlan[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('contract_id', contractId)
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取合同回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .insert(plan)
    .select()
    .single();
  if (error) throw new Error(`创建回款计划失败: ${error.message}`);
  return transformPaymentPlan(data);
}

export async function updatePaymentPlan(id: string, updates: Partial<InsertPaymentPlan>): Promise<PaymentPlan> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新回款计划失败: ${error.message}`);
  return transformPaymentPlan(data);
}

export async function deletePaymentPlan(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('payment_plans')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除回款计划失败: ${error.message}`);
}

export async function getOverduePaymentPlans(): Promise<PaymentPlan[]> {
  const today = new Date().toISOString().split('T')[0];
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .not('status', 'eq', 'paid')
    .not('status', 'eq', 'cancelled')
    .lt('due_date', today)
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取逾期回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function getTodayDuePaymentPlans(): Promise<PaymentPlan[]> {
  const today = new Date().toISOString().split('T')[0];
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('due_date', today)
    .not('status', 'eq', 'paid')
    .not('status', 'eq', 'cancelled')
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取今日到期回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

/**
 * 获取阶段转化数据
 */
export async function getConversionData(timeRange: 'month' | 'quarter' | 'year' | 'all' = 'all') {
  const client = getSupabaseClient();
  
  // 计算时间范围
  const now = new Date();
  let periodStart = new Date(0);
  switch (timeRange) {
    case 'month':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      periodStart = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      periodStart = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      periodStart = new Date(0);
  }
  
  // 转化阶段配置
  const CONVERSION_STAGES = [
    { from: 'lead', to: 'qualified', label: '线索→Qualify' },
    { from: 'qualified', to: 'discovery', label: 'Qualify→调研' },
    { from: 'discovery', to: 'proposal', label: '调研→报价' },
    { from: 'proposal', to: 'negotiation', label: '报价→谈判' },
    { from: 'negotiation', to: 'contract', label: '谈判→签约' },
    { from: 'contract', to: 'closed_won', label: '签约→成交' },
  ];
  
  // 获取所有商机
  const { data: opportunities } = await client
    .from('opportunities')
    .select('*');
  
  if (!opportunities) return [];
  
  // 按阶段分组
  const stageCounts: Record<string, number> = {};
  ['lead', 'qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won', 'closed_lost'].forEach(stage => {
    stageCounts[stage] = 0;
  });
  
  opportunities.forEach(opp => {
    const created = new Date(opp.created_at);
    if (created >= periodStart) {
      stageCounts[opp.stage] = (stageCounts[opp.stage] || 0) + 1;
    }
  });
  
  // 计算转化率
  return CONVERSION_STAGES.map(conversion => {
    const fromCount = stageCounts[conversion.from] || 0;
    const toCount = stageCounts[conversion.to] || 0;
    const conversionRate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;
    
    return {
      fromStage: conversion.from,
      toStage: conversion.to,
      stageLabel: conversion.label,
      fromCount,
      toCount,
      conversionRate,
      isBottleneck: conversionRate < 30 && fromCount > 5,
    };
  });
}

// ============ 报表与 BI (V5.0) ============

// ============ 工作流自动化 (US-06) ============

export interface WorkflowEventPayload {
  triggerType: string;
  workflowId?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  data?: Record<string, unknown>;
}

const WORKFLOW_DEDUP_WINDOW_MS = 5 * 60 * 1000;
/** 每个动作最多尝试次数（含首次），即失败后最多再重试 (N-1) 次 */
const WORKFLOW_ACTION_MAX_ATTEMPTS = 3;

interface WorkflowDbRow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_entity?: string | null;
  conditions: string | null;
  actions: string | null;
  is_active: boolean;
  is_template: boolean;
  run_count: number;
  last_run_at?: string | null;
  created_at: string;
  updated_at: string;
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapWorkflowRow(row: WorkflowDbRow) {
  return {
    ...row,
    conditions: parseJsonValue<Record<string, unknown>>(row.conditions, {}),
    actions: parseJsonValue<Array<{ type: string; config?: Record<string, unknown> }>>(row.actions, []),
  };
}

export async function getAllWorkflows() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取工作流失败: ${error.message}`);
  return ((data || []) as WorkflowDbRow[]).map(mapWorkflowRow);
}

export async function getWorkflowById(id: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取工作流详情失败: ${error.message}`);
  if (!data) return null;
  return mapWorkflowRow(data as WorkflowDbRow);
}

export async function getActiveWorkflowsByTrigger(triggerType: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取触发器工作流失败: ${error.message}`);
  return ((data || []) as WorkflowDbRow[]).map(mapWorkflowRow);
}

export async function createWorkflow(input: {
  id: string;
  name: string;
  description?: string | null;
  trigger_type: string;
  trigger_entity?: string | null;
  conditions?: string;
  actions?: string;
  is_active?: boolean;
  is_template?: boolean;
  run_count?: number;
}) {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('workflows')
    .insert({
      ...input,
      description: input.description ?? null,
      trigger_entity: input.trigger_entity ?? null,
      conditions: input.conditions ?? '{}',
      actions: input.actions ?? '[]',
      is_active: input.is_active ?? true,
      is_template: input.is_template ?? false,
      run_count: input.run_count ?? 0,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(`创建工作流失败: ${error.message}`);
  return mapWorkflowRow(data as WorkflowDbRow);
}

export async function updateWorkflow(id: string, updates: Record<string, unknown>) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新工作流失败: ${error.message}`);
  return mapWorkflowRow(data as WorkflowDbRow);
}

export async function deleteWorkflow(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('workflows')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除工作流失败: ${error.message}`);
}

export async function getWorkflowLogs(workflowId?: string, limit = 20) {
  const client = getSupabaseClient();
  let query = client
    .from('workflow_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`获取工作流日志失败: ${error.message}`);
  return (data || []).map((item: Record<string, unknown>) => {
    const outputData = parseJsonValue<Record<string, unknown>>(String(item.output_data || '{}'), {});
    return {
      id: String(item.id),
      workflow_id: String(item.workflow_id),
      workflow_name: String(item.workflow_name),
      trigger_type: String(item.trigger_type),
      trigger_entity: (item.entity_type as string | null) || undefined,
      trigger_entity_id: (item.entity_id as string | null) || undefined,
      action_taken: String(outputData.actionTaken || 'none'),
      action_detail: String(item.error_message || item.output_data || ''),
      result: item.status === 'success' ? 'success' : 'failed',
      created_at: String(item.completed_at || item.started_at || ''),
    };
  });
}

function checkWorkflowConditions(
  conditions: Record<string, unknown>,
  payload: WorkflowEventPayload
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  const entityType = String(payload.entityType || '');
  if (conditions.entityType && String(conditions.entityType) !== entityType) return false;

  if (conditions.stageFrom || conditions.stageTo) {
    const oldStage = String(payload.data?.oldStage || '');
    const newStage = String(payload.data?.newStage || '');
    if (conditions.stageFrom && String(conditions.stageFrom) !== oldStage) return false;
    if (conditions.stageTo && String(conditions.stageTo) !== newStage) return false;
  }
  return true;
}

async function executeWorkflowAction(
  workflow: ReturnType<typeof mapWorkflowRow>,
  action: { type: string; config?: Record<string, unknown> },
  payload: WorkflowEventPayload
) {
  const config = action.config || {};
  switch (action.type) {
    case 'create_task': {
      const delayHours = Number(config.delayHours || 24);
      const dueDate = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();
      const task = await createTask({
        title: String(config.title || `自动任务：${payload.entityName || payload.entityType || '待处理事项'}`),
        description: String(config.description || `由工作流 "${workflow.name}" 自动创建`),
        type: (String(config.type || 'follow_up') as TaskType),
        priority: (String(config.priority || 'medium') as TaskPriority),
        status: 'pending',
        relatedType: (payload.entityType as 'customer' | 'lead' | 'opportunity' | 'contract' | 'order' | undefined),
        relatedId: payload.entityId,
        relatedName: payload.entityName,
        assigneeId: (config.assigneeId as string) || undefined,
        assigneeName: (config.assigneeName as string) || undefined,
        dueDate,
      });
      return { taskId: task.id, dueDate };
    }
    case 'send_notification': {
      const notification = await createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: (String(config.notificationType || 'info') as NotificationType),
        title: String(config.title || `工作流通知：${workflow.name}`),
        message: String(config.message || `${payload.entityName || payload.entityType || '记录'} 触发了自动化规则`),
        entity_type: (payload.entityType as string | null) || null,
        entity_id: payload.entityId || null,
        is_read: false,
      });
      return { notificationId: notification.id };
    }
    default:
      return { skipped: true, reason: `不支持的动作类型: ${action.type}` };
  }
}

function workflowDedupeFingerprint(payload: WorkflowEventPayload): string {
  const base = `${payload.triggerType}:${JSON.stringify(payload.data ?? {})}`;
  return createHash('sha256').update(base).digest('hex').slice(0, 32);
}

async function hasRecentWorkflowExecution(
  workflowId: string,
  payload: WorkflowEventPayload
): Promise<boolean> {
  const client = getSupabaseClient();
  const dedupStart = new Date(Date.now() - WORKFLOW_DEDUP_WINDOW_MS).toISOString();
  let query = client
    .from('workflow_executions')
    .select('id')
    .eq('workflow_id', workflowId)
    .eq('trigger_type', payload.triggerType)
    .eq('status', 'success')
    .gte('started_at', dedupStart)
    .limit(1);

  if (payload.entityId) {
    query = query.eq('entity_id', payload.entityId);
  } else {
    // input_data 为 TEXT：用指纹子串匹配（与写入时的 JSON 字段一致）
    const fp = workflowDedupeFingerprint(payload);
    query = query.is('entity_id', null).ilike('input_data', `%\"dedupeFingerprint\":\"${fp}\"%`);
  }

  const { data, error } = await query;
  if (error) return false;
  return Boolean(data && data.length > 0);
}

export async function executeWorkflowEngine(payload: WorkflowEventPayload): Promise<number> {
  const client = getSupabaseClient();
  const workflows = payload.workflowId
    ? (await Promise.all([getWorkflowById(payload.workflowId)])).filter((w) => w && w.is_active) as ReturnType<typeof mapWorkflowRow>[]
    : await getActiveWorkflowsByTrigger(payload.triggerType);
  if (workflows.length === 0) return 0;

  let executedCount = 0;
  for (const workflow of workflows) {
    const conditions = parseJsonValue<Record<string, unknown>>(workflow.conditions, {});
    if (!checkWorkflowConditions(conditions, payload)) {
      continue;
    }

    const actions = parseJsonValue<Array<{ type: string; config?: Record<string, unknown> }>>(workflow.actions, []);
    if (actions.length === 0) {
      continue;
    }

    // 幂等：有 entityId 按实体去重；无 entityId 按 input_data 内指纹去重
    if (await hasRecentWorkflowExecution(workflow.id, payload)) {
      continue;
    }

    const executionId = `wfl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const runStarted = Date.now();
    const inputPayload = {
      ...(payload.data || {}),
      ...(!payload.entityId ? { dedupeFingerprint: workflowDedupeFingerprint(payload) } : {}),
    };
    let result: 'success' | 'failed' = 'success';
    const actionSummaries: Array<{ type: string; ok: boolean; detail?: string }> = [];

    const { error: startErr } = await client.from('workflow_executions').insert({
      id: executionId,
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      trigger_type: payload.triggerType,
      entity_type: payload.entityType || null,
      entity_id: payload.entityId || null,
      entity_name: payload.entityName || null,
      status: 'running',
      input_data: JSON.stringify(inputPayload),
      output_data: '{}',
      error_message: null,
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_ms: null,
    });
    if (startErr) {
      console.error('[workflow] 创建执行记录失败:', startErr);
      continue;
    }

    try {
      for (let index = 0; index < actions.length; index += 1) {
        const action = actions[index];
        const logId = `wflog_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const logStarted = Date.now();
        let actionResult: Record<string, unknown> = {};
        let lastErr: Error | null = null;

        for (let attempt = 1; attempt <= WORKFLOW_ACTION_MAX_ATTEMPTS; attempt += 1) {
          try {
            actionResult = (await executeWorkflowAction(workflow, action, payload)) as Record<string, unknown>;
            lastErr = null;
            break;
          } catch (error) {
            lastErr = error as Error;
          }
        }

        const logStatus = lastErr ? 'failed' : 'success';
        await client.from('workflow_execution_logs').insert({
          id: logId,
          execution_id: executionId,
          action_index: index,
          action_type: action.type,
          action_name: action.type,
          status: logStatus,
          input_data: JSON.stringify({ config: action.config || {}, attemptMax: WORKFLOW_ACTION_MAX_ATTEMPTS }),
          output_data: lastErr ? '{}' : JSON.stringify(actionResult),
          error_message: lastErr ? lastErr.message : null,
          started_at: new Date(logStarted).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - logStarted,
        });

        if (lastErr) {
          actionSummaries.push({ type: action.type, ok: false, detail: lastErr.message });
          throw new Error(`动作执行失败(${action.type}): ${lastErr.message}`);
        }
        actionSummaries.push({ type: action.type, ok: true, detail: JSON.stringify(actionResult) });
      }

      await client
        .from('workflows')
        .update({
          run_count: Number(workflow.run_count || 0) + 1,
          last_run_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow.id);
    } catch (error) {
      result = 'failed';
      actionSummaries.push({ type: '_error', ok: false, detail: (error as Error).message });
    }

    const durationMs = Date.now() - runStarted;
    const finalDetail =
      result === 'failed'
        ? actionSummaries.filter((s) => !s.ok).map((s) => s.detail).filter(Boolean).join(' | ')
        : JSON.stringify({ actions: actionSummaries });

    await client
      .from('workflow_executions')
      .update({
        status: result,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        output_data: JSON.stringify({ actions: actionSummaries }),
        error_message: result === 'failed' ? finalDetail : null,
      })
      .eq('id', executionId);

    executedCount += 1;
  }

  return executedCount;
}

export async function seedWorkflowTemplates(): Promise<void> {
  const templates = [
    {
      name: '新线索自动跟进任务',
      description: '线索创建后自动创建24小时内跟进任务',
      trigger_type: 'lead_created',
      trigger_entity: 'lead',
      actions: JSON.stringify([
        {
          type: 'create_task',
          config: {
            title: '跟进新线索',
            description: '请在24小时内完成首次触达',
            priority: 'high',
            delayHours: 24,
          },
        },
      ]),
    },
    {
      name: '商机创建自动提醒',
      description: '商机创建后通知销售经理',
      trigger_type: 'opportunity_created',
      trigger_entity: 'opportunity',
      actions: JSON.stringify([
        {
          type: 'send_notification',
          config: {
            notificationType: 'info',
            title: '新商机提醒',
            message: '系统检测到新商机已创建，请关注推进节奏',
          },
        },
      ]),
    },
    {
      name: '商机进入谈判阶段任务',
      description: '商机从方案报价进入商务谈判时自动创建重点任务',
      trigger_type: 'opportunity_stage_changed',
      trigger_entity: 'opportunity',
      conditions: JSON.stringify({ stageTo: 'negotiation' }),
      actions: JSON.stringify([
        {
          type: 'create_task',
          config: {
            title: '准备商务谈判策略',
            priority: 'urgent',
            delayHours: 12,
          },
        },
        {
          type: 'send_notification',
          config: {
            notificationType: 'stage_change',
            title: '商机进入谈判阶段',
            message: '请同步法务与销售经理，提前准备条款与让步策略',
          },
        },
      ]),
    },
  ];

  const exists = await getAllWorkflows();
  const existingNames = new Set(exists.map((w) => w.name));
  for (const t of templates) {
    if (existingNames.has(t.name)) continue;
    await createWorkflow({
      id: `wf_tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: t.name,
      description: t.description,
      trigger_type: t.trigger_type,
      trigger_entity: t.trigger_entity,
      conditions: t.conditions || '{}',
      actions: t.actions,
      is_active: true,
      is_template: true,
      run_count: 0,
    });
  }
}

function getPeriodStart(timeRange: 'month' | 'quarter' | 'year' | 'all'): Date {
  const now = new Date();
  switch (timeRange) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0);
  }
}

export async function getReportStats(timeRange: 'month' | 'quarter' | 'year' | 'all' = 'all') {
  const client = getSupabaseClient();
  const periodStart = getPeriodStart(timeRange);
  const periodStartIso = periodStart.toISOString();
  const nowIso = new Date().toISOString();

  const { data: opportunities, error: oppError } = await client
    .from('opportunities')
    .select('id, value, stage, created_at, updated_at')
    .gte('created_at', periodStartIso)
    .lte('created_at', nowIso);
  if (oppError) throw new Error(`获取报表统计失败: ${oppError.message}`);

  const { count: leadsCount, error: leadError } = await client
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', periodStartIso)
    .lte('created_at', nowIso);
  if (leadError) throw new Error(`获取线索统计失败: ${leadError.message}`);

  const { count: customerCount, error: customerError } = await client
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', periodStartIso)
    .lte('created_at', nowIso);
  if (customerError) throw new Error(`获取客户统计失败: ${customerError.message}`);

  const opps = opportunities || [];
  const activeOpps = opps.filter((o) => !['closed_won', 'closed_lost'].includes(o.stage));
  const wonOpps = opps.filter((o) => o.stage === 'closed_won');

  const totalPipeline = activeOpps.reduce((sum, o) => sum + Number(o.value || 0), 0);
  const totalWon = wonOpps.reduce((sum, o) => sum + Number(o.value || 0), 0);
  const conversionRate = opps.length > 0 ? (wonOpps.length / opps.length) * 100 : 0;

  return {
    totalPipeline,
    totalWon,
    activeOpportunities: activeOpps.length,
    wonOpportunities: wonOpps.length,
    totalLeads: leadsCount || 0,
    totalCustomers: customerCount || 0,
    conversionRate,
    avgDealSize: wonOpps.length > 0 ? totalWon / wonOpps.length : 0,
    periodStart: periodStartIso,
    periodEnd: nowIso,
  };
}

export async function getFunnelData(timeRange: 'month' | 'quarter' | 'year' | 'all' = 'all') {
  const client = getSupabaseClient();
  const periodStartIso = getPeriodStart(timeRange).toISOString();
  const { data, error } = await client
    .from('opportunities')
    .select('id, stage, value')
    .gte('created_at', periodStartIso);
  if (error) throw new Error(`获取漏斗数据失败: ${error.message}`);

  const stageOrder = ['qualified', 'discovery', 'proposal', 'negotiation', 'contract'];
  const stageLabels: Record<string, string> = {
    qualified: '已Qualify',
    discovery: '需求调研',
    proposal: '方案报价',
    negotiation: '商务谈判',
    contract: '合同签署',
  };

  const items = data || [];
  const baseCount = Math.max(items.length, 1);
  return stageOrder.map((stage, idx) => {
    const matched = items.filter((o) => o.stage === stage);
    const amount = matched.reduce((sum, o) => sum + Number(o.value || 0), 0);
    return {
      stage,
      stageLabel: stageLabels[stage],
      count: matched.length,
      amount,
      avgDays: (idx + 1) * 5,
      conversionRate: (matched.length / baseCount) * 100,
    };
  });
}

export async function getTeamRankingData(timeRange: 'month' | 'quarter' | 'year' | 'all' = 'all') {
  const client = getSupabaseClient();
  const periodStartIso = getPeriodStart(timeRange).toISOString();
  const { data, error } = await client
    .from('opportunities')
    .select('id, customer_name, stage, value')
    .gte('created_at', periodStartIso);
  if (error) throw new Error(`获取团队排行失败: ${error.message}`);

  const members = ['华北团队', '华东团队', '华南团队', '西南团队'];
  const seeded = members.map((name, idx) => ({
    memberId: `team_${idx + 1}`,
    memberName: name,
    wonAmount: 0,
    wonCount: 0,
    newOpportunities: 0,
    pipelineAmount: 0,
    conversionRate: 0,
    avgDealSize: 0,
  }));

  (data || []).forEach((opp, idx) => {
    const member = seeded[idx % seeded.length];
    const value = Number(opp.value || 0);
    member.newOpportunities += 1;
    if (opp.stage === 'closed_won') {
      member.wonAmount += value;
      member.wonCount += 1;
    } else if (!['closed_lost'].includes(opp.stage)) {
      member.pipelineAmount += value;
    }
  });

  seeded.forEach((m) => {
    m.conversionRate = m.newOpportunities > 0 ? (m.wonCount / m.newOpportunities) * 100 : 0;
    m.avgDealSize = m.wonCount > 0 ? m.wonAmount / m.wonCount : 0;
  });

  return seeded.sort((a, b) => b.wonAmount - a.wonAmount);
}

export async function getBIDashboardData(timeRange: 'month' | 'quarter' | 'year' | 'all' = 'all') {
  const reportStats = await getReportStats(timeRange);
  const funnel = await getFunnelData(timeRange);
  const ranking = await getTeamRankingData(timeRange);
  const conversion = await getConversionData(timeRange);

  const now = new Date();
  const trend = Array.from({ length: 6 }).map((_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      period: `${d.getMonth() + 1}月`,
      pipeline: Math.round(reportStats.totalPipeline * (0.6 + index * 0.08)),
      won: Math.round(reportStats.totalWon * (0.5 + index * 0.1)),
    };
  });

  return {
    kpi: {
      ...reportStats,
      winRate: reportStats.conversionRate,
      forecastAccuracy: reportStats.totalPipeline > 0 ? (reportStats.totalWon / reportStats.totalPipeline) * 100 : 0,
    },
    trend,
    funnel,
    ranking: ranking.slice(0, 5),
    conversion,
    generatedAt: new Date().toISOString(),
  };
}

// ============ 任务管理数据库操作 (V4.1 新增) ============
export interface InsertTask {
  title: string;
  description?: string;
  type: 'follow_up' | 'meeting' | 'call' | 'email' | 'demo' | 'proposal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId?: string;
  assigneeName?: string;
  relatedType?: 'customer' | 'lead' | 'opportunity' | 'contract' | 'order';
  relatedId?: string;
  relatedName?: string;
  dueDate: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description?: string;
  type: 'follow_up' | 'meeting' | 'call' | 'email' | 'demo' | 'proposal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee_id?: string;
  assignee_name?: string;
  related_type?: 'customer' | 'lead' | 'opportunity' | 'contract' | 'order';
  related_id?: string;
  related_name?: string;
  due_date: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getAllTasks(): Promise<Task[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('获取任务列表失败:', error);
    return [];
  }

  return (data as TaskRow[])?.map(rowToTask) || [];
}

export async function getTaskById(id: string): Promise<Task | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取任务详情失败:', error);
    return null;
  }

  return data ? rowToTask(data as TaskRow) : null;
}

export async function createTask(task: InsertTask): Promise<Task> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      status: task.status || 'pending',
      assignee_id: task.assigneeId,
      assignee_name: task.assigneeName,
      related_type: task.relatedType,
      related_id: task.relatedId,
      related_name: task.relatedName,
      due_date: task.dueDate,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) {
    console.error('创建任务失败:', error);
    throw error;
  }

  return rowToTask(data as TaskRow);
}

export async function updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { updated_at: now };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.assigneeId !== undefined) updateData.assignee_id = updates.assigneeId;
  if (updates.assigneeName !== undefined) updateData.assignee_name = updates.assigneeName;
  if (updates.relatedType !== undefined) updateData.related_type = updates.relatedType;
  if (updates.relatedId !== undefined) updateData.related_id = updates.relatedId;
  if (updates.relatedName !== undefined) updateData.related_name = updates.relatedName;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

  const { data, error } = await client
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新任务失败:', error);
    throw error;
  }

  return rowToTask(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    relatedType: row.related_type,
    relatedId: row.related_id,
    relatedName: row.related_name,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
