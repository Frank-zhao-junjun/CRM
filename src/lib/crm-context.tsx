'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Customer, Contact, SalesOpportunity, DashboardStats, Activity, CustomerStatus, OpportunityStage, SalesLead, LeadStatusType, LeadSourceType } from './crm-types';

interface CRMContextType {
  customers: Customer[];
  contacts: Contact[];
  opportunities: SalesOpportunity[];
  leads: SalesLead[];  // 销售线索
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
  
  // Opportunity operations (销售机会)
  addOpportunity: (opportunity: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOpportunity: (id: string, opportunity: Partial<SalesOpportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
  changeOpportunityStage: (id: string, newStage: OpportunityStage, reason?: string) => Promise<void>;
}

// API helper functions
async function apiGet<T>(type: string, params?: Record<string, string>): Promise<T> {
  const url = new URL('/api/crm', window.location.origin);
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
  const url = new URL('/api/crm', window.location.origin);
  url.searchParams.set('action', action);
  url.searchParams.set('id', id);
  const response = await fetch(url.toString(), { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
}

// Database to frontend type converters
interface DBCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string;
  status: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DBContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  customer_id: string;
  customer_name?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface DBOpportunity {
  id: string;
  title: string;
  customer_id: string;
  customer_name?: string;
  contact_id: string | null;
  contact_name?: string;
  value: string;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface DBLead {
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

interface DBActivity {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  description: string;
  timestamp: string;
}

interface DBStats {
  totalCustomers: number;
  totalContacts: number;
  totalLeads: number;
  totalOpportunities: number;
  totalRevenue: number;
  wonOpportunities: number;
  activeCustomers: number;
}

function convertCustomer(db: DBCustomer): Customer {
  return {
    id: db.id,
    name: db.name,
    email: db.email || '',
    phone: db.phone || '',
    company: db.company,
    status: db.status as CustomerStatus,
    industry: db.industry || '',
    website: db.website || undefined,
    address: db.address || undefined,
    notes: db.notes || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function convertContact(db: DBContact): Contact {
  return {
    id: db.id,
    firstName: db.first_name,
    lastName: db.last_name,
    email: db.email || '',
    phone: db.phone || '',
    position: db.position || '',
    customerId: db.customer_id,
    customerName: db.customer_name || '',
    isPrimary: db.is_primary,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function convertOpportunity(db: DBOpportunity): SalesOpportunity {
  return {
    id: db.id,
    title: db.title,
    customerId: db.customer_id,
    customerName: db.customer_name || '',
    contactId: db.contact_id || undefined,
    contactName: db.contact_name || undefined,
    value: Number(db.value),
    stage: db.stage as OpportunityStage,
    probability: db.probability,
    expectedCloseDate: db.expected_close_date?.split('T')[0] || '',
    description: db.description || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function convertLead(db: DBLead): SalesLead {
  return {
    id: db.id,
    title: db.title,
    source: db.source as LeadSourceType,
    customerId: db.customer_id,
    customerName: db.customer_name,
    contactId: db.contact_id,
    contactName: db.contact_name,
    estimatedValue: Number(db.estimated_value),
    probability: db.probability,
    status: db.status as LeadStatusType,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function convertActivity(db: DBActivity): Activity {
  return {
    id: db.id,
    type: db.type as Activity['type'],
    entityType: db.entity_type as Activity['entityType'],
    entityId: db.entity_id,
    entityName: db.entity_name,
    description: db.description,
    timestamp: db.timestamp,
  };
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalContacts: 0,
    totalLeads: 0,
    totalOpportunities: 0,
    totalRevenue: 0,
    wonOpportunities: 0,
    activeCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dbCustomers, dbContacts, dbOpportunities, dbLeads, dbActivities, dbStats] = await Promise.all([
        apiGet<DBCustomer[]>('customers'),
        apiGet<DBContact[]>('contacts'),
        apiGet<DBOpportunity[]>('opportunities'),
        apiGet<DBLead[]>('leads'),
        apiGet<DBActivity[]>('activities', { limit: '50' }),
        apiGet<DBStats>('stats'),
      ]);

      // 填充 customerName
      const customerMap = new Map(dbCustomers.map(c => [c.id, c.company]));
      
      const convertedContacts = dbContacts.map(c => ({
        ...convertContact(c),
        customerName: customerMap.get(c.customer_id) || '',
      }));
      
      const convertedOpportunities = dbOpportunities.map(o => ({
        ...convertOpportunity(o),
        customerName: customerMap.get(o.customer_id) || '',
      }));
      
      const convertedLeads = dbLeads.map(l => ({
        ...convertLead(l),
        customerName: customerMap.get(l.customer_id) || '',
      }));

      setCustomers(dbCustomers.map(convertCustomer));
      setContacts(convertedContacts);
      setOpportunities(convertedOpportunities);
      setLeads(convertedLeads);
      setActivities(dbActivities.map(convertActivity));
      setStats(dbStats);
    } catch (err) {
      console.error('Failed to load CRM data:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addActivity = useCallback(async (
    type: Activity['type'],
    entityType: Activity['entityType'],
    entityId: string,
    entityName: string,
    description: string
  ) => {
    try {
      await apiPost('createActivity', {
        type,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        description,
        timestamp: new Date().toISOString(),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create activity:', err);
    }
  }, [loadData]);

  // Customer operations
  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer = await apiPost<DBCustomer>('createCustomer', {
      name: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      company: customer.company,
      status: customer.status,
      industry: customer.industry || null,
      website: customer.website || null,
      address: customer.address || null,
      notes: customer.notes || null,
    });
    await addActivity('created', 'customer', newCustomer.id, newCustomer.name, `新增客户 ${newCustomer.name}`);
    await loadData();
  }, [addActivity, loadData]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = await apiPut<DBCustomer>('updateCustomer', id, {
      name: updates.name,
      email: updates.email || null,
      phone: updates.phone || null,
      company: updates.company,
      status: updates.status,
      industry: updates.industry || null,
      website: updates.website || null,
      address: updates.address || null,
      notes: updates.notes || null,
    });
    await addActivity('updated', 'customer', id, updated.name, `更新客户 ${updated.name}`);
    await loadData();
  }, [addActivity, loadData]);

  const deleteCustomer = useCallback(async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      await apiDelete('deleteCustomer', id);
      await addActivity('deleted', 'customer', id, customer.name, `删除客户 ${customer.name}`);
      await loadData();
    }
  }, [customers, addActivity, loadData]);

  // Contact operations
  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact = await apiPost<DBContact>('createContact', {
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email || null,
      phone: contact.phone || null,
      position: contact.position || null,
      customer_id: contact.customerId,
      is_primary: contact.isPrimary,
    });
    const name = `${contact.lastName}${contact.firstName}`;
    await addActivity('created', 'contact', newContact.id, name, `新增联系人 ${name}`);
    await loadData();
  }, [addActivity, loadData]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const updated = await apiPut<DBContact>('updateContact', id, {
      first_name: updates.firstName,
      last_name: updates.lastName,
      email: updates.email || null,
      phone: updates.phone || null,
      position: updates.position || null,
      customer_id: updates.customerId,
      is_primary: updates.isPrimary,
    });
    const name = `${updated.last_name}${updated.first_name}`;
    await addActivity('updated', 'contact', id, name, `更新联系人 ${name}`);
    await loadData();
  }, [addActivity, loadData]);

  const deleteContact = useCallback(async (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      const name = `${contact.lastName}${contact.firstName}`;
      await apiDelete('deleteContact', id);
      await addActivity('deleted', 'contact', id, name, `删除联系人 ${name}`);
      await loadData();
    }
  }, [contacts, addActivity, loadData]);

  // Lead operations (销售线索)
  const addLead = useCallback(async (lead: Omit<SalesLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead = await apiPost<DBLead>('createLead', {
      title: lead.title,
      source: lead.source,
      customerId: lead.customerId,
      customerName: lead.customerName,
      contactId: lead.contactId,
      contactName: lead.contactName,
      estimatedValue: lead.estimatedValue,
      notes: lead.notes,
    });
    await addActivity('created', 'lead', newLead.id, newLead.title, `创建销售线索 "${newLead.title}"`);
    await loadData();
  }, [addActivity, loadData]);

  const updateLead = useCallback(async (id: string, updates: Partial<SalesLead>) => {
    const updated = await apiPut<DBLead>('updateLead', id, {
      title: updates.title,
      source: updates.source,
      contactId: updates.contactId,
      contactName: updates.contactName,
      estimatedValue: updates.estimatedValue,
      notes: updates.notes,
    });
    await addActivity('updated', 'lead', id, updated.title, `更新销售线索 ${updated.title}`);
    await loadData();
  }, [addActivity, loadData]);

  const deleteLead = useCallback(async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      await apiDelete('deleteLead', id);
      await addActivity('deleted', 'lead', id, lead.title, `删除销售线索 ${lead.title}`);
      await loadData();
    }
  }, [leads, addActivity, loadData]);

  const qualifyLead = useCallback(async (
    leadId: string, 
    opportunityData: { 
      opportunityTitle: string;
      value: number;
      contactId?: string;
      contactName?: string;
      expectedCloseDate: string;
      notes?: string;
    }
  ) => {
    await apiPost('qualifyLead', {
      leadId,
      ...opportunityData,
    });
    await loadData();
  }, [loadData]);

  const disqualifyLead = useCallback(async (leadId: string, reason?: string) => {
    await apiPost('disqualifyLead', { leadId, reason });
    await loadData();
  }, [loadData]);

  // Opportunity operations (销售机会)
  const addOpportunity = useCallback(async (opportunity: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOpp = await apiPost<DBOpportunity>('createOpportunity', {
      title: opportunity.title,
      customer_id: opportunity.customerId,
      contact_id: opportunity.contactId || null,
      value: opportunity.value.toString(),
      stage: opportunity.stage,
      probability: opportunity.probability,
      expected_close_date: opportunity.expectedCloseDate || null,
      description: opportunity.description || null,
    });
    await addActivity('created', 'opportunity', newOpp.id, newOpp.title, `创建销售机会 ${newOpp.title}`);
    await loadData();
  }, [addActivity, loadData]);

  const updateOpportunity = useCallback(async (id: string, updates: Partial<SalesOpportunity>) => {
    const oldOpp = opportunities.find(o => o.id === id);
    
    const updated = await apiPut<DBOpportunity>('updateOpportunity', id, {
      title: updates.title,
      customer_id: updates.customerId,
      contact_id: updates.contactId || null,
      value: updates.value?.toString(),
      stage: updates.stage,
      probability: updates.probability,
      expected_close_date: updates.expectedCloseDate || null,
      description: updates.description || null,
    });

    // 阶段变更记录
    if (oldOpp && updates.stage && oldOpp.stage !== updates.stage) {
      const stageLabels: Record<string, string> = {
        qualified: '销售机会',
        proposal: '提案',
        negotiation: '谈判',
        closed_won: '成交',
        closed_lost: '失败',
      };
      await addActivity(
        updates.stage === 'closed_won' ? 'closed_won' : updates.stage === 'closed_lost' ? 'closed_lost' : 'stage_change',
        'opportunity',
        id,
        updated.title,
        updates.stage === 'closed_won' 
          ? `销售机会 "${updated.title}" 成交！`
          : `阶段变更为 ${stageLabels[updates.stage]}`
      );
    } else {
      await addActivity('updated', 'opportunity', id, updated.title, `更新销售机会 ${updated.title}`);
    }
    
    await loadData();
  }, [opportunities, addActivity, loadData]);

  const changeOpportunityStage = useCallback(async (id: string, newStage: OpportunityStage, reason?: string) => {
    const updated = await apiPut<DBOpportunity>('changeStage', id, {
      stage: newStage,
      reason,
    });
    
    const stageLabels: Record<string, string> = {
      qualified: '销售机会',
      proposal: '提案',
      negotiation: '谈判',
      closed_won: '成交',
      closed_lost: '失败',
    };
    
    await addActivity(
      newStage === 'closed_won' ? 'closed_won' : newStage === 'closed_lost' ? 'closed_lost' : 'stage_change',
      'opportunity',
      id,
      updated.title,
      newStage === 'closed_won' 
        ? `销售机会 "${updated.title}" 成交！`
        : `阶段变更为 ${stageLabels[newStage]}`
    );
    
    await loadData();
  }, [addActivity, loadData]);

  const deleteOpportunity = useCallback(async (id: string) => {
    const opportunity = opportunities.find(o => o.id === id);
    if (opportunity) {
      await apiDelete('deleteOpportunity', id);
      await addActivity('deleted', 'opportunity', id, opportunity.title, `删除销售机会 ${opportunity.title}`);
      await loadData();
    }
  }, [opportunities, addActivity, loadData]);

  const value: CRMContextType = {
    customers,
    contacts,
    opportunities,
    leads,
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
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeOpportunityStage,
  };

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM(): CRMContextType {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
