// 销售流程自动化引擎类型定义 (V5.0 新增)

// ============ 自动化规则类型 ============
export type AutomationTriggerType = 
  | 'stage_change'        // 阶段变化
  | 'lead_created'        // 新建线索
  | 'lead_status_change'  // 线索状态变化
  | 'opportunity_created' // 新建商机
  | 'follow_up_overdue'   // 跟进逾期
  | 'no_activity_days'    // 多日无活动
  | 'contract_expiring'  // 合同即将到期
  | 'quote_sent'          // 报价单已发送
  | 'quote_accepted'      // 报价单已接受
  | 'order_created';      // 订单创建

export type AutomationActionType = 
  | 'create_task'         // 创建任务
  | 'send_email'          // 发送邮件
  | 'create_follow_up'    // 创建跟进记录
  | 'update_status'       // 更新状态
  | 'add_tag'            // 添加标签
  | 'send_notification'  // 发送通知
  | 'assign_owner';       // 分配负责人

export type AutomationStatus = 'active' | 'inactive' | 'draft';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
}

export interface AutomationAction {
  type: AutomationActionType;
  config: {
    taskTitle?: string;
    taskType?: 'follow_up' | 'meeting' | 'call' | 'email' | 'demo' | 'proposal';
    taskPriority?: 'low' | 'medium' | 'high' | 'urgent';
    taskDueInDays?: number;
    emailTemplate?: string;
    followUpType?: 'call' | 'email' | 'meeting' | 'note';
    followUpContent?: string;
    followUpDueInDays?: number;
    notificationTitle?: string;
    notificationMessage?: string;
    newStatus?: string;
    tagName?: string;
    assigneeId?: string;
  };
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: AutomationTriggerType;
    conditions?: AutomationCondition[];
  };
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
  applicableTo: 'all' | 'lead' | 'opportunity' | 'customer' | 'contract';
  createdAt: string;
  updatedAt: string;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerType: AutomationTriggerType;
  entityType: string;
  entityId: string;
  entityName: string;
  status: 'success' | 'failed' | 'skipped';
  actionResults: {
    actionType: AutomationActionType;
    success: boolean;
    message?: string;
    createdEntityId?: string;
  }[];
  executedAt: string;
  error?: string;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  executionsToday: number;
  executionsThisWeek: number;
  successRate: number;
}

export const PRESET_RULES = [
  {
    name: '新线索自动创建跟进任务',
    description: '创建新线索时，自动创建3天内跟进任务',
    trigger: { type: 'lead_created' as AutomationTriggerType },
    actions: [
      {
        type: 'create_task' as AutomationActionType,
        config: {
          taskTitle: '跟进线索 - {{entityName}}',
          taskType: 'follow_up' as const,
          taskPriority: 'high' as const,
          taskDueInDays: 3,
        },
      },
    ],
    applicableTo: 'lead' as const,
    priority: 1,
  },
  {
    name: '商机进入方案阶段',
    description: '商机进入方案报价阶段时自动创建演示任务',
    trigger: { type: 'stage_change' as AutomationTriggerType },
    actions: [
      {
        type: 'create_task' as AutomationActionType,
        config: {
          taskTitle: '产品演示 - {{entityName}}',
          taskType: 'demo' as const,
          taskPriority: 'medium' as const,
          taskDueInDays: 7,
        },
      },
    ],
    applicableTo: 'opportunity' as const,
    priority: 2,
  },
  {
    name: '商机无进展提醒',
    description: '商机在当前阶段超过14天无进展时提醒',
    trigger: { type: 'no_activity_days' as AutomationTriggerType },
    actions: [
      {
        type: 'create_task' as AutomationActionType,
        config: {
          taskTitle: '商机需跟进 - {{entityName}}',
          taskType: 'follow_up' as const,
          taskPriority: 'high' as const,
          taskDueInDays: 1,
        },
      },
    ],
    applicableTo: 'opportunity' as const,
    priority: 3,
  },
  {
    name: '合同到期提醒',
    description: '合同到期前30天自动创建续约任务',
    trigger: { type: 'contract_expiring' as AutomationTriggerType },
    actions: [
      {
        type: 'create_task' as AutomationActionType,
        config: {
          taskTitle: '合同续约 - {{entityName}}',
          taskType: 'follow_up' as const,
          taskPriority: 'urgent' as const,
          taskDueInDays: 7,
        },
      },
    ],
    applicableTo: 'contract' as const,
    priority: 4,
  },
];

export const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  stage_change: '阶段变化',
  lead_created: '新建线索',
  lead_status_change: '线索状态变化',
  opportunity_created: '新建商机',
  follow_up_overdue: '跟进逾期',
  no_activity_days: '无活动提醒',
  contract_expiring: '合同到期提醒',
  quote_sent: '报价已发送',
  quote_accepted: '报价已接受',
  order_created: '订单创建',
};

export const ACTION_LABELS: Record<AutomationActionType, string> = {
  create_task: '创建任务',
  send_email: '发送邮件',
  create_follow_up: '创建跟进',
  update_status: '更新状态',
  add_tag: '添加标签',
  send_notification: '发送通知',
  assign_owner: '分配负责人',
};
