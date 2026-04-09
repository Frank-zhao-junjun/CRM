'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Customer, Contact, Opportunity, DashboardStats, Activity } from './crm-types';

interface CRMContextType {
  customers: Customer[];
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
  stats: DashboardStats;
  
  // Customer operations
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  
  // Contact operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
  // Opportunity operations
  addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOpportunity: (id: string, opportunity: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: '张三',
    email: 'zhangsan@techcorp.com',
    phone: '138-0000-0001',
    company: '科技集团有限公司',
    status: 'active',
    industry: '科技',
    website: 'https://techcorp.com',
    address: '北京市朝阳区',
    notes: '重要客户',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'c2',
    name: '李四',
    email: 'lisi@trade.com',
    phone: '138-0000-0002',
    company: '贸易进出口公司',
    status: 'active',
    industry: '贸易',
    website: 'https://tradecompany.com',
    address: '上海市浦东新区',
    notes: '潜在大型客户',
    createdAt: '2024-02-20T09:30:00Z',
    updatedAt: '2024-02-20T09:30:00Z',
  },
  {
    id: 'c3',
    name: '王五',
    email: 'wangwu@manufacture.cn',
    phone: '138-0000-0003',
    company: '制造业股份公司',
    status: 'prospect',
    industry: '制造业',
    address: '深圳市南山区',
    createdAt: '2024-03-10T14:20:00Z',
    updatedAt: '2024-03-10T14:20:00Z',
  },
  {
    id: 'c4',
    name: '赵六',
    email: 'zhaoliu@finance.com',
    phone: '138-0000-0004',
    company: '金融服务公司',
    status: 'inactive',
    industry: '金融',
    website: 'https://financeco.com',
    address: '广州市天河区',
    createdAt: '2023-11-05T10:15:00Z',
    updatedAt: '2024-01-20T11:30:00Z',
  },
];

const initialContacts: Contact[] = [
  {
    id: 'ct1',
    firstName: '小',
    lastName: '张',
    email: 'xiaozhang@techcorp.com',
    phone: '139-0000-0001',
    position: '技术总监',
    customerId: 'c1',
    customerName: '科技集团有限公司',
    isPrimary: true,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'ct2',
    firstName: '采购',
    lastName: '李',
    email: 'caigou@tradecompany.com',
    phone: '139-0000-0002',
    position: '采购经理',
    customerId: 'c2',
    customerName: '贸易进出口公司',
    isPrimary: true,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'ct3',
    firstName: '销售',
    lastName: '王',
    email: 'xiaoshou@manufacture.cn',
    phone: '139-0000-0003',
    position: '销售总监',
    customerId: 'c3',
    customerName: '制造业股份公司',
    isPrimary: false,
    createdAt: '2024-03-10T15:00:00Z',
    updatedAt: '2024-03-10T15:00:00Z',
  },
];

const initialOpportunities: Opportunity[] = [
  {
    id: 'op1',
    title: '企业管理系统采购',
    customerId: 'c1',
    customerName: '科技集团有限公司',
    value: 500000,
    stage: 'proposal',
    probability: 60,
    expectedCloseDate: '2024-06-30',
    description: '采购ERP系统一套',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
  },
  {
    id: 'op2',
    title: 'CRM系统实施项目',
    customerId: 'c2',
    customerName: '贸易进出口公司',
    value: 300000,
    stage: 'negotiation',
    probability: 80,
    expectedCloseDate: '2024-05-15',
    description: '实施客户关系管理系统',
    createdAt: '2024-02-25T11:00:00Z',
    updatedAt: '2024-04-10T16:20:00Z',
  },
  {
    id: 'op3',
    title: '办公设备采购',
    customerId: 'c3',
    customerName: '制造业股份公司',
    value: 150000,
    stage: 'qualified',
    probability: 40,
    expectedCloseDate: '2024-07-20',
    description: '采购办公电脑及打印机',
    createdAt: '2024-03-18T10:30:00Z',
    updatedAt: '2024-03-18T10:30:00Z',
  },
  {
    id: 'op4',
    title: '云计算服务合同',
    customerId: 'c1',
    customerName: '科技集团有限公司',
    value: 800000,
    stage: 'closed_won',
    probability: 100,
    expectedCloseDate: '2024-03-01',
    description: '年度云服务订阅',
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-03-01T15:00:00Z',
  },
];

