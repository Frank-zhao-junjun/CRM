// CRM System Types - DDD版本

// ============ 值对象类型 ============
export type CustomerStatus = 'active' | 'inactive' | 'prospect';
export type LeadStatusType = 'new' | 'contacted' | 'qualified' | 'disqualified';
export type LeadSourceType = 'referral' | 'website' | 'cold_call' | 'event' | 'advertisement' | 'other';
export type OpportunityStage = 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

// ============ 实体类型 ============
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

// ============ 销售线索类型 (新增) ============
export interface SalesLead {
  id: string;
  title: string;
  source: LeadSourceType;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  estimatedValue: number;
  probability: number;
  status: LeadStatusType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOpportunity {
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
  notes?: string;
  sourceLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 活动记录 ============
export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'stage_change' | 'closed_won' | 'closed_lost' | 'qualified' | 'disqualified' | 'follow_up';
  entityType: 'customer' | 'contact' | 'lead' | 'opportunity';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
}

// ============ 跟进记录 (V3.0) ============
export type FollowUpType = 'call' | 'email' | 'meeting' | 'note';

export interface FollowUp {
  id: string;
  entityType: 'lead' | 'opportunity';
  entityId: string;
  entityName: string;
  type: FollowUpType;
  content: string;
  scheduledAt: string | null;
  completedAt: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ 通知 (V3.0) ============
export type NotificationType = 'overdue' | 'reminder' | 'stage_change' | 'info';

export interface CRMNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: 'lead' | 'opportunity';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

// ============ 统计数据 ============
export interface DashboardStats {
  totalCustomers: number;
  totalContacts: number;
  totalLeads: number;          // 新增: 线索总数
  totalOpportunities: number;  // 排除线索阶段
  totalRevenue: number;
  wonOpportunities: number;
  activeCustomers: number;
}

// ============ 阶段配置 (用于UI展示) ============
export const OPPORTUNITY_STAGE_CONFIG: Record<OpportunityStage, { 
  label: string; 
  className: string; 
  gradient: string; 
  color: string;
  defaultProbability: number;
}> = {
  qualified: { 
    label: '销售机会', 
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    gradient: 'from-blue-400 to-cyan-500',
    color: 'text-blue-600 dark:text-blue-400',
    defaultProbability: 30,
  },
  proposal: { 
    label: '提案', 
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    gradient: 'from-purple-400 to-pink-500',
    color: 'text-purple-600 dark:text-purple-400',
    defaultProbability: 50,
  },
  negotiation: { 
    label: '谈判', 
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    gradient: 'from-orange-400 to-amber-500',
    color: 'text-orange-600 dark:text-orange-400',
    defaultProbability: 80,
  },
  closed_won: { 
    label: '成交', 
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    gradient: 'from-green-400 to-emerald-500',
    color: 'text-green-600 dark:text-green-400',
    defaultProbability: 100,
  },
  closed_lost: { 
    label: '失败', 
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    gradient: 'from-red-400 to-rose-500',
    color: 'text-red-600 dark:text-red-400',
    defaultProbability: 0,
  },
};

// ============ 线索状态配置 ============
export const LEAD_STATUS_CONFIG: Record<LeadStatusType, { 
  label: string; 
  className: string; 
  gradient: string; 
  color: string;
}> = {
  new: { 
    label: '新建', 
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    gradient: 'from-gray-400 to-slate-500',
    color: 'text-gray-600 dark:text-gray-400',
  },
  contacted: { 
    label: '已联系', 
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    gradient: 'from-yellow-400 to-orange-500',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  qualified: { 
    label: '已Qualified', 
    className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    gradient: 'from-cyan-400 to-blue-500',
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  disqualified: { 
    label: '已放弃', 
    className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20',
    gradient: 'from-stone-400 to-zinc-500',
    color: 'text-stone-600 dark:text-stone-400',
  },
};

// ============ 线索来源配置 ============
export const LEAD_SOURCE_CONFIG: Record<LeadSourceType, { label: string; icon: string }> = {
  referral: { label: '转介绍', icon: '👥' },
  website: { label: '网站', icon: '🌐' },
  cold_call: { label: '电话拓展', icon: '📞' },
  event: { label: '活动', icon: '🎪' },
  advertisement: { label: '广告', icon: '📢' },
  other: { label: '其他', icon: '📋' },
};

// ============ 销售漏斗配置 ============
export const PIPELINE_STAGES: OpportunityStage[] = [
  'qualified',
  'proposal', 
  'negotiation',
  'closed_won',
  'closed_lost',
];

// ============ 阶段转换规则 ============
export const STAGE_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  qualified: ['proposal', 'closed_lost'],
  proposal: ['negotiation', 'closed_lost'],
  negotiation: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
};
