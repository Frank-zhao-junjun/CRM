import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, InsertCustomer, Contact, InsertContact, Opportunity, InsertOpportunity, Activity, InsertActivity, FollowUp, InsertFollowUp, Notification, InsertNotification, Quote, InsertQuote, QuoteItem, InsertQuoteItem, Order, InsertOrder, OrderItem, InsertOrderItem, Contract, InsertContract, ContractMilestone, InsertContractMilestone, Reminder, InsertReminder } from '@/storage/database/shared/schema';

// CRM 数据库服务 - 支持线索管理

// ============ Customer 操作 ============

export async function getAllCustomers(): Promise<Customer[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户列表失败: ${error.message}`);
  return data as Customer[];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取客户失败: ${error.message}`);
  return data as Customer | null;
}

export async function createCustomer(customer: InsertCustomer): Promise<Customer> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('customers')
    .insert(customer)
    .select()
    .single();
  if (error) throw new Error(`创建客户失败: ${error.message}`);
  return data as Customer;
}

export async function updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { error } = await client
    .from('customers')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除客户失败: ${error.message}`);
}

// ============ Contact 操作 ============

export async function getAllContacts(): Promise<Contact[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取联系人列表失败: ${error.message}`);
  return data as Contact[];
}

export async function getContactsByCustomerId(customerId: string): Promise<Contact[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_primary', { ascending: false });
  if (error) throw new Error(`获取客户联系人失败: ${error.message}`);
  return data as Contact[];
}

export async function getContactById(id: string): Promise<Contact | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取联系人失败: ${error.message}`);
  return data as Contact | null;
}

export async function createContact(contact: InsertContact): Promise<Contact> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contacts')
    .insert(contact)
    .select()
    .single();
  if (error) throw new Error(`创建联系人失败: ${error.message}`);
  return data as Contact;
}

export async function updateContact(id: string, updates: Partial<InsertContact>): Promise<Contact> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取销售线索列表失败: ${error.message}`);
  return data as SalesLead[];
}

export async function getLeadById(id: string): Promise<SalesLead | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取销售线索失败: ${error.message}`);
  return data as SalesLead | null;
}

export async function getLeadsByCustomerId(customerId: string): Promise<SalesLead[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户销售线索失败: ${error.message}`);
  return data as SalesLead[];
}

export async function createLead(lead: InsertSalesLead): Promise<SalesLead> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { error } = await client
    .from('leads')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除销售线索失败: ${error.message}`);
}

// ============ Opportunity 操作 (商机) ============

export async function getAllOpportunities(excludeLead: boolean = false): Promise<Opportunity[]> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`获取客户商机失败: ${error.message}`);
  return data as Opportunity[];
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取商机失败: ${error.message}`);
  return data as Opportunity | null;
}

export async function createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('opportunities')
    .insert(opportunity)
    .select()
    .single();
  if (error) throw new Error(`创建商机失败: ${error.message}`);
  return data as Opportunity;
}

export async function updateOpportunity(id: string, updates: Partial<InsertOpportunity>): Promise<Opportunity> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('activities')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`获取活动记录失败: ${error.message}`);
  return data as Activity[];
}

export async function getActivities(filters: ActivityFilters = {}): Promise<ActivityListResult> {
  const client = await getSupabaseClient();
  
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('activities')
    .select('*')
    .eq('entity_id', entityId)
    .order('timestamp', { ascending: false });
  if (error) throw new Error(`获取实体活动失败: ${error.message}`);
  return data as Activity[];
}

export async function createActivity(activity: InsertActivity): Promise<Activity> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取跟进记录失败: ${error.message}`);
  return data as FollowUp[];
}

export async function getFollowUpsByEntity(entityType: string, entityId: string): Promise<FollowUp[]> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('follow_ups')
    .insert(followUp)
    .select()
    .single();
  if (error) throw new Error(`创建跟进记录失败: ${error.message}`);
  return data as FollowUp;
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`获取通知失败: ${error.message}`);
  return data as Notification[];
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取未读通知失败: ${error.message}`);
  return data as Notification[];
}

export async function createNotification(notification: InsertNotification): Promise<Notification> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  if (error) throw new Error(`创建通知失败: ${error.message}`);
  return data as Notification;
}