const initialActivities: Activity[] = [
  {
    id: 'act1',
    type: 'created',
    entityType: 'customer',
    entityId: 'c3',
    entityName: '制造业股份公司',
    description: '新增客户 制造业股份公司',
    timestamp: '2024-03-10T14:20:00Z',
  },
  {
    id: 'act2',
    type: 'stage_change',
    entityType: 'opportunity',
    entityId: 'op2',
    entityName: 'CRM系统实施项目',
    description: '销售机会进入 谈判阶段',
    timestamp: '2024-04-10T16:20:00Z',
  },
  {
    id: 'act3',
    type: 'closed_won',
    entityType: 'opportunity',
    entityId: 'op4',
    entityName: '云计算服务合同',
    description: '销售机会已成交 - 800,000元',
    timestamp: '2024-03-01T15:00:00Z',
  },
];

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const addActivity = useCallback((type: Activity['type'], entityType: Activity['entityType'], entityId: string, entityName: string, description: string) => {
    const newActivity: Activity = {
      id: generateId(),
      type,
      entityType,
      entityId,
      entityName,
      description,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  }, []);

  // Customer operations
  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    addActivity('created', 'customer', newCustomer.id, newCustomer.name, `新增客户 ${newCustomer.name}`);
  }, [addActivity]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ));
    const customer = customers.find(c => c.id === id);
    if (customer) {
      addActivity('updated', 'customer', id, customer.name, `更新客户 ${customer.name}`);
    }
  }, [customers, addActivity]);

  const deleteCustomer = useCallback((id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      setContacts(prev => prev.filter(ct => ct.customerId !== id));
      setOpportunities(prev => prev.filter(op => op.customerId !== id));
      addActivity('deleted', 'customer', id, customer.name, `删除客户 ${customer.name}`);
    }
  }, [customers, addActivity]);

  // Contact operations
  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setContacts(prev => [...prev, newContact]);
    addActivity('created', 'contact', newContact.id, `${newContact.lastName}${newContact.firstName}`, `新增联系人 ${newContact.lastName}${newContact.firstName}`);
  }, [addActivity]);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    ));
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      const name = `${contact.lastName}${contact.firstName}`;
      addActivity('updated', 'contact', id, name, `更新联系人 ${name}`);
    }
  }, [contacts, addActivity]);

  const deleteContact = useCallback((id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      const name = `${contact.lastName}${contact.firstName}`;
      setContacts(prev => prev.filter(c => c.id !== id));
      addActivity('deleted', 'contact', id, name, `删除联系人 ${name}`);
    }
  }, [contacts, addActivity]);

  // Opportunity operations
  const addOpportunity = useCallback((opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOpportunity: Opportunity = {
      ...opportunity,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOpportunities(prev => [...prev, newOpportunity]);
    addActivity('created', 'opportunity', newOpportunity.id, newOpportunity.title, `新增销售机会 ${newOpportunity.title}`);
  }, [addActivity]);

  const updateOpportunity = useCallback((id: string, updates: Partial<Opportunity>) => {
    setOpportunities(prev => prev.map(op => 
      op.id === id ? { ...op, ...updates, updatedAt: new Date().toISOString() } : op
    ));
    const opportunity = opportunities.find(op => op.id === id);
    if (opportunity) {
      if (updates.stage && updates.stage !== opportunity.stage) {
        const stageNames: Record<string, string> = {
          lead: '线索',
          qualified: 'qualified',
          proposal: '提案',
          negotiation: '谈判',
          closed_won: '成交',
          closed_lost: '失败',
        };
        addActivity('stage_change', 'opportunity', id, opportunity.title, `销售机会进入 ${stageNames[updates.stage] || updates.stage} 阶段`);
      } else {
        addActivity('updated', 'opportunity', id, opportunity.title, `更新销售机会 ${opportunity.title}`);
      }
    }
  }, [opportunities, addActivity]);

  const deleteOpportunity = useCallback((id: string) => {
    const opportunity = opportunities.find(op => op.id === id);
    if (opportunity) {
      setOpportunities(prev => prev.filter(op => op.id !== id));
      addActivity('deleted', 'opportunity', id, opportunity.title, `删除销售机会 ${opportunity.title}`);
    }
  }, [opportunities, addActivity]);

  // Calculate stats
  const stats: DashboardStats = {
    totalCustomers: customers.length,
    totalContacts: contacts.length,
    totalOpportunities: opportunities.length,
    totalRevenue: opportunities
      .filter(op => op.stage === 'closed_won')
      .reduce((sum, op) => sum + op.value, 0),
    wonOpportunities: opportunities.filter(op => op.stage === 'closed_won').length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
  };

  return (
    <CRMContext.Provider value={{
      customers,
      contacts,
      opportunities,
      activities,
      stats,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addContact,
      updateContact,
      deleteContact,
      addOpportunity,
      updateOpportunity,
      deleteOpportunity,
    }}>
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
