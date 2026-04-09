// CRM System Types

export type CustomerStatus = 'active' | 'inactive' | 'prospect';
export type OpportunityStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  industry: string;
  website?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  customerId: string;
  customerName: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  expectedCloseDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalContacts: number;
  totalOpportunities: number;
  totalRevenue: number;
  wonOpportunities: number;
  activeCustomers: number;
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'stage_change' | 'closed_won' | 'closed_lost';
  entityType: 'customer' | 'contact' | 'opportunity';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
}
