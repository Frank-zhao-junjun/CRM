/**
 * 自动化规则引擎
 * 
 * 支持三种触发类型：
 * 1. field_change - 字段变化
 * 2. status_change - 状态变更
 * 3. time_condition - 时间条件
 * 
 * 支持三种动作：
 * 1. create_task - 创建任务
 * 2. send_notification - 发送通知
 * 3. update_field - 更新字段
 */

// ============ 类型定义 ============

/** 触发类型 */
export type TriggerType = 'field_change' | 'status_change' | 'time_condition';

/** 实体类型 */
export type EntityType = 'customer' | 'opportunity' | 'lead' | 'order' | 'contact';

/** 动作类型 */
export type ActionType = 'create_task' | 'send_notification' | 'update_field';

/** 条件运算符 */
export type ConditionOperator = 
  | 'equals'           // 等于
  | 'not_equals'       // 不等于
  | 'contains'          // 包含
  | 'not_contains'      // 不包含
  | 'greater_than'      // 大于
  | 'less_than'         // 小于
  | 'is_empty'         // 为空
  | 'is_not_empty';     // 不为空

/** 规则条件 */
export interface RuleCondition {
  field: string;           // 字段名
  operator: ConditionOperator;
  value?: string | number | boolean; // 比较值
}

/** 规则动作 */
export interface RuleAction {
  type: ActionType;
  params: Record<string, string | number | boolean>;
}

/** 规则配置 */
export interface RuleConfig {
  id?: string;
  name: string;
  description?: string;
  trigger_type: TriggerType;
  entity_type: EntityType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  is_enabled?: boolean;
  priority?: number;
}

/** 预设规则模板 */
export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  config: RuleConfig;
}

// ============ 预设规则模板 ============

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'template_1',
    name: '商机阶段变更提醒',
    description: '当商机阶段变为"提案"时，自动创建跟进任务',
    icon: 'Briefcase',
    category: '商机管理',
    config: {
      name: '商机阶段变更提醒',
      description: '当商机阶段变为"提案"时，自动创建跟进任务',
      trigger_type: 'status_change',
      entity_type: 'opportunity',
      conditions: [
        { field: 'stage', operator: 'equals', value: 'proposal' },
      ],
      actions: [
        { 
          type: 'create_task', 
          params: { 
            title: '商机跟进：提案阶段需要报价', 
            description: '请及时与客户沟通报价细节',
            due_days: 3,
          } 
        },
        { 
          type: 'send_notification', 
          params: { 
            message: '商机已进入提案阶段，请及时跟进',
            recipient: 'owner',
          } 
        },
      ],
      priority: 10,
    },
  },
  {
    id: 'template_2',
    name: '高价值商机提醒',
    description: '当商机金额超过10万时，发送提醒通知',
    icon: 'TrendingUp',
    category: '商机管理',
    config: {
      name: '高价值商机提醒',
      description: '当商机金额超过10万时，发送提醒通知',
      trigger_type: 'field_change',
      entity_type: 'opportunity',
      conditions: [
        { field: 'value', operator: 'greater_than', value: 100000 },
      ],
      actions: [
        { 
          type: 'send_notification', 
          params: { 
            message: '发现高价值商机，请重点关注',
            recipient: 'manager',
          } 
        },
      ],
      priority: 8,
    },
  },
  {
    id: 'template_3',
    name: '客户长期未跟进',
    description: '客户超过30天未互动时，创建跟进任务',
    icon: 'Clock',
    category: '客户管理',
    config: {
      name: '客户长期未跟进',
      description: '客户超过30天未互动时，创建跟进任务',
      trigger_type: 'time_condition',
      entity_type: 'customer',
      conditions: [
        { field: 'last_interaction_days', operator: 'greater_than', value: 30 },
      ],
      actions: [
        { 
          type: 'create_task', 
          params: { 
            title: '客户需要跟进', 
            description: '该客户已超过30天未互动，请主动联系',
            due_days: 1,
          } 
        },
      ],
      priority: 5,
    },
  },
  {
    id: 'template_4',
    name: '商机失败提醒',
    description: '当商机状态变为"丢单"时，记录失败原因',
    icon: 'AlertTriangle',
    category: '商机管理',
    config: {
      name: '商机失败提醒',
      description: '当商机状态变为"丢单"时，记录失败原因',
      trigger_type: 'status_change',
      entity_type: 'opportunity',
      conditions: [
        { field: 'stage', operator: 'equals', value: 'closed_lost' },
      ],
      actions: [
        { 
          type: 'update_field', 
          params: { 
            field: 'notes',
            append: true,
            value: '[丢单提醒] 请分析丢单原因，总结经验教训',
          } 
        },
        { 
          type: 'send_notification', 
          params: { 
            message: '商机已丢单，请分析原因',
            recipient: 'owner',
          } 
        },
      ],
      priority: 7,
    },
  },
  {
    id: 'template_5',
    name: '新线索自动分配',
    description: '新线索创建时，自动分配给指定销售人员',
    icon: 'UserPlus',
    category: '线索管理',
    config: {
      name: '新线索自动分配',
      description: '新线索创建时，自动分配给指定销售人员',
      trigger_type: 'field_change',
      entity_type: 'lead',
      conditions: [
        { field: 'is_new', operator: 'equals', value: true },
      ],
      actions: [
        { 
          type: 'send_notification', 
          params: { 
            message: '您有新的线索需要跟进',
            recipient: 'owner',
          } 
        },
      ],
      priority: 9,
    },
  },
];