export async function markNotificationRead(id: string): Promise<void> {
  const client = await getSupabaseClient();
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error(`标记通知已读失败: ${error.message}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const client = await getSupabaseClient();
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
    const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取报价单列表失败: ${error.message}`);
  return data as Quote[];
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('quotes')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取报价单失败: ${error.message}`);
  return data as Quote[];
}

export async function createQuote(quote: InsertQuote, items?: Omit<InsertQuoteItem, 'quote_id'>[]): Promise<Quote> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { error } = await client
    .from('quotes')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除报价单失败: ${error.message}`);
}

export async function updateQuoteItems(quoteId: string, items: Omit<InsertQuoteItem, 'quote_id'>[]): Promise<QuoteItem[]> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取订单列表失败: ${error.message}`);
  return data as Order[];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { error } = await client
    .from('orders')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除订单失败: ${error.message}`);
}

export async function convertQuoteToOrder(quoteId: string): Promise<Order> {
  const client = await getSupabaseClient();
  
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取合同列表失败: ${error.message}`);
  return data as Contract[];
}

export async function getContractById(id: string): Promise<Contract | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取合同失败: ${error.message}`);
  return data as Contract | null;
}

export async function getContractByNumber(contractNumber: string): Promise<Contract | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('contract_number', contractNumber)
    .maybeSingle();
  if (error) throw new Error(`获取合同失败: ${error.message}`);
  return data as Contract | null;
}

export async function getContractsByCustomer(customerId: string): Promise<Contract[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取客户合同失败: ${error.message}`);
  return data as Contract[];
}

export async function getContractsByOpportunity(opportunityId: string): Promise<Contract[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取商机合同失败: ${error.message}`);
  return data as Contract[];
}

export async function getContractsByQuote(quoteId: string): Promise<Contract[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contracts')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取报价单合同失败: ${error.message}`);
  return data as Contract[];
}

export async function createContract(contract: InsertContract, milestones?: InsertContractMilestone[]): Promise<Contract> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { error } = await client
    .from('contracts')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除合同失败: ${error.message}`);
}

// ============ Contract Milestone 操作 (合同履约节点) ============

export async function getMilestonesByContract(contractId: string): Promise<ContractMilestone[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contract_milestones')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(`获取合同履约节点失败: ${error.message}`);
  return data as ContractMilestone[];
}

export async function createMilestone(milestone: InsertContractMilestone): Promise<ContractMilestone> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('contract_milestones')
    .insert(milestone)
    .select()
    .single();
  if (error) throw new Error(`创建履约节点失败: ${error.message}`);
  return data as ContractMilestone;
}

export async function updateMilestone(id: string, updates: Partial<InsertContractMilestone>): Promise<ContractMilestone> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function getPaymentPlanById(id: string): Promise<PaymentPlan | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`获取回款计划失败: ${error.message}`);
  return data ? transformPaymentPlan(data) : null;
}

export async function getPaymentPlansByCustomer(customerId: string): Promise<PaymentPlan[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('customer_id', customerId)
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取客户回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function getPaymentPlansByContract(contractId: string): Promise<PaymentPlan[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .select('*')
    .eq('contract_id', contractId)
    .order('due_date', { ascending: true });
  if (error) throw new Error(`获取合同回款计划失败: ${error.message}`);
  return data.map(transformPaymentPlan);
}

export async function createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('payment_plans')
    .insert(plan)
    .select()
    .single();
  if (error) throw new Error(`创建回款计划失败: ${error.message}`);
  return transformPaymentPlan(data);
}

export async function updatePaymentPlan(id: string, updates: Partial<InsertPaymentPlan>): Promise<PaymentPlan> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  const { error } = await client
    .from('payment_plans')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除回款计划失败: ${error.message}`);
}

