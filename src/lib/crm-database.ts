import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, InsertCustomer, Contact, InsertContact, Opportunity, InsertOpportunity, Activity, InsertActivity, FollowUp, InsertFollowUp, Notification, InsertNotification, Quote, InsertQuote, QuoteItem, InsertQuoteItem, Order, InsertOrder, OrderItem, InsertOrderItem, Contract, InsertContract, ContractMilestone, InsertContractMilestone, Invoice, InsertInvoice } from '@/storage/database/shared/schema';

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

// 按客户ID获取报价单（用于客户360视图）
export async function getQuotesByCustomer(customerId: string): Promise<Quote[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户报价单失败: ${error.message}`);
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

// 按客户ID获取订单（用于客户360视图）
export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户订单失败: ${error.message}`);
  return data as Order[];
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
  installments?: any[];
  overdueDays: number;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

function transformPaymentPlan(row: any): PaymentPlan {
  return {
    id: row.id,
    planNumber: row.plan_number,
    contractId: row.contract_id,
    contractNumber: row.contract_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    opportunityId: row.opportunity_id,
    opportunityName: row.opportunity_name,
    title: row.title,
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    pendingAmount: Number(row.pending_amount),
    dueDate: row.due_date,
    status: row.status,
    paymentMethod: row.payment_method,
    installments: row.installments ? JSON.parse(row.installments) : [],
    overdueDays: row.overdue_days || 0,
    isOverdue: row.is_overdue || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function getAllTasks(): Promise<any[]> {
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

export async function getTaskById(id: string): Promise<any | null> {
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

// 按客户ID获取任务（用于客户360视图）
export async function getTasksByCustomer(customerId: string): Promise<any[]> {
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('related_id', customerId)
    .eq('related_type', 'customer')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('获取客户任务失败:', error);
    return [];
  }

  return (data as TaskRow[])?.map(rowToTask) || [];
}

export async function createTask(task: InsertTask): Promise<any> {
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

export async function updateTask(id: string, updates: Partial<InsertTask>): Promise<any> {
  const now = new Date().toISOString();
  const updateData: Record<string, any> = { updated_at: now };

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
  const { error } = await client
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除任务失败:', error);
    throw error;
  }
}

function rowToTask(row: TaskRow): any {
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

// ============ Invoice 操作 ============

export async function getAllInvoices(): Promise<Invoice[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取发票列表失败: ${error.message}`);
  return data as Invoice[];
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取发票失败: ${error.message}`);
  return data as Invoice | null;
}

// 按客户ID获取发票（用于客户360视图）
export async function getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('invoices')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户发票失败: ${error.message}`);
  return data as Invoice[];
}

export async function createInvoice(invoice: InsertInvoice): Promise<Invoice> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('invoices')
    .insert(invoice)
    .select()
    .single();
  if (error) throw new Error(`创建发票失败: ${error.message}`);
  return data as Invoice;
}

export async function updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新发票失败: ${error.message}`);
  return data as Invoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('invoices')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除发票失败: ${error.message}`);
}

// ============ Workflow Automation ============

export interface WorkflowTrigger {
  triggerType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  data?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_entity: string;
  conditions: string;
  actions: string;
  is_active: boolean;
  is_template: boolean;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowLog {
  id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  status: string;
  executed_actions: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export async function getAllWorkflows(): Promise<Workflow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取工作流列表失败: ${error.message}`);
  return data as Workflow[];
}

export async function getWorkflowById(id: string): Promise<Workflow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取工作流失败: ${error.message}`);
  return data as Workflow | null;
}

export async function getActiveWorkflowsByTrigger(triggerType: string): Promise<Workflow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取工作流列表失败: ${error.message}`);
  return data as Workflow[];
}

export async function createWorkflow(workflow: Omit<Workflow, 'created_at' | 'updated_at'>): Promise<Workflow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .insert(workflow)
    .select()
    .single();
  if (error) throw new Error(`创建工作流失败: ${error.message}`);
  return data as Workflow;
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('workflows')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新工作流失败: ${error.message}`);
  return data as Workflow;
}

export async function deleteWorkflow(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('workflows')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除工作流失败: ${error.message}`);
}