// ============ 触发类型配置 ============

export const TRIGGER_TYPE_CONFIG = {
  field_change: {
    label: '字段变化',
    description: '当指定字段的值发生变化时触发',
    icon: 'Edit',
    color: '#3b82f6',
  },
  status_change: {
    label: '状态变更',
    description: '当记录状态发生变化时触发',
    icon: 'RefreshCw',
    color: '#8b5cf6',
  },
  time_condition: {
    label: '时间条件',
    description: '基于时间条件定期检查并触发',
    icon: 'Clock',
    color: '#f59e0b',
  },
};

// ============ 实体类型配置 ============

export const ENTITY_TYPE_CONFIG = {
  customer: {
    label: '客户',
    icon: 'Building',
    fields: ['name', 'status', 'industry', 'last_interaction_days'],
  },
  opportunity: {
    label: '商机',
    icon: 'Briefcase',
    fields: ['title', 'value', 'stage', 'customer_id'],
  },
  lead: {
    label: '线索',
    icon: 'User',
    fields: ['title', 'status', 'source', 'customer_id'],
  },
  order: {
    label: '订单',
    icon: 'ShoppingCart',
    fields: ['order_number', 'total', 'status', 'customer_id'],
  },
  contact: {
    label: '联系人',
    icon: 'Contact',
    fields: ['name', 'email', 'phone', 'customer_id'],
  },
};

// ============ 动作类型配置 ============

export const ACTION_TYPE_CONFIG = {
  create_task: {
    label: '创建任务',
    description: '自动创建待办任务',
    icon: 'CheckSquare',
    color: '#22c55e',
    params: [
      { name: 'title', label: '任务标题', type: 'string', required: true },
      { name: 'description', label: '任务描述', type: 'string', required: false },
      { name: 'due_days', label: '截止天数', type: 'number', required: false, default: 3 },
    ],
  },
  send_notification: {
    label: '发送通知',
    description: '向相关人员发送通知',
    icon: 'Bell',
    color: '#f59e0b',
    params: [
      { name: 'message', label: '通知内容', type: 'string', required: true },
      { name: 'recipient', label: '接收人', type: 'select', required: true, options: ['owner', 'manager', 'team'] },
    ],
  },
  update_field: {
    label: '更新字段',
    description: '自动更新记录字段值',
    icon: 'PenTool',
    color: '#6366f1',
    params: [
      { name: 'field', label: '字段名', type: 'string', required: true },
      { name: 'value', label: '新值', type: 'string', required: true },
      { name: 'append', label: '追加模式', type: 'boolean', required: false, default: false },
    ],
  },
};

// ============ 运算符配置 ============

export const OPERATOR_CONFIG: Record<ConditionOperator, { label: string; types: string[] }> = {
  equals: { label: '等于', types: ['string', 'number', 'boolean'] },
  not_equals: { label: '不等于', types: ['string', 'number', 'boolean'] },
  contains: { label: '包含', types: ['string'] },
  not_contains: { label: '不包含', types: ['string'] },
  greater_than: { label: '大于', types: ['number'] },
  less_than: { label: '小于', types: ['number'] },
  is_empty: { label: '为空', types: ['string', 'number'] },
  is_not_empty: { label: '不为空', types: ['string', 'number'] },
};

