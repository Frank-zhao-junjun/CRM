// 销售自动化序列 - 类型定义和API
export interface SequenceStep {
  id: string;
  type: 'email' | 'task' | 'delay';
  order: number;
  config: {
    // email类型
    templateId?: string;
    subject?: string;
    body?: string;
    // task类型
    taskTitle?: string;
    taskDescription?: string;
    taskDueInDays?: number;
    taskPriority?: 'high' | 'medium' | 'low';
    // delay类型
    delayDays?: number;
  };
}

export interface Sequence {
  id: string;
  name: string;
  description: string;
  steps: SequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetType: 'lead' | 'opportunity' | 'customer';
  createdAt: string;
  updatedAt: string;
  stats: {
    enrolled: number;
    completed: number;
    responseRate: number;
  };
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  entityId: string;
  entityType: 'lead' | 'opportunity' | 'customer';
  currentStepIndex: number;
  status: 'active' | 'completed' | 'stopped' | 'bounced';
  enrolledAt: string;
  completedAt?: string;
  stepHistory: {
    stepId: string;
    executedAt: string;
    result: 'sent' | 'failed' | 'completed';
  }[];
}

// 预设邮件模板
export const emailTemplates = [
  {
    id: 'intro',
    name: '开场介绍',
    subject: '您好，我是...',
    body: '尊敬的客户您好，我是贵公司的专属销售顾问...',
  },
  {
    id: 'followup',
    name: '初次跟进',
    subject: '上次沟通的后续',
    body: '您好，希望您收到上一封邮件后一切顺利...',
  },
  {
    id: 'proposal',
    name: '方案发送',
    subject: '您的专属方案已准备就绪',
    body: '您好，根据您的需求，我为您准备了一份详细的解决方案...',
  },
  {
    id: 'demo',
    name: '演示邀请',
    subject: '邀请您体验我们的产品',
    body: '您好，我们诚挚邀请您参加我们的产品演示...',
  },
  {
    id: 'deadline',
    name: '限时优惠',
    subject: '特别优惠即将截止',
    body: '您好，特别通知您，我们目前的优惠活动即将截止...',
  },
];

// 序列存储
let sequences: Sequence[] = [
  {
    id: 'seq-001',
    name: '新线索培育序列',
    description: '针对新获取的销售线索，自动发送系列邮件和跟进任务',
    status: 'active',
    targetType: 'lead',
    createdAt: '2026-04-16',
    updatedAt: '2026-04-16',
    stats: { enrolled: 15, completed: 8, responseRate: 35 },
    steps: [
      {
        id: 'step-1',
        type: 'email',
        order: 1,
        config: {
          templateId: 'intro',
          subject: '您好，我是贵公司的专属销售顾问',
          body: '尊敬的客户您好，我是贵公司的专属销售顾问，很高兴认识您...',
        },
      },
      {
        id: 'step-2',
        type: 'delay',
        order: 2,
        config: { delayDays: 2 },
      },
      {
        id: 'step-3',
        type: 'email',
        order: 3,
        config: {
          templateId: 'followup',
          subject: '上次沟通的后续',
          body: '您好，希望您收到上一封邮件后一切顺利...',
        },
      },
      {
        id: 'step-4',
        type: 'task',
        order: 4,
        config: {
          taskTitle: '电话跟进线索',
          taskDescription: '主动拨打电话了解客户需求',
          taskDueInDays: 1,
          taskPriority: 'high',
        },
      },
      {
        id: 'step-5',
        type: 'delay',
        order: 5,
        config: { delayDays: 3 },
      },
      {
        id: 'step-6',
        type: 'email',
        order: 6,
        config: {
          templateId: 'proposal',
          subject: '您的专属方案已准备就绪',
          body: '您好，根据您的需求，我为您准备了一份详细的解决方案...',
        },
      },
    ],
  },
  {
    id: 'seq-002',
    name: '商机转化序列',
    description: '针对已创建商机的潜在客户，推进成交流程',
    status: 'active',
    targetType: 'opportunity',
    createdAt: '2026-04-16',
    updatedAt: '2026-04-16',
    stats: { enrolled: 8, completed: 3, responseRate: 50 },
    steps: [
      {
        id: 'step-1',
        type: 'task',
        order: 1,
        config: {
          taskTitle: '安排产品演示',
          taskDescription: '与客户安排一次线上/线下产品演示',
          taskDueInDays: 1,
          taskPriority: 'high',
        },
      },
      {
        id: 'step-2',
        type: 'delay',
        order: 2,
        config: { delayDays: 2 },
      },
      {
        id: 'step-3',
        type: 'email',
        order: 3,
        config: {
          templateId: 'demo',
          subject: '邀请您体验我们的产品',
          body: '您好，我们诚挚邀请您参加我们的产品演示...',
        },
      },
      {
        id: 'step-4',
        type: 'delay',
        order: 4,
        config: { delayDays: 3 },
      },
      {
        id: 'step-5',
        type: 'email',
        order: 5,
        config: {
          templateId: 'proposal',
          subject: '您的专属方案已准备就绪',
          body: '您好，根据您的需求，我为您准备了一份详细的解决方案...',
        },
      },
      {
        id: 'step-6',
        type: 'task',
        order: 6,
        config: {
          taskTitle: '报价谈判',
          taskDescription: '与客户进行价格谈判并促成成交',
          taskDueInDays: 2,
          taskPriority: 'high',
        },
      },
    ],
  },
];