export async function getWorkflowLogs(workflowId?: string, limit: number = 20): Promise<WorkflowLog[]> {
  const client = getSupabaseClient();
  let query = client
    .from('workflow_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  
  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(`获取工作流日志失败: ${error.message}`);
  return data as WorkflowLog[];
}

export async function seedWorkflowTemplates(): Promise<void> {
  const client = getSupabaseClient();
  
  // Check if templates already exist
  const { data: existing } = await client
    .from('workflows')
    .select('id')
    .eq('is_template', true)
    .limit(1);
  
  if (existing && existing.length > 0) {
    return; // Templates already seeded
  }
  
  const templates = [
    {
      id: `wf_tpl_${Date.now()}_1`,
      name: '线索创建通知',
      description: '当创建新的销售线索时，自动发送邮件通知销售负责人',
      trigger_type: 'lead_created',
      trigger_entity: 'lead',
      conditions: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'send_email', config: { subject: '新线索通知', template: 'lead_notification' } }
      ]),
      is_active: true,
      is_template: true,
      run_count: 0,
    },
    {
      id: `wf_tpl_${Date.now()}_2`,
      name: '商机阶段变更通知',
      description: '当商机阶段变更时，通知相关人员',
      trigger_type: 'opportunity_stage_changed',
      trigger_entity: 'opportunity',
      conditions: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'send_notification', config: { message: '商机阶段已更新' } }
      ]),
      is_active: true,
      is_template: true,
      run_count: 0,
    },
  ];
  
  const { error } = await client
    .from('workflows')
    .insert(templates);
  
  if (error) throw new Error(`初始化工作流模板失败: ${error.message}`);
}

export async function executeWorkflowEngine(trigger: WorkflowTrigger): Promise<number> {
  const client = getSupabaseClient();
  
  try {
    // Get active workflows for this trigger type
    const workflows = await getActiveWorkflowsByTrigger(trigger.triggerType);
    
    let executedCount = 0;
    
    for (const workflow of workflows) {
      try {
        const actions = JSON.parse(workflow.actions);
        
        // Execute each action
        for (const action of actions) {
          await executeWorkflowAction(client, action, trigger);
        }
        
        // Update run count
        await client
          .from('workflows')
          .update({ run_count: workflow.run_count + 1 })
          .eq('id', workflow.id);
        
        // Log execution
        await client
          .from('workflow_logs')
          .insert({
            id: `wflog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            trigger_type: trigger.triggerType,
            entity_type: trigger.entityType,
            entity_id: trigger.entityId,
            entity_name: trigger.entityName,
            status: 'completed',
            executed_actions: actions.length,
            error_message: null,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          });
        
        executedCount++;
      } catch (actionError) {
        console.error(`Workflow ${workflow.id} execution failed:`, actionError);
        
        // Log failed execution
        await client
          .from('workflow_logs')
          .insert({
            id: `wflog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            trigger_type: trigger.triggerType,
            entity_type: trigger.entityType,
            entity_id: trigger.entityId,
            entity_name: trigger.entityName,
            status: 'failed',
            executed_actions: 0,
            error_message: (actionError as Error).message,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          });
      }
    }
    
    return executedCount;
  } catch (error) {
    console.error('Workflow engine error:', error);
    return 0;
  }
}

async function executeWorkflowAction(
  client: ReturnType<typeof getSupabaseClient>,
  action: { type: string; config: Record<string, unknown> },
  trigger: WorkflowTrigger
): Promise<void> {
  switch (action.type) {
    case 'send_email':
      // Email sending would be implemented here
      console.log(`[Workflow] Sending email:`, action.config);
      break;
    case 'send_notification':
      // Notification would be implemented here
      console.log(`[Workflow] Sending notification:`, action.config);
      break;
    case 'update_field':
      // Field update would be implemented here
      console.log(`[Workflow] Updating field:`, action.config);
      break;
    case 'create_task':
      // Task creation would be implemented here
      console.log(`[Workflow] Creating task:`, action.config);
      break;
    default:
      console.warn(`[Workflow] Unknown action type: ${action.type}`);
  }
}