// ============ 规则评估逻辑 ============

/**
 * 评估条件是否满足
 */
export function evaluateCondition(
  condition: RuleCondition,
  currentValue: unknown,
  previousValue?: unknown
): boolean {
  const { field, operator, value } = condition;

  // 检查是否是字段变化触发
  if (operator === 'equals' && previousValue !== undefined) {
    // 字段变化检测：当前值等于指定值，且与之前不同
    return currentValue === value && currentValue !== previousValue;
  }

  switch (operator) {
    case 'equals':
      return currentValue === value;
    case 'not_equals':
      return currentValue !== value;
    case 'contains':
      return typeof currentValue === 'string' && currentValue.includes(String(value));
    case 'not_contains':
      return typeof currentValue === 'string' && !currentValue.includes(String(value));
    case 'greater_than':
      return typeof currentValue === 'number' && currentValue > Number(value);
    case 'less_than':
      return typeof currentValue === 'number' && currentValue < Number(value);
    case 'is_empty':
      return currentValue === null || currentValue === undefined || currentValue === '';
    case 'is_not_empty':
      return currentValue !== null && currentValue !== undefined && currentValue !== '';
    default:
      return false;
  }
}

/**
 * 执行动作
 */
export async function executeAction(
  action: RuleAction,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  context: Record<string, unknown>
): Promise<{ success: boolean; message?: string }> {
  const { type, params } = action;

  switch (type) {
    case 'create_task':
      // 创建任务的逻辑会由 API 层实现
      console.log('执行创建任务:', {
        entityType,
        entityId,
        entityName,
        title: params.title,
        description: params.description,
        due_days: params.due_days,
      });
      return { success: true, message: '任务创建成功' };

    case 'send_notification':
      // 发送通知的逻辑会由 API 层实现
      console.log('发送通知:', {
        entityType,
        entityId,
        entityName,
        message: params.message,
        recipient: params.recipient,
      });
      return { success: true, message: '通知发送成功' };

    case 'update_field':
      // 更新字段的逻辑会由 API 层实现
      console.log('更新字段:', {
        entityType,
        entityId,
        field: params.field,
        value: params.value,
        append: params.append,
      });
      return { success: true, message: '字段更新成功' };

    default:
      return { success: false, message: '未知的动作类型' };
  }
}

/**
 * 触发规则
 */
export async function triggerRule(
  rule: RuleConfig,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  context: Record<string, unknown>
): Promise<{ triggered: boolean; results: Array<{ action: string; success: boolean; message?: string }> }> {
  if (!rule.is_enabled) {
    return { triggered: false, results: [] };
  }

  const results: Array<{ action: string; success: boolean; message?: string }> = [];

  // 评估所有条件
  let allConditionsMet = true;
  
  for (const condition of rule.conditions) {
    const change = changes[condition.field];
    if (!change) {
      // 没有变化，跳过此字段的条件
      continue;
    }

    const conditionMet = evaluateCondition(condition, change.new, change.old);
    if (!conditionMet) {
      allConditionsMet = false;
      break;
    }
  }

  if (!allConditionsMet) {
    return { triggered: false, results: [] };
  }

  // 执行所有动作
  for (const action of rule.actions) {
    const result = await executeAction(action, entityType, entityId, entityName, context);
    results.push({
      action: action.type,
      ...result,
    });
  }

  return { triggered: true, results };
}

/**
 * 解析 JSON 条件/动作
 */
export function parseConditions(conditionsJson: string): RuleCondition[] {
  try {
    return JSON.parse(conditionsJson);
  } catch {
    return [];
  }
}

export function parseActions(actionsJson: string): RuleAction[] {
  try {
    return JSON.parse(actionsJson);
  } catch {
    return [];
  }
}

export function stringifyConditions(conditions: RuleCondition[]): string {
  return JSON.stringify(conditions);
}

export function stringifyActions(actions: RuleAction[]): string {
  return JSON.stringify(actions);
}