export async function getOverduePaymentPlans(): Promise<PaymentPlan[]> {
  const today = new Date().toISOString().split('T')[0];
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
  
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
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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

export async function createTask(task: InsertTask): Promise<any> {
  const client = await getSupabaseClient();
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

// ============ Workflow Functions (工作流功能 - 需要数据库表支持) ============

export async function getAllWorkflows(): Promise<any[]> {
  // 工作流功能需要数据库表支持，目前返回空数组
  console.log('[Workflow] getAllWorkflows - needs database table');
  return [];
}

export async function getWorkflowById(id: string): Promise<any | null> {
  console.log('[Workflow] getWorkflowById - needs database table');
  return null;
}

export async function getWorkflowLogs(workflowId: string): Promise<any[]> {
  console.log('[Workflow] getWorkflowLogs - needs database table');
  return [];
}

export async function createWorkflow(workflow: any): Promise<any> {
  console.log('[Workflow] createWorkflow - needs database table');
  return workflow;
}

export async function updateWorkflow(id: string, updates: any): Promise<any> {
  console.log('[Workflow] updateWorkflow - needs database table');
  return updates;
}

export async function deleteWorkflow(id: string): Promise<void> {
  console.log('[Workflow] deleteWorkflow - needs database table');
}

export async function seedWorkflowTemplates(): Promise<void> {
  console.log('[Workflow] seedWorkflowTemplates - needs database table');
}

export async function executeWorkflowEngine(params: {
  triggerType: string;
  entityType: string;
  entityId: string;
  entityName: string;
}): Promise<void> {
  // 工作流执行引擎 (stub)
  console.log('[Workflow Engine] Trigger:', params.triggerType, 'Entity:', params.entityType, params.entityId);
}

// ============ Report Functions (报表功能) ============

export async function getReportStats(timeRange: string): Promise<any> {
  console.log('[Report] getReportStats - needs database table');
  return {
    totalRevenue: 0,
    totalOpportunities: 0,
    wonOpportunities: 0,
    conversionRate: 0,
  };
}

export async function getTeamRankingData(timeRange: string): Promise<any[]> {
  console.log('[Report] getTeamRankingData - needs database table');
  return [];
}

export async function getFunnelData(timeRange: string): Promise<any[]> {
  console.log('[Report] getFunnelData - needs database table');
  return [];
}

// ============ Additional Functions ============

export async function getActiveWorkflowsByTrigger(triggerType: string): Promise<any[]> {
  console.log('[Workflow] getActiveWorkflowsByTrigger - needs database table');
  return [];
}

export async function createActivityLog(log: any): Promise<void> {
  console.log('[Workflow] createActivityLog - needs database table');
}
export async function updateTask(id: string, updates: Partial<InsertTask>): Promise<any> {
  const client = await getSupabaseClient();
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
  const client = await getSupabaseClient();
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

// 根据关联对象获取任务
export async function getTasksByEntity(entityType: string, entityId: string): Promise<any[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('related_type', entityType)
    .eq('related_id', entityId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('获取关联任务失败:', error);
    return [];
  }

  return (data as TaskRow[])?.map(rowToTask) || [];
}

// 获取待处理任务
export async function getPendingTasks(): Promise<any[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .neq('status', 'completed')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('获取待处理任务失败:', error);
    return [];
  }

  return (data as TaskRow[])?.map(rowToTask) || [];
}

// 获取今日到期任务
export async function getTodayTasks(): Promise<any[]> {
  const client = await getSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await client
    .from('tasks')
    .select('*')
    .gte('due_date', today.toISOString())
    .lt('due_date', tomorrow.toISOString())
    .order('due_date', { ascending: true });

  if (error) {
    console.error('获取今日任务失败:', error);
    return [];
  }

  return (data as TaskRow[])?.map(rowToTask) || [];
}

// 获取逾期任务
export async function getOverdueTasks(): Promise<any[]> {
  const client = await getSupabaseClient();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const { data, error } = await client
    .from('tasks')
    .select('*')
    .lt('due_date', now.toISOString())
    .neq('status', 'completed')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('获取逾期任务失败:', error);
    return [];
  }

  return (data as TaskRow[])?.map(rowToTask) || [];
}

// 完成任务
export async function completeTask(id: string): Promise<any> {
  const client = await getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('完成任务失败:', error);
    throw error;
  }

  return rowToTask(data as TaskRow);
}

// ============ 健康度评分系统 (V4.5) ============

