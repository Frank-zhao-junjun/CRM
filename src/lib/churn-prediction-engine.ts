// 流失风险预测引擎 - 核心算法

import {
  ChurnRiskLevel,
  ChurnRiskResult,
  ChurnFactor,
  DimensionScore,
  ChurnAlert,
  ChurnPredictionConfig,
  CustomerChurnContext,
  DEFAULT_CHURN_CONFIG,
  CHURN_RISK_CONFIG,
  ChurnDimension,
} from './churn-prediction-types';

// ============ 流失风险评估引擎 ============
export class ChurnPredictionEngine {
  private config: ChurnPredictionConfig;

  constructor(config?: Partial<ChurnPredictionConfig>) {
    this.config = this.mergeConfig(config);
  }

  // 合并配置
  private mergeConfig(partial?: Partial<ChurnPredictionConfig>): ChurnPredictionConfig {
    return {
      ...DEFAULT_CHURN_CONFIG,
      ...partial,
      dimensionConfigs: partial?.dimensionConfigs || DEFAULT_CHURN_CONFIG.dimensionConfigs,
    };
  }

  // 计算流失风险
  calculateRisk(customerId: string, context: CustomerChurnContext): ChurnRiskResult {
    const dimensions: DimensionScore[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    const allFactors: ChurnFactor[] = [];

    // 获取活跃的维度配置
    const activeConfigs = this.config.dimensionConfigs.filter(d => d.isActive);

    for (const dimConfig of activeConfigs) {
      const dimensionResult = this.calculateDimensionScore(context, dimConfig.dimension, dimConfig.weight);
      dimensions.push(dimensionResult);
      allFactors.push(...dimensionResult.factors);
      
      // 加权累加
      totalScore += dimensionResult.score * (dimensionResult.weight / 100);
      totalWeight += dimensionResult.weight;
    }

    // 归一化总分
    const finalScore = totalWeight > 0
      ? Math.round(totalScore / totalWeight * 100)
      : 0;

    // 确定风险等级
    const riskLevel = this.getRiskLevel(finalScore);

    // 生成预警
    const alerts = this.generateAlerts(customerId, context.customer.name, finalScore, riskLevel, allFactors);

    return {
      customerId,
      riskScore: Math.min(100, Math.max(0, finalScore)),
      riskLevel,
      dimensions,
      factors: allFactors,
      alerts,
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  // 计算单个维度分数
  private calculateDimensionScore(
    context: CustomerChurnContext,
    dimension: ChurnDimension,
    weight: number
  ): DimensionScore {
    const factors: ChurnFactor[] = [];
    let score = 0;

    switch (dimension) {
      case 'last_interaction':
        score = this.calculateLastInteractionScore(context, factors);
        break;
      case 'order_frequency':
        score = this.calculateOrderFrequencyScore(context, factors);
        break;
      case 'opportunity_conversion':
        score = this.calculateOpportunityConversionScore(context, factors);
        break;
      case 'contract_expiry':
        score = this.calculateContractExpiryScore(context, factors);
        break;
      case 'activity_level':
        score = this.calculateActivityLevelScore(context, factors);
        break;
    }

    return {
      dimension,
      score: Math.round(score),
      maxScore: 100,
      weight,
      factors,
    };
  }

  // 最近互动时间评分
  private calculateLastInteractionScore(context: CustomerChurnContext, factors: ChurnFactor[]): number {
    const lastInteractionDate = context.lastInteractionDate;
    
    if (!lastInteractionDate) {
      // 无互动记录，默认高分
      factors.push({
        name: '最近互动时间',
        dimension: 'last_interaction',
        value: 50,
        reason: '无互动记录',
        details: '缺少与客户的互动记录',
      });
      return 50;
    }

    const daysSinceInteraction = this.getDaysDifference(new Date(lastInteractionDate), new Date());
    let score = 0;

    // 按规则递减分数
    const rules = [...this.config.lastInteractionRules].sort((a, b) => a.daysThreshold - b.daysThreshold);
    
    for (const rule of rules) {
      if (daysSinceInteraction > rule.daysThreshold) {
        score = Math.max(score, rule.scorePenalty);
        factors.push({
          name: '最近互动时间',
          dimension: 'last_interaction',
          value: rule.scorePenalty,
          reason: rule.reason,
          details: `最后互动: ${daysSinceInteraction}天前`,
        });
      }
    }

    if (score === 0) {
      factors.push({
        name: '最近互动时间',
        dimension: 'last_interaction',
        value: 0,
        reason: '互动正常',
        details: `最后互动: ${daysSinceInteraction}天前`,
      });
    }

    return score;
  }

  // 订单频率评分
  private calculateOrderFrequencyScore(context: CustomerChurnContext, factors: ChurnFactor[]): number {
    const lastOrderDate = context.lastOrderDate;
    
    if (!lastOrderDate || context.totalOrders === 0) {
      // 无订单记录
      factors.push({
        name: '订单频率',
        dimension: 'order_frequency',
        value: 40,
        reason: '无订单记录或新客户',
        details: `历史订单数: ${context.totalOrders}`,
      });
      return 40;
    }

    const daysSinceOrder = this.getDaysDifference(new Date(lastOrderDate), new Date());
    let score = 0;

    const rules = [...this.config.orderFrequencyRules].sort((a, b) => a.daysThreshold - b.daysThreshold);
    
    for (const rule of rules) {
      if (daysSinceOrder > rule.daysThreshold) {
        score = Math.max(score, rule.scorePenalty);
        factors.push({
          name: '订单频率',
          dimension: 'order_frequency',
          value: rule.scorePenalty,
          reason: rule.reason,
          details: `最后订单: ${daysSinceOrder}天前`,
        });
      }
    }

    if (score === 0) {
      factors.push({
        name: '订单频率',
        dimension: 'order_frequency',
        value: 0,
        reason: '订单频率正常',
        details: `最后订单: ${daysSinceOrder}天前`,
      });
    }

    return score;
  }

  // 商机转化率评分
  private calculateOpportunityConversionScore(context: CustomerChurnContext, factors: ChurnFactor[]): number {
    const opportunities = context.opportunities;
    
    if (opportunities.length === 0) {
      // 无商机
      factors.push({
        name: '商机转化率',
        dimension: 'opportunity_conversion',
        value: 0,
        reason: '无商机记录',
        details: '当前没有进行中的商机',
      });
      return 0;
    }

    // 计算转化率 (closed_won / total)
    const closedWon = opportunities.filter(o => o.stage === 'closed_won').length;
    const conversionRate = opportunities.length > 0 ? (closedWon / opportunities.length) * 100 : 0;
    
    let score = 0;

    const rules = [...this.config.opportunityConversionRules].sort(
      (a, b) => a.conversionRateThreshold - b.conversionRateThreshold
    );
    
    for (const rule of rules) {
      if (conversionRate < rule.conversionRateThreshold) {
        score = Math.max(score, rule.scorePenalty);
        factors.push({
          name: '商机转化率',
          dimension: 'opportunity_conversion',
          value: rule.scorePenalty,
          reason: rule.reason,
          details: `转化率: ${conversionRate.toFixed(1)}% (${closedWon}/${opportunities.length})`,
        });
      }
    }

    if (score === 0) {
      factors.push({
        name: '商机转化率',
        dimension: 'opportunity_conversion',
        value: 0,
        reason: '商机转化正常',
        details: `转化率: ${conversionRate.toFixed(1)}% (${closedWon}/${opportunities.length})`,
      });
    }

    return score;
  }

  // 合同到期评分
  private calculateContractExpiryScore(context: CustomerChurnContext, factors: ChurnFactor[]): number {
    const contracts = context.contracts.filter(c => c.status === 'active');
    
    if (contracts.length === 0) {
      // 无有效合同
      factors.push({
        name: '合同到期',
        dimension: 'contract_expiry',
        value: 0,
        reason: '无有效合同',
        details: '客户当前没有生效的合同',
      });
      return 0;
    }

    // 检查最早到期的合同
    let minDaysToExpiry = Infinity;
    for (const contract of contracts) {
      const daysToExpiry = this.getDaysDifference(new Date(), new Date(contract.endDate));
      if (daysToExpiry < minDaysToExpiry) {
        minDaysToExpiry = daysToExpiry;
      }
    }

    let score = 0;

    const rules = [...this.config.contractExpiryRules].sort((a, b) => a.daysThreshold - b.daysThreshold);
    
    for (const rule of rules) {
      if (minDaysToExpiry <= rule.daysThreshold) {
        score = Math.max(score, rule.scorePenalty);
        factors.push({
          name: '合同到期',
          dimension: 'contract_expiry',
          value: rule.scorePenalty,
          reason: rule.reason,
          details: `最近合同到期: ${minDaysToExpiry}天后`,
        });
      }
    }

    if (score === 0) {
      factors.push({
        name: '合同到期',
        dimension: 'contract_expiry',
        value: 0,
        reason: '合同状态正常',
        details: `最近合同到期: ${minDaysToExpiry}天后`,
      });
    }

    return score;
  }

  // 客户活跃度评分
  private calculateActivityLevelScore(context: CustomerChurnContext, factors: ChurnFactor[]): number {
    const activities = context.activities;
    
    if (activities.length === 0) {
      // 无活动记录
      factors.push({
        name: '客户活跃度',
        dimension: 'activity_level',
        value: 40,
        reason: '无活动记录',
        details: '缺少客户活动历史',
      });
      return 40;
    }

    // 获取最近活动日期
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastActivityDate = sortedActivities[0].timestamp;
    const daysSinceActivity = this.getDaysDifference(new Date(lastActivityDate), new Date());
    
    let score = 0;

    const rules = [...this.config.activityLevelRules].sort((a, b) => a.daysThreshold - b.daysThreshold);
    
    for (const rule of rules) {
      if (daysSinceActivity > rule.daysThreshold) {
        score = Math.max(score, rule.scorePenalty);
        factors.push({
          name: '客户活跃度',
          dimension: 'activity_level',
          value: rule.scorePenalty,
          reason: rule.reason,
          details: `最后活动: ${daysSinceActivity}天前`,
        });
      }
    }

    if (score === 0) {
      factors.push({
        name: '客户活跃度',
        dimension: 'activity_level',
        value: 0,
        reason: '活跃度正常',
        details: `最后活动: ${daysSinceActivity}天前`,
      });
    }

    return score;
  }

  // 根据分数获取风险等级
  private getRiskLevel(score: number): ChurnRiskLevel {
    if (score >= this.config.highRiskThreshold) {
      return 'high';
    }
    if (score >= this.config.mediumRiskThreshold) {
      return 'medium';
    }
    return 'low';
  }

  // 生成预警
  private generateAlerts(
    customerId: string,
    customerName: string,
    riskScore: number,
    riskLevel: ChurnRiskLevel,
    factors: ChurnFactor[]
  ): ChurnAlert[] {
    const alerts: ChurnAlert[] = [];

    if (!this.config.enableAutoAlert) {
      return alerts;
    }

    // 高风险预警
    if (riskLevel === 'high' && this.config.alertOnHighRisk) {
      // 获取最严重的风险因素
      const topFactors = factors
        .filter(f => f.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 2);

      const factorReasons = topFactors.map(f => f.reason).join('、');

      alerts.push({
        id: `alert-${customerId}-high-${Date.now()}`,
        customerId,
        customerName,
        type: 'high_risk',
        title: `${customerName} 流失风险升高`,
        message: `客户流失风险评分为 ${riskScore} 分（${CHURN_RISK_CONFIG[riskLevel].label}），主要风险因素：${factorReasons || '综合因素'}。请尽快安排跟进。`,
        riskScore,
        riskLevel,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
      });
    }

    // 合同到期预警
    const contractFactor = factors.find(f => f.dimension === 'contract_expiry' && f.value > 0);
    if (contractFactor) {
      alerts.push({
        id: `alert-${customerId}-contract-${Date.now()}`,
        customerId,
        customerName,
        type: 'contract_expiring',
        title: `${customerName} 合同即将到期`,
        message: contractFactor.details || '客户合同即将到期或已过期，请及时处理续约事宜。',
        riskScore,
        riskLevel,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
      });
    }

    // 无活动预警
    const interactionFactor = factors.find(f => f.dimension === 'last_interaction' && f.value > 0);
    if (interactionFactor) {
      alerts.push({
        id: `alert-${customerId}-activity-${Date.now()}`,
        customerId,
        customerName,
        type: 'no_activity',
        title: `${customerName} 长时间无互动`,
        message: interactionFactor.details || '客户已超过90天无互动记录，建议主动联系。',
        riskScore,
        riskLevel,
        createdAt: new Date().toISOString(),
        isRead: false,
        isDismissed: false,
      });
    }

    return alerts;
  }

  // 计算天数差
  private getDaysDifference(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor((date2.getTime() - date1.getTime()) / oneDay);
  }

  // 获取当前配置
  getConfig(): ChurnPredictionConfig {
    return { ...this.config };
  }

  // 更新配置
  updateConfig(newConfig: Partial<ChurnPredictionConfig>): void {
    this.config = this.mergeConfig(newConfig);
  }
}

// ============ 辅助函数 ============

// 根据风险等级获取颜色类名
export function getRiskLevelColor(riskLevel: ChurnRiskLevel): string {
  return CHURN_RISK_CONFIG[riskLevel].color;
}

// 根据风险分数获取风险等级
export function getRiskLevelFromScore(score: number, config?: Partial<ChurnPredictionConfig>): ChurnRiskLevel {
  const highThreshold = config?.highRiskThreshold ?? 70;
  const mediumThreshold = config?.mediumRiskThreshold ?? 40;
  
  if (score >= highThreshold) return 'high';
  if (score >= mediumThreshold) return 'medium';
  return 'low';
}

// 格式化风险分数显示
export function formatRiskScore(score: number): string {
  return `${Math.round(score)}分`;
}

// 获取风险等级标签
export function getRiskLevelLabel(riskLevel: ChurnRiskLevel): string {
  return CHURN_RISK_CONFIG[riskLevel].label;
}

// 导出默认引擎实例
export const defaultChurnEngine = new ChurnPredictionEngine();
