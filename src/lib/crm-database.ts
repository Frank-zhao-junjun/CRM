import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { Customer, InsertCustomer, Contact, InsertContact, Opportunity, InsertOpportunity, Activity, InsertActivity, FollowUp, InsertFollowUp, Notification, InsertNotification, Quote, InsertQuote, QuoteItem, InsertQuoteItem, Order, InsertOrder, OrderItem, InsertOrderItem, Contract, InsertContract, ContractMilestone, InsertContractMilestone } from '@/storage/database/shared/schema';

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
