/**
 * 智能客户流失预警系统
 * 
 * 基于客户行为数据和市场信号，预测客户流失风险
 * 采用多维度评分模型，综合分析客户流失概率
 */

// ============ 类型定义 ============

/** 流失风险等级 */
export type ChurnRiskLevel = 'critical' | 'high' | 'medium' | 'low';

/** 流失预警状态 */
export type ChurnAlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

/** 流失预警 */
export interface ChurnAlert {
  id: string;
  customerId: string;
  customerName: string;
  company: string;
  riskLevel: ChurnRiskLevel;
  churnScore: number;              // 流失概率 0-100
  healthScore: number;              // 健康度评分
  triggers: ChurnTrigger[];        // 触发因素
  recommendations: string[];        // 挽留建议
  predictedChurnDate?: string;      // 预测流失日期
  alertStatus: ChurnAlertStatus;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

/** 流失触发因素 */
export interface ChurnTrigger {
  type: ChurnTriggerType;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  evidence: string;
  detectedAt: string;
}

/** 流失触发类型 */
export type ChurnTriggerType = 
  | 'interaction_decline'      // 互动频率下降
  | 'revenue_decline'           // 收入下滑
  | 'engagement_drop'           // 参与度下降
  | 'competitor_switch'          // 竞品切换迹象
  | 'support_complaints'         // 投诉增加
  | 'payment_delays'            // 付款延迟
  | 'inactive_period'           // 长期不活跃
  | 'contract_expiring'          // 合同即将到期
  | 'product_adoption_low'       // 产品使用率低
  | 'relationship_risk';         // 关系风险

/** 流失风险配置 */
export interface ChurnRiskConfig {
  level: ChurnRiskLevel;
  label: string;
  color: string;
  bgColor: string;
  minScore: number;
  maxScore: number;
  description: string;
  action: string;
}

// 流失风险等级配置
export const CHURN_RISK_CONFIG: Record<ChurnRiskLevel, ChurnRiskConfig> = {
  critical: {
    level: 'critical',
    label: '严重',
    color: '#dc2626',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    minScore: 80,
    maxScore: 100,
    description: '客户即将流失，需立即处理',
    action: '立即跟进，优先处理',
  },
  high: {
    level: 'high',
    label: '高风险',
    color: '#ea580c',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    minScore: 60,
    maxScore: 79,
    description: '客户流失风险较高',
    action: '本周内必须跟进',
  },
  medium: {
    level: 'medium',
    label: '中风险',
    color: '#ca8a04',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    minScore: 40,
    maxScore: 59,
    description: '需要关注，防止风险升级',
    action: '两周内跟进',
  },
  low: {
    level: 'low',
    label: '低风险',
    color: '#16a34a',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    minScore: 0,
    maxScore: 39,
    description: '客户状态稳定',
    action: '保持正常跟进',
  },
};

// ============ 流失预警分析 ============

/** 客户流失信号 */
export interface ChurnSignals {
  // 互动相关
  lastInteractionDays: number;
  interactionTrend: 'up' | 'stable' | 'down';
  interactionFrequencyChange: number;  // 百分比变化
  
  // 收入相关
  lastPurchaseDays: number;
  revenueTrend: 'up' | 'stable' | 'down';
  revenueChangePercent: number;
  
  // 订单相关
  orderCountTrend: 'up' | 'stable' | 'down';
  orderCountChange: number;
  
  // 商机相关
  activeOpportunities: number;
  opportunityLoss: boolean;          // 是否丢失商机
  
  // 付款相关
  paymentDelayDays: number;
  hasOverduePayments: boolean;
  
  // 关系相关
  supportTicketsCount: number;
  complaintRate: number;
  
