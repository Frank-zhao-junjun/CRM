/**
 * 客户健康度评分系统
 * 基于5个维度计算客户健康度评分 (总分100分)
 * 
 * 评分维度:
 * 1. 互动频率 (25%) - 最近一次互动距今天数
 * 2. 销售金额 (30%) - 年度购买金额
 * 3. 订单频次 (20%) - 年度订单数
 * 4. 商机活跃 (15%) - 当前进行中商机数
 * 5. 回款及时 (10%) - 历史逾期率
 */

// 评分维度权重
export const SCORE_WEIGHTS = {
  interaction: 0.25,      // 互动频率 25%
  salesAmount: 0.30,       // 销售金额 30%
  orderFrequency: 0.20,    // 订单频次 20%
  opportunityActivity: 0.15, // 商机关怀 15%
  paymentTimeliness: 0.10,  // 回款及时 10%
};

// 健康度等级
export type HealthLevel = 'healthy' | 'good' | 'fair' | 'risk';

export const HEALTH_LEVELS = {
  healthy: { label: '健康', minScore: 80, color: '#22c55e', bgColor: 'bg-green-100' },
  good: { label: '良好', minScore: 60, color: '#3b82f6', bgColor: 'bg-blue-100' },
  fair: { label: '一般', minScore: 40, color: '#f59e0b', bgColor: 'bg-yellow-100' },
  risk: { label: '风险', minScore: 0, color: '#ef4444', bgColor: 'bg-red-100' },
};

// 维度得分详情
export interface DimensionScore {
  score: number;        // 得分 (0-100)
  maxScore: number;     // 满分 (100)
  weight: number;       // 权重
  weightedScore: number; // 加权得分
  rawValue: number;     // 原始数据值
  displayValue: string; // 显示值
  label: string;        // 维度名称
}

// 客户健康度评分
export interface CustomerHealthScore {
  customerId: string;
  customerName: string;
  company: string;
  totalScore: number;        // 总分 (0-100)
  level: HealthLevel;        // 等级
  levelLabel: string;        // 等级标签
  dimensions: {
    interaction: DimensionScore;
    salesAmount: DimensionScore;
    orderFrequency: DimensionScore;
    opportunityActivity: DimensionScore;
    paymentTimeliness: DimensionScore;
  };
  suggestions: string[];     // 改善建议
}

// 客户健康度统计数据
export interface HealthStats {
  totalCustomers: number;
  averageScore: number;
  distribution: {
    healthy: number;
    good: number;
    fair: number;
    risk: number;
  };
  highRiskCustomers: CustomerHealthScore[];
  topCustomers: CustomerHealthScore[];
}

/**
 * 计算互动频率得分 (25%)
 * 最近一次互动距今天数:
 * - 30天内 = 100分
 * - 60天内 = 50分
 * - 90天内 = 20分
 * - 90天以上 = 0分
 */
export function calculateInteractionScore(daysSinceLastInteraction: number): DimensionScore {
  let score: number;
  let displayValue: string;

  if (daysSinceLastInteraction <= 30) {
    score = 100;
    displayValue = `${daysSinceLastInteraction}天`;
  } else if (daysSinceLastInteraction <= 60) {
    score = 50;
    displayValue = `${daysSinceLastInteraction}天`;
  } else if (daysSinceLastInteraction <= 90) {
    score = 20;
    displayValue = `${daysSinceLastInteraction}天`;
  } else {
    score = 0;
    displayValue = `${daysSinceLastInteraction}天`;
  }

  return {
    score,
    maxScore: 100,
    weight: SCORE_WEIGHTS.interaction,
    weightedScore: score * SCORE_WEIGHTS.interaction,
    rawValue: daysSinceLastInteraction,
    displayValue,
    label: '互动频率',
  };
}

/**
 * 计算销售金额得分 (30%)
 * 年度购买金额:
 * - >10万 = 100分
 * - >5万 = 80分
 * - >1万 = 60分
 * - <1万 = 40分
 */
export function calculateSalesAmountScore(annualSalesAmount: number): DimensionScore {
  let score: number;
  let displayValue: string;

  if (annualSalesAmount > 100000) {
    score = 100;
    displayValue = `¥${(annualSalesAmount / 10000).toFixed(0)}万`;
  } else if (annualSalesAmount > 50000) {
    score = 80;
    displayValue = `¥${(annualSalesAmount / 10000).toFixed(0)}万`;
  } else if (annualSalesAmount > 10000) {
    score = 60;
    displayValue = `¥${(annualSalesAmount / 10000).toFixed(1)}万`;
  } else {
    score = 40;
    displayValue = annualSalesAmount > 0 ? `¥${annualSalesAmount.toFixed(0)}` : '无交易';
  }

  return {
    score,
    maxScore: 100,
    weight: SCORE_WEIGHTS.salesAmount,
    weightedScore: score * SCORE_WEIGHTS.salesAmount,
    rawValue: annualSalesAmount,
    displayValue,
    label: '销售金额',
  };
}

/**
 * 计算订单频次得分 (20%)
 * 年度订单数:
 * - >10单 = 100分
 * - >5单 = 80分
 * - >2单 = 60分
 * - <2单 = 40分
 */
export function calculateOrderFrequencyScore(orderCount: number): DimensionScore {
  let score: number;
  let displayValue: string;

  if (orderCount > 10) {
    score = 100;
    displayValue = `${orderCount}单/年`;
  } else if (orderCount > 5) {
    score = 80;
    displayValue = `${orderCount}单/年`;
  } else if (orderCount > 2) {
    score = 60;
    displayValue = `${orderCount}单/年`;
  } else {
    score = 40;
    displayValue = orderCount > 0 ? `${orderCount}单/年` : '无订单';
  }

  return {
    score,
    maxScore: 100,
    weight: SCORE_WEIGHTS.orderFrequency,
    weightedScore: score * SCORE_WEIGHTS.orderFrequency,
    rawValue: orderCount,
    displayValue,
    label: '订单频次',
  };
}