// 权重配置
const HEALTH_WEIGHTS = {
  interaction: 0.25,    // 互动频率 25%
  salesAmount: 0.30,    // 销售金额 30%
  orderFrequency: 0.20, // 订单频次 20%
  opportunityActivity: 0.15, // 商机关怀 15%
  paymentTimeliness: 0.10, // 回款及时 10%
};

// 健康度等级
export type HealthLevel = 'healthy' | 'good' | 'fair' | 'risk';

export interface HealthScore {
  customerId: string;
  customerName: string;
  totalScore: number;       // 总分 0-100
  level: HealthLevel;        // 等级
  levelLabel: string;        // 等级标签
  dimensions: {
    interaction: { score: number; maxScore: number; value: number; label: string };
    salesAmount: { score: number; maxScore: number; value: number; label: string };
    orderFrequency: { score: number; maxScore: number; value: number; label: string };
    opportunityActivity: { score: number; maxScore: number; value: number; label: string };
    paymentTimeliness: { score: number; maxScore: number; value: number; label: string };
  };
  rank: number;              // 排名
  updatedAt: string;
}

// 获取客户健康度评分
export async function getCustomerHealthScores(): Promise<HealthScore[]> {
  const client = await getSupabaseClient();
  
  // 获取所有客户
  const { data: customers, error: customersError } = await client
    .from('customers')
    .select('id, name, company')
    .order('name');

  if (customersError || !customers) {
    console.error('获取客户列表失败:', customersError);
    return [];
  }

  // 获取所有订单（用于计算销售金额和订单频次）
  const { data: orders } = await client
    .from('orders')
    .select('id, customer_id, total_amount, created_at');

  // 获取所有商机（用于计算商机关怀）
  const { data: opportunities } = await client
    .from('opportunities')
    .select('id, customer_id, stage, value, updated_at');

  // 获取所有回款记录（用于计算回款及时性）
  const { data: payments } = await client
    .from('payment_plans')
    .select('id, customer_id, amount, paid_amount, status, due_date');

  // 获取最近90天的活动记录（用于计算互动频率）
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: activities } = await client
    .from('activities')
    .select('id, customer_id, created_at')
    .gte('created_at', ninetyDaysAgo.toISOString());

  // 计算每个客户的健康度评分
  const healthScores: HealthScore[] = customers.map((customer: { id: string; name: string; company?: string }) => {
    const customerId = customer.id;
    const customerName = customer.name;

    // 1. 互动频率 (25%) - 基于90天内活动记录数量
    const interactionCount = activities?.filter((a: any) => a.customer_id === customerId).length || 0;
    const interactionScore = Math.min(25, interactionCount * 5); // 每1次活动得5分，最高25分

    // 2. 销售金额 (30%) - 基于成交订单总金额
    const customerOrders = orders?.filter((o: any) => o.customer_id === customerId) || [];
    const totalSalesAmount = customerOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
    const salesAmountScore = Math.min(30, (totalSalesAmount / 100000) * 30); // 每10万得30分

    // 3. 订单频次 (20%) - 基于订单数量
    const orderCount = customerOrders.length;
    const orderFrequencyScore = Math.min(20, orderCount * 4); // 每1个订单得4分

    // 4. 商机关怀 (15%) - 基于活跃商机数量
    const activeOpportunities = opportunities?.filter(
      (o: any) => o.customer_id === customerId && !['closed_won', 'closed_lost'].includes(o.stage)
    ) || [];
    const opportunityValue = activeOpportunities.reduce((sum: number, o: any) => sum + Number(o.value || 0), 0);
    const opportunityScore = Math.min(15, (activeOpportunities.length * 3) + (opportunityValue / 50000) * 7);

    // 5. 回款及时性 (10%) - 基于按时回款比例
    const customerPayments = payments?.filter((p: any) => p.customer_id === customerId) || [];
    const paidOnTimeCount = customerPayments.filter(
      (p: any) => p.status === 'completed' || p.status === 'partial'
    ).length;
    const paymentScore = customerPayments.length > 0 
      ? (paidOnTimeCount / customerPayments.length) * 10 
      : 5; // 默认5分

    // 计算总分
    const totalScore = Math.round(
      interactionScore + salesAmountScore + orderFrequencyScore + opportunityScore + paymentScore
    );

    // 确定等级
    let level: HealthLevel;
    let levelLabel: string;
    if (totalScore >= 80) {
      level = 'healthy';
      levelLabel = '健康';
    } else if (totalScore >= 60) {
      level = 'good';
      levelLabel = '良好';
    } else if (totalScore >= 40) {
      level = 'fair';
      levelLabel = '一般';
    } else {
      level = 'risk';
      levelLabel = '风险';
    }

    return {
      customerId,
      customerName,
      totalScore,
      level,
      levelLabel,
      dimensions: {
        interaction: { 
          score: Math.round(interactionScore), 
          maxScore: 25, 
          value: interactionCount, 
          label: '互动频率' 
        },
        salesAmount: { 
          score: Math.round(salesAmountScore), 
          maxScore: 30, 
          value: totalSalesAmount, 
          label: '销售金额' 
        },
        orderFrequency: { 
          score: Math.round(orderFrequencyScore), 
          maxScore: 20, 
          value: orderCount, 
          label: '订单频次' 
        },
        opportunityActivity: { 
          score: Math.round(opportunityScore), 
          maxScore: 15, 
          value: activeOpportunities.length, 
          label: '商机关怀' 
        },
        paymentTimeliness: { 
          score: Math.round(paymentScore), 
          maxScore: 10, 
          value: paidOnTimeCount, 
          label: '回款及时' 
        },
      },
      rank: 0, // 稍后计算
      updatedAt: new Date().toISOString(),
    };
  });

  // 按总分排序并计算排名
  healthScores.sort((a, b) => b.totalScore - a.totalScore);
  healthScores.forEach((score, index) => {
    score.rank = index + 1;
  });

  return healthScores;
}