let enrollments: SequenceEnrollment[] = [
  {
    id: 'enroll-001',
    sequenceId: 'seq-001',
    entityId: 'lead-001',
    entityType: 'lead',
    currentStepIndex: 3,
    status: 'active',
    enrolledAt: '2026-04-14',
    stepHistory: [
      { stepId: 'step-1', executedAt: '2026-04-14', result: 'sent' },
      { stepId: 'step-2', executedAt: '2026-04-14', result: 'completed' },
      { stepId: 'step-3', executedAt: '2026-04-16', result: 'sent' },
    ],
  },
  {
    id: 'enroll-002',
    sequenceId: 'seq-002',
    entityId: 'opp-001',
    entityType: 'opportunity',
    currentStepIndex: 1,
    status: 'active',
    enrolledAt: '2026-04-15',
    stepHistory: [
      { stepId: 'step-1', executedAt: '2026-04-15', result: 'completed' },
    ],
  },
];

// CRUD 操作
export const sequenceAPI = {
  // 获取所有序列
  getAll: () => sequences,
  
  // 获取单个序列
  getById: (id: string) => sequences.find(s => s.id === id),
  
  // 创建序列
  create: (data: Partial<Sequence>) => {
    const newSeq: Sequence = {
      id: `seq-${Date.now()}`,
      name: data.name || '新序列',
      description: data.description || '',
      steps: data.steps || [],
      status: 'draft',
      targetType: data.targetType || 'lead',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      stats: { enrolled: 0, completed: 0, responseRate: 0 },
    };
    sequences.push(newSeq);
    return newSeq;
  },
  
  // 更新序列
  update: (id: string, data: Partial<Sequence>) => {
    const index = sequences.findIndex(s => s.id === id);
    if (index !== -1) {
      sequences[index] = { ...sequences[index], ...data, updatedAt: new Date().toISOString().split('T')[0] };
      return sequences[index];
    }
    return null;
  },
  
  // 删除序列
  delete: (id: string) => {
    sequences = sequences.filter(s => s.id !== id);
    enrollments = enrollments.filter(e => e.sequenceId !== id);
    return true;
  },
  
  // 启动序列
  activate: (id: string) => {
    const seq = sequences.find(s => s.id === id);
    if (seq) {
      seq.status = 'active';
      seq.updatedAt = new Date().toISOString().split('T')[0];
    }
    return seq;
  },
  
  // 暂停序列
  pause: (id: string) => {
    const seq = sequences.find(s => s.id === id);
    if (seq) {
      seq.status = 'paused';
      seq.updatedAt = new Date().toISOString().split('T')[0];
    }
    return seq;
  },
  
  // 获取参与记录
  getEnrollments: (sequenceId?: string) => {
    if (sequenceId) {
      return enrollments.filter(e => e.sequenceId === sequenceId);
    }
    return enrollments;
  },
  
  // 添加参与记录
  enroll: (sequenceId: string, entityId: string, entityType: 'lead' | 'opportunity' | 'customer') => {
    const enrollment: SequenceEnrollment = {
      id: `enroll-${Date.now()}`,
      sequenceId,
      entityId,
      entityType,
      currentStepIndex: 0,
      status: 'active',
      enrolledAt: new Date().toISOString().split('T')[0],
      stepHistory: [],
    };
    enrollments.push(enrollment);
    
    // 更新序列统计
    const seq = sequences.find(s => s.id === sequenceId);
    if (seq) {
      seq.stats.enrolled += 1;
    }
    
    return enrollment;
  },
  
  // 获取邮件模板
  getEmailTemplates: () => emailTemplates,
};