/**
 * 计算商机活跃得分 (15%)
 * 当前进行中商机数:
 * - >3个 = 100分
 * - >1个 = 70分
 * - 1个 = 50分
 * - 0个 = 30分
 */
export function calculateOpportunityActivityScore(activeOpportunityCount: number): DimensionScore {
  let score: number;
  let displayValue: string;

  if (activeOpportunityCount > 3) {
    score = 100;
    displayValue = `${activeOpportunityCount}个`;
  } else if (activeOpportunityCount > 1) {
    score = 70;
    displayValue = `${activeOpportunityCount}个`;
  } else if (activeOpportunityCount === 1) {
    score = 50;
    displayValue = '1个';
  } else {
    score = 30;
    displayValue = '无进行中';
  }

  return {
    score,
    maxScore: 100,
    weight: SCORE_WEIGHTS.opportunityActivity,
    weightedScore: score * SCORE_WEIGHTS.opportunityActivity,
    rawValue: activeOpportunityCount,
    displayValue,
    label: '商机关怀',
  };
}

/**
 * 计算回款及时得分 (10%)
 * 基于历史订单的逾期率:
 * - 0% = 100分
 * - <10% = 80分
 * - <30% = 50分
 * - >=30% = 0分
 */
export function calculatePaymentTimelinessScore(overdueRate: number, hasOverduePayments: boolean): DimensionScore {
  let score: number;
  let displayValue: string;

  if (overdueRate === 0 && !hasOverduePayments) {
    score = 100;
    displayValue = '及时回款';
  } else if (overdueRate < 10) {
    score = 80;
    displayValue = `${overdueRate.toFixed(0)}%逾期`;
  } else if (overdueRate < 30) {
    score = 50;
    displayValue = `${overdueRate.toFixed(0)}%逾期`;
  } else {
    score = 0;
    displayValue = `${overdueRate.toFixed(0)}%逾期`;
  }

  return {
    score,
    maxScore: 100,
    weight: SCORE_WEIGHTS.paymentTimeliness,
    weightedScore: score * SCORE_WEIGHTS.paymentTimeliness,
    rawValue: overdueRate,
    displayValue,
    label: '回款及时',
  };
}

/**
 * 根据总分获取健康等级
 */
export function getHealthLevel(totalScore: number): { level: HealthLevel; label: string } {
  if (totalScore >= 80) {
    return { level: 'healthy', label: '健康' };
  } else if (totalScore >= 60) {
    return { level: 'good', label: '良好' };
  } else if (totalScore >= 40) {
    return { level: 'fair', label: '一般' };
  } else {
    return { level: 'risk', label: '风险' };
  }
}

/**
 * 生成改善建议
 */
export function generateSuggestions(scores: {
  interaction: DimensionScore;
  salesAmount: DimensionScore;
  orderFrequency: DimensionScore;
  opportunityActivity: DimensionScore;
  paymentTimeliness: DimensionScore;
}): string[] {
  const suggestions: string[] = [];

  if (scores.interaction.score < 50) {
    suggestions.push('建议增加客户互动频次，定期电话或邮件跟进');
  }
  if (scores.salesAmount.score < 60) {
    suggestions.push('可尝试推荐高价值产品或套餐，提升客单价');
  }
  if (scores.orderFrequency.score < 60) {
    suggestions.push('可设置定期采购提醒，促进复购');
  }
  if (scores.opportunityActivity.score < 50) {
    suggestions.push('建议积极开拓新商机，增加销售机会');
  }
  if (scores.paymentTimeliness.score < 80) {
    suggestions.push('建议完善合同条款，加强回款管理');
  }

  if (suggestions.length === 0) {
    suggestions.push('继续保持优质的服务和合作关系');
  }

  return suggestions;
}

/**
 * 计算客户健康度评分
 */
export function calculateCustomerHealthScore(params: {
  customerId: string;
  customerName: string;
  company: string;
  daysSinceLastInteraction: number;
  annualSalesAmount: number;
  annualOrderCount: number;
  activeOpportunityCount: number;
  overdueRate: number;
  hasOverduePayments: boolean;
}): CustomerHealthScore {
  const { customerId, customerName, company, daysSinceLastInteraction, annualSalesAmount, annualOrderCount, activeOpportunityCount, overdueRate, hasOverduePayments } = params;

  // 计算各维度得分
  const interaction = calculateInteractionScore(daysSinceLastInteraction);
  const salesAmount = calculateSalesAmountScore(annualSalesAmount);
  const orderFrequency = calculateOrderFrequencyScore(annualOrderCount);
  const opportunityActivity = calculateOpportunityActivityScore(activeOpportunityCount);
  const paymentTimeliness = calculatePaymentTimelinessScore(overdueRate, hasOverduePayments);

  // 计算总分
  const totalScore = Math.round(
    interaction.weightedScore +
    salesAmount.weightedScore +
    orderFrequency.weightedScore +
    opportunityActivity.weightedScore +
    paymentTimeliness.weightedScore
  );

  // 获取等级
  const { level, label } = getHealthLevel(totalScore);

  // 生成建议
  const suggestions = generateSuggestions({
    interaction,
    salesAmount,
    orderFrequency,
    opportunityActivity,
    paymentTimeliness,
  });

  return {
    customerId,
    customerName,
    company,
    totalScore,
    level,
    levelLabel: label,
    dimensions: {
      interaction,
      salesAmount,
      orderFrequency,
      opportunityActivity,
      paymentTimeliness,
    },
    suggestions,
  };
}