// 获取单个客户健康度详情
export async function getCustomerHealthDetail(customerId: string): Promise<HealthScore | null> {
  const allScores = await getCustomerHealthScores();
  return allScores.find(s => s.customerId === customerId) || null;
}

// 获取健康度统计
export async function getHealthStats(): Promise<{
  total: number;
  distribution: { healthy: number; good: number; fair: number; risk: number };
  averageScore: number;
  topCustomers: HealthScore[];
  riskCustomers: HealthScore[];
}> {
  const scores = await getCustomerHealthScores();

  const distribution = {
    healthy: scores.filter(s => s.level === 'healthy').length,
    good: scores.filter(s => s.level === 'good').length,
    fair: scores.filter(s => s.level === 'fair').length,
    risk: scores.filter(s => s.level === 'risk').length,
  };

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length)
    : 0;

  return {
    total: scores.length,
    distribution,
    averageScore,
    topCustomers: scores.slice(0, 10),
    riskCustomers: scores.filter(s => s.level === 'risk').slice(0, 10),
  };
}

// ============ 智能提醒 (V5.1) ============

export async function getAllReminders(filter?: { status?: string; type?: string }): Promise<Reminder[]> {
  const client = await getSupabaseClient();
  let query = client.from('reminders').select('*').order('remind_at', { ascending: true });
  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.type) query = query.eq('type', filter.type);
  const { data, error } = await query;
  if (error) throw new Error(`获取提醒列表失败: ${error.message}`);
  return data as Reminder[];
}

export async function getPendingReminders(): Promise<Reminder[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').select('*').eq('status', 'pending').order('remind_at', { ascending: true });
  if (error) throw new Error(`获取待处理提醒失败: ${error.message}`);
  return data as Reminder[];
}

export async function getTriggeredReminders(): Promise<Reminder[]> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').select('*').eq('status', 'triggered').eq('is_read', false).order('triggered_at', { ascending: false });
  if (error) throw new Error(`获取已触发提醒失败: ${error.message}`);
  return data as Reminder[];
}

export async function getTodayReminders(): Promise<Reminder[]> {
  const client = await getSupabaseClient();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const { data, error } = await client.from('reminders').select('*').gte('remind_at', startOfDay).lt('remind_at', endOfDay).neq('status', 'dismissed').order('remind_at', { ascending: true });
  if (error) throw new Error(`获取今日提醒失败: ${error.message}`);
  return data as Reminder[];
}