  // 其他
  contractDaysToExpire: number;
  productUsageRate: number;          // 0-100
}

/** 流失分析结果 */
export interface ChurnAnalysis {
  customerId: string;
  customerName: string;
  company: string;
  churnScore: number;                // 流失概率 0-100
  riskLevel: ChurnRiskLevel;
  signals: ChurnSignals;
  triggers: ChurnTrigger[];
  recommendations: string[];
  predictedChurnDate?: string;
  confidence: number;                 // 预测置信度 0-100
}

// ============ 评分规则 ============

/**
 * 计算互动频率下降得分
 */
function calculateInteractionDeclineScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  // 长期不活跃
  if (signals.lastInteractionDays > 90) {
    score = 40;
    trigger = {
      type: 'inactive_period',
      severity: 'critical',
      description: '客户超过90天无互动',
      evidence: `最近一次互动: ${signals.lastInteractionDays}天前`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.lastInteractionDays > 60) {
    score = 25;
    trigger = {
      type: 'inactive_period',
      severity: 'warning',
      description: '客户超过60天无互动',
      evidence: `最近一次互动: ${signals.lastInteractionDays}天前`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.lastInteractionDays > 30) {
    score = 10;
  }

  // 互动频率下降
  if (signals.interactionTrend === 'down' && signals.interactionFrequencyChange < -30) {
    score += 15;
    if (!trigger) {
      trigger = {
        type: 'interaction_decline',
        severity: 'warning',
        description: '互动频率显著下降',
        evidence: `互动频率下降${Math.abs(signals.interactionFrequencyChange).toFixed(0)}%`,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return { score, trigger };
}

/**
 * 计算收入下滑得分
 */
function calculateRevenueDeclineScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  // 长期无购买
  if (signals.lastPurchaseDays > 180) {
    score = 35;
    trigger = {
      type: 'revenue_decline',
      severity: 'critical',
      description: '客户超过6个月无购买',
      evidence: `最近一次购买: ${signals.lastPurchaseDays}天前`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.lastPurchaseDays > 90) {
    score = 20;
    trigger = {
      type: 'revenue_decline',
      severity: 'warning',
      description: '客户超过3个月无购买',
      evidence: `最近一次购买: ${signals.lastPurchaseDays}天前`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.lastPurchaseDays > 30) {
    score = 5;
  }

  // 收入下降趋势
  if (signals.revenueTrend === 'down' && signals.revenueChangePercent < -50) {
    score += 20;
    if (!trigger) {
      trigger = {
        type: 'revenue_decline',
        severity: 'critical',
        description: '收入大幅下滑',
        evidence: `收入下降${Math.abs(signals.revenueChangePercent).toFixed(0)}%`,
        detectedAt: new Date().toISOString(),
      };
    }
  } else if (signals.revenueTrend === 'down' && signals.revenueChangePercent < -20) {
    score += 10;
    if (!trigger) {
      trigger = {
        type: 'revenue_decline',
        severity: 'warning',
        description: '收入持续下降',
        evidence: `收入下降${Math.abs(signals.revenueChangePercent).toFixed(0)}%`,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return { score, trigger };
}

/**
 * 计算参与度下降得分
 */
function calculateEngagementDropScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  // 产品使用率低
  if (signals.productUsageRate < 20) {
    score = 25;
    trigger = {
      type: 'product_adoption_low',
      severity: 'warning',
      description: '产品使用率极低',
      evidence: `产品使用率: ${signals.productUsageRate}%`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.productUsageRate < 40) {
    score = 15;
    trigger = {
      type: 'product_adoption_low',
      severity: 'info',
      description: '产品使用率偏低',
      evidence: `产品使用率: ${signals.productUsageRate}%`,
      detectedAt: new Date().toISOString(),
    };
  }

  // 订单频次下降
  if (signals.orderCountTrend === 'down' && signals.orderCountChange < -50) {
    score += 15;
    if (!trigger) {
      trigger = {
        type: 'engagement_drop',
        severity: 'warning',
        description: '订单频次大幅下降',
        evidence: `订单数下降${Math.abs(signals.orderCountChange).toFixed(0)}%`,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return { score, trigger };
}

/**
 * 计算投诉风险得分
 */
function calculateComplaintScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  // 高投诉率
  if (signals.complaintRate > 30 || signals.supportTicketsCount > 5) {
    score = 30;
    trigger = {
      type: 'support_complaints',
      severity: 'critical',
      description: '投诉率异常高',
      evidence: `投诉率: ${signals.complaintRate}%, 工单数: ${signals.supportTicketsCount}`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.complaintRate > 15 || signals.supportTicketsCount > 2) {
    score = 15;
    trigger = {
      type: 'support_complaints',
      severity: 'warning',
      description: '投诉有所增加',
      evidence: `投诉率: ${signals.complaintRate}%, 工单数: ${signals.supportTicketsCount}`,
      detectedAt: new Date().toISOString(),
    };
  }

  return { score, trigger };
}

/**
 * 计算付款风险得分
 */
function calculatePaymentRiskScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  // 有逾期付款
  if (signals.hasOverduePayments && signals.paymentDelayDays > 30) {
    score = 25;
    trigger = {
      type: 'payment_delays',
      severity: 'critical',
      description: '存在长期逾期付款',
      evidence: `逾期天数: ${signals.paymentDelayDays}天`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.hasOverduePayments) {
    score = 15;
    trigger = {
      type: 'payment_delays',
      severity: 'warning',
      description: '存在逾期付款记录',
      evidence: `逾期天数: ${signals.paymentDelayDays}天`,
      detectedAt: new Date().toISOString(),
    };
  }

  return { score, trigger };
}

/**
 * 计算合同到期风险
 */
function calculateContractRiskScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  // 合同即将到期
  if (signals.contractDaysToExpire > 0 && signals.contractDaysToExpire <= 30) {
    score = 30;
    trigger = {
      type: 'contract_expiring',
      severity: 'critical',
      description: '合同即将到期',
      evidence: `剩余天数: ${signals.contractDaysToExpire}天`,
      detectedAt: new Date().toISOString(),
    };
  } else if (signals.contractDaysToExpire > 0 && signals.contractDaysToExpire <= 60) {
    score = 15;
    trigger = {
      type: 'contract_expiring',
      severity: 'warning',
      description: '合同即将到期，需续约准备',
      evidence: `剩余天数: ${signals.contractDaysToExpire}天`,
      detectedAt: new Date().toISOString(),
    };
  }

  return { score, trigger };
}

/**
 * 计算商机丢失风险
 */
function calculateOpportunityRiskScore(signals: ChurnSignals): { score: number; trigger?: ChurnTrigger } {
  let score = 0;
  let trigger: ChurnTrigger | undefined;

  if (signals.opportunityLoss) {
    score = 20;
    trigger = {
      type: 'competitor_switch',
      severity: 'warning',
      description: '商机被竞争对手抢走',
      evidence: '最近商机未能成交',
      detectedAt: new Date().toISOString(),
    };
  }

  // 无进行中商机
  if (signals.activeOpportunities === 0 && signals.lastPurchaseDays > 60) {
    score += 10;
    if (!trigger) {
      trigger = {
        type: 'engagement_drop',
        severity: 'info',
        description: '无进行中的销售机会',
        evidence: '客户暂无新采购意向',
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return { score, trigger };
}

/**
 * 分析客户流失风险
 */
export function analyzeChurnRisk(params: {
  customerId: string;
  customerName: string;
  company: string;
  signals: ChurnSignals;
}): ChurnAnalysis {
  const { customerId, customerName, company, signals } = params;
  
  const triggers: ChurnTrigger[] = [];
  let totalScore = 0;

  // 计算各项得分
  const interactionResult = calculateInteractionDeclineScore(signals);
  totalScore += interactionResult.score;
  if (interactionResult.trigger) triggers.push(interactionResult.trigger);

  const revenueResult = calculateRevenueDeclineScore(signals);
  totalScore += revenueResult.score;
  if (revenueResult.trigger) triggers.push(revenueResult.trigger);

  const engagementResult = calculateEngagementDropScore(signals);
  totalScore += engagementResult.score;
  if (engagementResult.trigger) triggers.push(engagementResult.trigger);

  const complaintResult = calculateComplaintScore(signals);
  totalScore += complaintResult.score;
  if (complaintResult.trigger) triggers.push(complaintResult.trigger);

  const paymentResult = calculatePaymentRiskScore(signals);
  totalScore += paymentResult.score;
  if (paymentResult.trigger) triggers.push(paymentResult.trigger);

  const contractResult = calculateContractRiskScore(signals);
  totalScore += contractResult.score;
  if (contractResult.trigger) triggers.push(contractResult.trigger);

  const opportunityResult = calculateOpportunityRiskScore(signals);
  totalScore += opportunityResult.score;
  if (opportunityResult.trigger) triggers.push(opportunityResult.trigger);

  // 限制总分不超过100
  totalScore = Math.min(100, totalScore);

  // 确定风险等级
  let riskLevel: ChurnRiskLevel = 'low';
  if (totalScore >= 80) riskLevel = 'critical';
  else if (totalScore >= 60) riskLevel = 'high';
  else if (totalScore >= 40) riskLevel = 'medium';

  // 生成建议
  const recommendations = generateRecommendations(triggers, signals);

  // 预测流失日期 (仅对高风险客户)
  let predictedChurnDate: string | undefined;
  if (riskLevel === 'critical' || riskLevel === 'high') {
    const daysToChurn = predictDaysToChurn(signals);
    const churnDate = new Date();
    churnDate.setDate(churnDate.getDate() + daysToChurn);
    predictedChurnDate = churnDate.toISOString().split('T')[0];
  }

  // 计算置信度
  const confidence = calculateConfidence(triggers, signals);

  return {
    customerId,
    customerName,
    company,
    churnScore: totalScore,
    riskLevel,
    signals,
    triggers,
    recommendations,
    predictedChurnDate,
    confidence,
  };
}

/**
 * 生成挽留建议
 */
function generateRecommendations(triggers: ChurnTrigger[], signals: ChurnSignals): string[] {
  const recommendations: string[] = [];

  // 根据触发因素生成建议
  const triggerTypes = triggers.map(t => t.type);

  if (triggerTypes.includes('inactive_period')) {
    recommendations.push('主动联系客户，安排一对一会议了解近况');
    recommendations.push('发送个性化内容或行业洞察，引起客户兴趣');
  }

  if (triggerTypes.includes('interaction_decline')) {
    recommendations.push('分析客户偏好，调整沟通频率和方式');
    recommendations.push('提供更有价值的内容和解决方案');
  }

  if (triggerTypes.includes('revenue_decline')) {
    recommendations.push('了解客户业务变化，推荐合适的产品升级');
    recommendations.push('提供限时优惠或专属折扣');
    recommendations.push('探索新的使用场景和需求');
  }

  if (triggerTypes.includes('product_adoption_low')) {
    recommendations.push('安排产品培训或使用指导');
    recommendations.push('提供成功案例分享，帮助客户发现价值');
    recommendations.push('简化使用流程，降低使用门槛');
  }

  if (triggerTypes.includes('support_complaints')) {
    recommendations.push('尽快解决客户投诉，展现服务态度');
    recommendations.push('主动回访，了解改进建议');
    recommendations.push('提供补偿方案，修复客户关系');
  }

  if (triggerTypes.includes('payment_delays')) {
    recommendations.push('了解付款困难原因，协商解决方案');
    recommendations.push('调整付款方式或周期');
  }

  if (triggerTypes.includes('contract_expiring')) {
    recommendations.push('尽快启动续约谈判');
    recommendations.push('准备续约优惠方案');
    recommendations.push('强调长期合作价值');
  }

  if (triggerTypes.includes('competitor_switch')) {
    recommendations.push('了解流失原因，收集反馈');
    recommendations.push('强调产品差异化优势');
    recommendations.push('提供更具竞争力的方案');
  }

  if (recommendations.length === 0) {
    recommendations.push('继续保持优质的服务');
    recommendations.push('定期跟进，维护客户关系');
  }

  return recommendations;
}

/**
 * 预测流失天数
 */
function predictDaysToChurn(signals: ChurnSignals): number {
  // 基于多个因素综合预测
  let days = 90; // 默认90天

  if (signals.lastInteractionDays > 60) {
    days = Math.min(days, 30);
  } else if (signals.lastInteractionDays > 30) {
    days = Math.min(days, 60);
  }

  if (signals.lastPurchaseDays > 90) {
    days = Math.min(days, 21);
  } else if (signals.lastPurchaseDays > 30) {
    days = Math.min(days, 45);
  }

  if (signals.hasOverduePayments) {
    days = Math.min(days, 14);
  }

  if (signals.contractDaysToExpire > 0 && signals.contractDaysToExpire <= 30) {
    days = Math.min(days, signals.contractDaysToExpire);
  }

  if (signals.complaintRate > 30) {
    days = Math.min(days, 7);
  }

  return days;
}

/**
 * 计算预测置信度
 */
function calculateConfidence(triggers: ChurnTrigger[], signals: ChurnSignals): number {
  let confidence = 50; // 基础置信度

  // 触发因素越多，置信度越高
  confidence += Math.min(triggers.length * 5, 25);

  // 严重触发因素增加置信度
  const criticalTriggers = triggers.filter(t => t.severity === 'critical');
  confidence += criticalTriggers.length * 10;

  // 有具体数据的支持
  if (signals.lastInteractionDays > 0) confidence += 5;
  if (signals.lastPurchaseDays > 0) confidence += 5;
  if (signals.productUsageRate > 0) confidence += 5;

  return Math.min(100, confidence);
}

/**
 * 获取风险等级配置
 */
export function getRiskLevelConfig(riskLevel: ChurnRiskLevel): ChurnRiskConfig {
  return CHURN_RISK_CONFIG[riskLevel];
}

/**
 * 获取风险等级颜色
 */
export function getRiskLevelColor(riskLevel: ChurnRiskLevel): string {
  return CHURN_RISK_CONFIG[riskLevel].color;
}
