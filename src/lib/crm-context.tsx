'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Customer, Contact, SalesOpportunity, DashboardStats, Activity, OpportunityStage, SalesLead, Product, PaymentPlan, Task } from './crm-types';

interface CRMContextType {
  customers: Customer[];
  contacts: Contact[];
  opportunities: SalesOpportunity[];
  leads: SalesLead[];  // 销售线索
  products: Product[]; // 产品管理
  paymentPlans: PaymentPlan[]; // 回款计划
  todayPayments: PaymentPlan[]; // 今日到期回款
  overduePayments: PaymentPlan[]; // 逾期回款
  tasks: Task[]; // 任务管理
  overdueTasks: Task[]; // 逾期任务
  activities: Activity[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  
  // Customer operations
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Contact operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  
  // Lead operations (销售线索)
  addLead: (lead: Omit<SalesLead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<SalesLead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  qualifyLead: (leadId: string, opportunityData: { 
    opportunityTitle: string;
    value: number;
    contactId?: string;
    contactName?: string;
    expectedCloseDate: string;
    notes?: string;
  }) => Promise<void>;
  disqualifyLead: (leadId: string, reason?: string) => Promise<void>;
  
  // Product operations (产品管理)
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductActive: (id: string) => Promise<void>;
  
  // Payment Plan operations (回款管理 V3.3 新增)
  addPaymentPlan: (plan: Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePaymentPlan: (id: string, plan: Partial<PaymentPlan>) => Promise<void>;
  deletePaymentPlan: (id: string) => Promise<void>;
  recordPayment: (planId: string, amount: number, method?: string) => Promise<void>;
  
  // Opportunity operations (商机)
  addOpportunity: (opportunity: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOpportunity: (id: string, opportunity: Partial<SalesOpportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
  changeOpportunityStage: (id: string, newStage: OpportunityStage, reason?: string) => Promise<void>;
  
  // Task operations (任务管理 V4.1 新增)
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
}

// API helper functions
async function apiGet<T>(type: string, params?: Record<string, string>): Promise<T> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = new URL('/api/crm', baseUrl || 'http://localhost:5000');
  url.searchParams.set('type', type);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

async function apiPost<T>(action: string, data: unknown): Promise<T> {
  const response = await fetch('/api/crm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

async function apiPut<T>(action: string, id: string, data: unknown): Promise<T> {
  const response = await fetch('/api/crm', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, id, data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

async function apiDelete(action: string, id: string): Promise<void> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = new URL('/api/crm', baseUrl || 'http://localhost:5000');
  url.searchParams.set('action', action);
  url.searchParams.set('id', id);
  const response = await fetch(url.toString(), { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
}

// Initial sample data
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);






// Initial products (V3.2 新增)

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // 任务管理 V4.1
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 逾期任务计算
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  // 今日到期任务
  const todayTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  // 今日到期回款
  const todayPayments = paymentPlans.filter(p => {
    if (p.status === 'paid' || p.status === 'cancelled') return false;
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  // 逾期回款
  const overduePayments = paymentPlans.filter(p => {
    if (p.status === 'paid' || p.status === 'cancelled') return false;
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const stats: DashboardStats = {
    totalCustomers: customers.length,
    totalContacts: contacts.length,
    totalLeads: leads.length,
    totalOpportunities: opportunities.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length,
    totalRevenue: opportunities
      .filter(o => o.stage === 'closed_won')
      .reduce((sum, o) => sum + o.value, 0),
    wonOpportunities: opportunities.filter(o => o.stage === 'closed_won').length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dbCustomers, dbContacts, dbOpportunities, dbLeads, dbActivities, dbProducts, dbTasks] = await Promise.all([
        apiGet<Customer[]>('customers'),
        apiGet<Contact[]>('contacts'),
        apiGet<SalesOpportunity[]>('opportunities'),
        apiGet<SalesLead[]>('leads'),
        apiGet<Activity[]>('activities'),
        apiGet<Product[]>('products'),
        apiGet<Task[]>('tasks'),
      ]);
      
      setCustomers(dbCustomers);
      setContacts(dbContacts);
      setOpportunities(dbOpportunities);
      setLeads(dbLeads);
      setActivities(dbActivities);
      setProducts(dbProducts);
      setTasks(dbTasks);
    } catch (err) {
      console.error('Failed to load CRM data:', err);
      // 不再使用 mock 数据回退，明确设置错误状态
      // 错误将由 error 状态统一管理，UI 负责展示
      setError('加载数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addActivity = useCallback((
    type: Activity['type'],
    entityType: Activity['entityType'],
    entityId: string,
    entityName: string,
    description: string
  ) => {
    const newActivity: Activity = {
      id: generateId(),
      type,
      entityType,
      entityId,
      entityName,
      description,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  }, []);

  // Customer operations
  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addCustomer', newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
    addActivity('created', 'customer', newCustomer.id, newCustomer.name, `创建客户 "${newCustomer.name}"`);
  }, [addActivity]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateCustomer', id, updated);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    const customer = customers.find(c => c.id === id);
    if (customer) {
      addActivity('updated', 'customer', id, customer.name, `更新客户 ${customer.name}`);
    }
  }, [customers, addActivity]);

  const deleteCustomer = useCallback(async (id: string) => {
    await apiDelete('deleteCustomer', id);
    const customer = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (customer) {
      addActivity('deleted', 'customer', id, customer.name, `删除客户 ${customer.name}`);
    }
  }, [customers, addActivity]);

  // Contact operations
  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addContact', newContact);
    setContacts(prev => [...prev, newContact]);
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateContact', id, updated);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await apiDelete('deleteContact', id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // Lead operations
  const addLead = useCallback(async (lead: Omit<SalesLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: SalesLead = {
      ...lead,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addLead', newLead);
    setLeads(prev => [...prev, newLead]);
    addActivity('created', 'lead', newLead.id, newLead.title, `创建销售线索 "${newLead.title}"`);
  }, [addActivity]);

  const updateLead = useCallback(async (id: string, updates: Partial<SalesLead>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateLead', id, updated);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    const lead = leads.find(l => l.id === id);
    if (lead) {
      addActivity('updated', 'lead', id, lead.title, `更新销售线索 ${lead.title}`);
    }
  }, [leads, addActivity]);

  const deleteLead = useCallback(async (id: string) => {
    await apiDelete('deleteLead', id);
    const lead = leads.find(l => l.id === id);
    setLeads(prev => prev.filter(l => l.id !== id));
    if (lead) {
      addActivity('deleted', 'lead', id, lead.title, `删除销售线索 ${lead.title}`);
    }
  }, [leads, addActivity]);

  const qualifyLead = useCallback(async (leadId: string, opportunityData: {
    opportunityTitle: string;
    value: number;
    contactId?: string;
    contactName?: string;
    expectedCloseDate: string;
    notes?: string;
  }) => {
    const result = await apiPost<{ error?: string }>('qualifyLead', { leadId, ...opportunityData });
    if (!result.error) {
      await loadData();
    }
  }, [loadData]);

  const disqualifyLead = useCallback(async (leadId: string, reason?: string) => {
    const lead = leads.find(l => l.id === leadId);
    await updateLead(leadId, { status: 'disqualified', notes: reason || lead?.notes });
    if (lead) {
      addActivity('disqualified', 'lead', leadId, lead.title, `销售线索 "${lead.title}" 已标记为无效`);
    }
  }, [leads, updateLead, addActivity]);

  // Product operations (V3.2 新增)
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addProduct', newProduct);
    setProducts(prev => [...prev, newProduct]);
    addActivity('created', 'lead' as any, newProduct.id, newProduct.name, `创建产品 "${newProduct.name}"`);
  }, [addActivity]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateProduct', id, updated);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    const product = products.find(p => p.id === id);
    if (product) {
      addActivity('updated', 'lead' as any, id, product.name, `更新产品 ${product.name}`);
    }
  }, [products, addActivity]);

  const deleteProduct = useCallback(async (id: string) => {
    await apiDelete('deleteProduct', id);
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (product) {
      addActivity('deleted', 'lead' as any, id, product.name, `删除产品 ${product.name}`);
    }
  }, [products, addActivity]);

  const toggleProductActive = useCallback(async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      await updateProduct(id, { isActive: !product.isActive });
    }
  }, [products, updateProduct]);

  // Payment Plan operations (V3.3 新增)
  const addPaymentPlan = useCallback(async (plan: Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: PaymentPlan = {
      ...plan,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addPaymentPlan', newPlan);
    setPaymentPlans(prev => [...prev, newPlan]);
    addActivity('created', 'lead' as any, newPlan.id, newPlan.title, `创建回款计划 "${newPlan.title}"`);
  }, [addActivity]);

  const updatePaymentPlan = useCallback(async (id: string, updates: Partial<PaymentPlan>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updatePaymentPlan', id, updated);
    setPaymentPlans(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    const plan = paymentPlans.find(p => p.id === id);
    if (plan) {
      addActivity('updated', 'lead' as any, id, plan.title, `更新回款计划 ${plan.title}`);
    }
  }, [paymentPlans, addActivity]);

  const deletePaymentPlan = useCallback(async (id: string) => {
    await apiDelete('deletePaymentPlan', id);
    const plan = paymentPlans.find(p => p.id === id);
    setPaymentPlans(prev => prev.filter(p => p.id !== id));
    if (plan) {
      addActivity('deleted', 'lead' as any, id, plan.title, `删除回款计划 ${plan.title}`);
    }
  }, [paymentPlans, addActivity]);

  const recordPayment = useCallback(async (planId: string, amount: number, method?: string) => {
    const plan = paymentPlans.find(p => p.id === planId);
    if (!plan) return;
    
    const newPaidAmount = plan.paidAmount + amount;
    const newPendingAmount = Math.max(0, plan.totalAmount - newPaidAmount);
    
    await updatePaymentPlan(planId, {
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status: newPaidAmount >= plan.totalAmount ? 'paid' : 'partial',
      paymentMethod: method as any,
    });
    
    addActivity('updated', 'lead' as any, planId, plan.title, `登记回款 ¥${amount.toLocaleString()}`);
  }, [paymentPlans, updatePaymentPlan, addActivity]);

  // Task operations (V4.1 新增)
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addTask', newTask);
    setTasks(prev => [...prev, newTask]);
    addActivity('created', 'lead' as any, newTask.id, newTask.title, `创建任务 "${newTask.title}"`);
  }, [addActivity]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateTask', id, updated);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    const task = tasks.find(t => t.id === id);
    if (task) {
      addActivity('updated', 'lead' as any, id, task.title, `更新任务 ${task.title}`);
    }
  }, [tasks, addActivity]);

  const deleteTask = useCallback(async (id: string) => {
    await apiDelete('deleteTask', id);
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) {
      addActivity('deleted', 'lead' as any, id, task.title, `删除任务 ${task.title}`);
    }
  }, [tasks, addActivity]);

  const completeTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updated = {
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPut('updateTask', id, updated);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    addActivity('updated', 'lead' as any, id, task.title, `完成任务 "${task.title}"`);
  }, [tasks, addActivity]);

  // Opportunity operations
  const addOpportunity = useCallback(async (opportunity: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOpportunity: SalesOpportunity = {
      ...opportunity,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addOpportunity', newOpportunity);
    setOpportunities(prev => [...prev, newOpportunity]);
    addActivity('created', 'opportunity', newOpportunity.id, newOpportunity.title, `创建销售商机 "${newOpportunity.title}"`);
  }, [addActivity]);

  const updateOpportunity = useCallback(async (id: string, updates: Partial<SalesOpportunity>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateOpportunity', id, updated);
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
    const opportunity = opportunities.find(o => o.id === id);
    if (opportunity) {
      addActivity('updated', 'opportunity', id, opportunity.title, `更新销售商机 ${opportunity.title}`);
    }
  }, [opportunities, addActivity]);

  const deleteOpportunity = useCallback(async (id: string) => {
    await apiDelete('deleteOpportunity', id);
    const opportunity = opportunities.find(o => o.id === id);
    setOpportunities(prev => prev.filter(o => o.id !== id));
    if (opportunity) {
      addActivity('deleted', 'opportunity', id, opportunity.title, `删除销售商机 ${opportunity.title}`);
    }
  }, [opportunities, addActivity]);

  const changeOpportunityStage = useCallback(async (id: string, newStage: OpportunityStage, reason?: string) => {
    const result = await apiPut<{ error?: string }>('changeStage', id, { stage: newStage, reason });
    if (!result.error) {
      await loadData();
    }
  }, [loadData]);

  const value: CRMContextType = {
    customers,
    contacts,
    opportunities,
    leads,
    products,
    paymentPlans,
    todayPayments,
    overduePayments,
    tasks,
    overdueTasks,
    activities,
    stats,
    loading,
    error,
    refreshData: loadData,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addContact,
    updateContact,
    deleteContact,
    addLead,
    updateLead,
    deleteLead,
    qualifyLead,
    disqualifyLead,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    addPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
    recordPayment,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeOpportunityStage,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
  };

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