export async function getOverdueReminders(): Promise<Reminder[]> {
  const client = await getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await client.from('reminders').select('*').lt('remind_at', now).eq('status', 'pending').order('remind_at', { ascending: true });
  if (error) throw new Error(`获取逾期提醒失败: ${error.message}`);
  return data as Reminder[];
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').select('*').eq('id', id).single();
  if (error) return null;
  return data as Reminder;
}

export async function createReminder(reminder: InsertReminder): Promise<Reminder> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').insert(reminder).select().single();
  if (error) throw new Error(`创建提醒失败: ${error.message}`);
  return data as Reminder;
}

export async function updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(`更新提醒失败: ${error.message}`);
  return data as Reminder;
}

export async function completeReminder(id: string): Promise<Reminder> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').update({ status: 'completed', completed_at: new Date().toISOString(), is_read: true, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(`完成提醒失败: ${error.message}`);
  return data as Reminder;
}

export async function dismissReminder(id: string): Promise<Reminder> {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('reminders').update({ status: 'dismissed', is_read: true, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(`忽略提醒失败: ${error.message}`);
  return data as Reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  const client = await getSupabaseClient();
  const { error } = await client.from('reminders').delete().eq('id', id);
  if (error) throw new Error(`删除提醒失败: ${error.message}`);
}

export async function markReminderRead(id: string): Promise<void> {
  const client = await getSupabaseClient();
  const { error } = await client.from('reminders').update({ is_read: true, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(`标记提醒已读失败: ${error.message}`);
}

export async function getReminderStats(): Promise<{ total: number; pending: number; triggered: number; completed: number; overdue: number; today: number }> {
  const client = await getSupabaseClient();
  const { count: total } = await client.from('reminders').select('*', { count: 'exact', head: true });
  const { count: pending } = await client.from('reminders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: triggered } = await client.from('reminders').select('*', { count: 'exact', head: true }).eq('status', 'triggered');
  const { count: completed } = await client.from('reminders').select('*', { count: 'exact', head: true }).eq('status', 'completed');
  const now = new Date().toISOString();
  const { count: overdue } = await client.from('reminders').select('*', { count: 'exact', head: true }).lt('remind_at', now).eq('status', 'pending');
  const startOfDay = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
  const endOfDay = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).toISOString();
  const { count: today } = await client.from('reminders').select('*', { count: 'exact', head: true }).gte('remind_at', startOfDay).lt('remind_at', endOfDay).neq('status', 'dismissed');
  return { total: total || 0, pending: pending || 0, triggered: triggered || 0, completed: completed || 0, overdue: overdue || 0, today: today || 0 };
}

export async function triggerDueReminders(): Promise<number> {
  const client = await getSupabaseClient();
  const now = new Date().toISOString();
  const { data: due } = await client.from('reminders').select('*').lt('remind_at', now).eq('status', 'pending') as { data: Reminder[] | null };
  if (!due || due.length === 0) return 0;
  let triggered = 0;
  for (const reminder of due) {
    await client.from('reminders').update({ status: 'triggered', triggered_at: now, is_read: false, updated_at: now }).eq('id', reminder.id);
    await client.from('notifications').insert({ id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, type: reminder.type, title: reminder.title, message: reminder.message || '', entity_type: reminder.entity_type, entity_id: reminder.entity_id, is_read: false });
    triggered++;
  }
  return triggered;
}

export async function generateSmartReminders(): Promise<number> {
  let created = 0;
  const client = await getSupabaseClient();
  const now = new Date();

  // 1. 商机阶段超时 (>14 天)
  const { data: opps } = await client.from('opportunities').select('*').not('stage', 'in', '("closed_won","closed_lost")') as { data: Record<string, unknown>[] | null };
  if (opps) {
    for (const opp of opps) {
      const updatedAt = new Date((opp.updated_at as string) || (opp.created_at as string));
      const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate >= 14) {
        const { data: existing } = await client.from('reminders').select('id').eq('entity_type', 'opportunity').eq('entity_id', opp.id as string).eq('type', 'opp_stage_timeout').eq('status', 'pending').limit(1);
        if (!existing || existing.length === 0) {
          await client.from('reminders').insert({ type: 'opp_stage_timeout', title: `商机超时: ${opp.title}`, message: `商机「${opp.title}」已在「${opp.stage}」阶段停留${daysSinceUpdate}天`, entity_type: 'opportunity', entity_id: opp.id as string, entity_name: opp.title as string, remind_at: now.toISOString(), advance_minutes: 0, frequency: 'once', status: 'triggered', triggered_at: now.toISOString(), is_read: false });
          created++;
        }
      }
    }
  }

  // 2. 线索超时 (new >7 天)
  const { data: leads } = await client.from('leads').select('*').eq('status', 'new') as { data: Record<string, unknown>[] | null };
  if (leads) {
    for (const lead of leads) {
      const createdAt = new Date(lead.created_at as string);
      const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreated >= 7) {
        const { data: existing } = await client.from('reminders').select('id').eq('entity_type', 'lead').eq('entity_id', lead.id as string).eq('type', 'lead_timeout').eq('status', 'pending').limit(1);
        if (!existing || existing.length === 0) {
          await client.from('reminders').insert({ type: 'lead_timeout', title: `线索超时: ${lead.title}`, message: `线索「${lead.title}」已创建${daysSinceCreated}天仍未联系`, entity_type: 'lead', entity_id: lead.id as string, entity_name: lead.title as string, remind_at: now.toISOString(), advance_minutes: 0, frequency: 'once', status: 'triggered', triggered_at: now.toISOString(), is_read: false });
          created++;
        }
      }
    }
  }

  // 3. 回款到期
  const { data: payments } = await client.from('payment_plans').select('*').eq('status', 'pending') as { data: Record<string, unknown>[] | null };
  if (payments) {
    for (const payment of payments) {
      const dueDate = new Date(payment.due_date as string);
      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3 && daysUntilDue >= -7) {
        const { data: existing } = await client.from('reminders').select('id').eq('entity_type', 'payment_plan').eq('entity_id', payment.id as string).eq('type', 'payment_due').in('status', ['pending', 'triggered']).limit(1);
        if (!existing || existing.length === 0) {
          await client.from('reminders').insert({ type: 'payment_due', title: `回款到期: ${payment.plan_name || '回款计划'}`, message: `回款计划${daysUntilDue <= 0 ? '已到期' : `将于${daysUntilDue}天后到期`}，金额: ¥${Number(payment.amount || 0).toLocaleString()}`, entity_type: 'payment_plan', entity_id: payment.id as string, entity_name: (payment.plan_name as string) || '回款计划', remind_at: now.toISOString(), advance_minutes: 4320, frequency: 'once', status: daysUntilDue <= 0 ? 'triggered' : 'pending', triggered_at: daysUntilDue <= 0 ? now.toISOString() : undefined, is_read: false });
          created++;
        }
      }
    }
  }

  // 4. 合同里程碑
  const { data: milestones } = await client.from('contract_milestones').select('*').eq('status', 'pending') as { data: Record<string, unknown>[] | null };
  if (milestones) {
    for (const ms of milestones) {
      const dueDate = new Date(ms.due_date as string);
      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 7 && daysUntilDue >= -14) {
        const { data: existing } = await client.from('reminders').select('id').eq('entity_type', 'contract_milestone').eq('entity_id', ms.id as string).eq('type', 'contract_milestone').in('status', ['pending', 'triggered']).limit(1);
        if (!existing || existing.length === 0) {
          await client.from('reminders').insert({ type: 'contract_milestone', title: `合同节点: ${ms.name || '里程碑'}`, message: `合同里程碑「${ms.name || ''}」${daysUntilDue <= 0 ? '已到期' : `将于${daysUntilDue}天后到期`}`, entity_type: 'contract_milestone', entity_id: ms.id as string, entity_name: (ms.name as string) || '里程碑', remind_at: now.toISOString(), advance_minutes: 10080, frequency: 'once', status: daysUntilDue <= 0 ? 'triggered' : 'pending', triggered_at: daysUntilDue <= 0 ? now.toISOString() : undefined, is_read: false });
          created++;
        }
      }
    }
  }

  return created;
}
