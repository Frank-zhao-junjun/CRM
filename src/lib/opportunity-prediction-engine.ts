// AI 商机预测引擎 - 核心算法

import { 
  PredictionResult,
  PredictionDimension,
  PredictionLevel,
  PredictionWeight,
  DimensionBreakdown,
  PredictionFactor,
  PredictionRecommendation,
  StageProbabilityConfig,
  PredictionConfig,
  DEFAULT_PREDICTION_CONFIG,
  getPredictionLevel,
  DEFAULT_STAGE_PROBABILITIES
} from './opportunity-prediction-types';
import { Opportunity, OpportunityStage, Customer, Activity, FollowUp } from './crm-types';

// ============ 商机预测引擎 ============
export class OpportunityPredictionEngine {
  private config: PredictionConfig;

  constructor(config?: Partial<PredictionConfig>) {
    this.config = this.mergeConfig(config);
  }

  // 合并配置
  private mergeConfig(partial?: Partial<PredictionConfig>): PredictionConfig {
    return {
      ...DEFAULT_PREDICTION_CONFIG,
      ...partial,
      weights: partial?.weights || DEFAULT_PREDICTION_CONFIG.weights,
      stageProbabilities: partial?.stageProbabilities || DEFAULT_PREDICTION_CONFIG.stageProbabilities,
    } as PredictionConfig;
  }

  // 计算商机预测
  calculatePrediction(
    opportunity: Opportunity,
    context?: {
      customer?: Customer;
      activities?: Activity[];
      followUps?: FollowUp[];
      wonOpportunities?: Opportunity[];
      lostOpportunities?: Opportunity[];
    }
  ): PredictionResult {
    const dimensions: DimensionBreakdown[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // 获取活跃权重
    const activeWeights = this.config.weights.filter(w => w.isActive);
    
    for (const weightConfig of activeWeights) {
      const dimensionScore = this.calculateDimensionScore(
        opportunity,
        weightConfig.dimension,
        weightConfig.weight,
        context
      );
      dimensions.push(dimensionScore);
      
      totalScore += dimensionScore.score * (dimensionScore.weight / 100);
      totalWeight += dimensionScore.weight;
    }

    // 归一化总分
    const finalProbability = totalWeight > 0 
      ? Math.round(totalScore / totalWeight)
      : 0;

    // 确定预测级别
    const level = getPredictionLevel(finalProbability);

    return {
      opportunityId: opportunity.id,
      probability: Math.min(100, Math.max(0, finalProbability)),
      level,
      breakdown: dimensions,
      recommendation: this.generateRecommendation(opportunity, finalProbability, level, dimensions, context),
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  // 计算单个维度分数
  private calculateDimensionScore(
    opportunity: Opportunity,
    dimension: PredictionDimension,
    weight: number,
    context?: {
      customer?: Customer;
      activities?: Activity[];
      followUps?: FollowUp[];
      wonOpportunities?: Opportunity[];
      lostOpportunities?: Opportunity[];
    }
  ): DimensionBreakdown {
    const factors: PredictionFactor[] = [];
    let score = 0;

    switch (dimension) {
      case 'stage':
        score = this.scoreStage(opportunity, factors);
        break;
      case 'amount':
        score = this.scoreAmount(opportunity, factors);
        break;
      case 'customer_history':
        score = this.scoreCustomerHistory(opportunity, context, factors);
        break;
      case 'competition':
        score = this.scoreCompetition(opportunity, context, factors);
        break;
      case 'engagement':
        score = this.scoreEngagement(opportunity, context, factors);
        break;
      case 'timeline':
        score = this.scoreTimeline(opportunity, factors);
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

  // 阶段评分：根据商机阶段计算基础概率
  private scoreStage(opportunity: Opportunity, factors: PredictionFactor[]): number {
    const stageConfig = this.config.stageProbabilities.find(s => s.stage === opportunity.stage);
    const baseScore = stageConfig?.baseProbability || 50;
    const label = stageConfig?.label || '未知阶段';

    factors.push({
      name: '阶段基准概率',
      value: baseScore,
      reason: `${label}: ${baseScore}%`,
    });

    return baseScore;
  }

  // 金额评分：大额降低概率，小额提高概率
  private scoreAmount(opportunity: Opportunity, factors: PredictionFactor[]): number {
    const amount = opportunity.value;
    let score = 0;
    let level = '';

    // 金额分级评分规则：
    // <5万 = 80分（小额易成交）
    // 5-20万 = 70分
    // 20-50万 = 60分
    // 50-100万 = 50分
    // 100-500万 = 40分
    // >500万 = 30分（大额决策周期长）

    if (amount < 50000) {
      score = 80;
      level = '小额';
    } else if (amount < 200000) {
      score = 70;
      level = '中小额';
    } else if (amount < 500000) {
      score = 60;
      level = '中等额';
    } else if (amount < 1000000) {
      score = 50;
      level = '中大额';
    } else if (amount < 5000000) {
      score = 40;
      level = '大额';
    } else {
      score = 30;
      level = '超大额';
    }

    factors.push({
      name: '金额评分',
      value: score,
      reason: `${level} (¥${amount.toLocaleString()})`,
    });

    return score;
  }

  // 客户历史评分：有成交历史提高概率
  private scoreCustomerHistory(
    opportunity: Opportunity,
    context: any,
    factors: PredictionFactor[]
  ): number {
    const wonOpps = context?.wonOpportunities || [];
    const lostOpps = context?.lostOpportunities || [];
    
    // 检查该客户是否有成功成交的记录
    const customerWonCount = wonOpps.filter(
      (o: Opportunity) => o.customerId === opportunity.customerId
    ).length;

    // 检查是否有失败记录
    const customerLostCount = lostOpps.filter(
      (o: Opportunity) => o.customerId === opportunity.customerId
    ).length;

    let score = 50; // 默认中等

    if (customerWonCount > 0) {
      // 有成功记录，提高概率
      score = Math.min(100, 70 + customerWonCount * 10);
      factors.push({
        name: '客户历史',
        value: score,
        reason: `历史成交 ${customerWonCount} 次，信任度高`,
      });
    } else if (customerLostCount > 0) {
      // 有失败记录，降低概率
      score = Math.max(20, 50 - customerLostCount * 15);
      factors.push({
        name: '客户历史',
        value: score,
        reason: `历史失败 ${customerLostCount} 次，需要谨慎`,
      });
    } else {
      factors.push({
        name: '客户历史',
        value: score,
        reason: '新客户，无历史记录',
      });
    }

    return score;
  }

  // 竞争状况评分
  private scoreCompetition(
    opportunity: Opportunity,
    context: any,
    factors: PredictionFactor[]
  ): number {
    // 从商机备注或字段中获取竞争信息
    const notes = opportunity.notes || '';
    
    let score = 50; // 默认中等
    let competitionLevel = '未知';

    // 检查备注中是否提及竞争对手
    if (notes.includes('竞争') || notes.includes('竞品') || notes.includes('招标')) {
      if (notes.includes('多家') || notes.includes('激烈')) {
        score = 30;
        competitionLevel = '激烈';
      } else if (notes.includes('有竞争') || notes.includes('竞争对手')) {
        score = 40;
        competitionLevel = '中等';
      } else {
        score = 45;
        competitionLevel = '轻微';
      }
    } else {
      // 没有竞争信息，假设无竞争
      score = 70;
      competitionLevel = '无明显竞争';
    }

    factors.push({
      name: '竞争状况',
      value: score,
      reason: `竞争程度: ${competitionLevel}`,
    });

    return score;
  }

  // 互动频率评分：最近30天有互动提高概率
  private scoreEngagement(
    opportunity: Opportunity,
    context: any,
    factors: PredictionFactor[]
  ): number {
    const activities = context?.activities || [];
    const followUps = context?.followUps || [];
    
    // 计算最近30天内的互动次数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivities = activities.filter((a: Activity) => 
      a.entityType === 'opportunity' && 
      a.entityId === opportunity.id &&
      new Date(a.timestamp) >= thirtyDaysAgo
    );
    
    const recentFollowUps = followUps.filter((f: FollowUp) => 
      f.entityType === 'opportunity' && 
      f.entityId === opportunity.id &&
      new Date(f.createdAt) >= thirtyDaysAgo
    );
    
    const totalEngagements = recentActivities.length + recentFollowUps.length;
    
    // 评分规则：0次=20分，1-2次=40分，3-5次=60分，6-10次=80分，10+次=100分
    let score = 0;
    let level = '';

    if (totalEngagements === 0) {
      score = 20;
      level = '无互动';
    } else if (totalEngagements <= 2) {
      score = 40;
      level = '少量互动';
    } else if (totalEngagements <= 5) {
      score = 60;
      level = '中等互动';
    } else if (totalEngagements <= 10) {
      score = 80;
      level = '频繁互动';
    } else {
      score = 100;
      level = '高度活跃';
    }

    factors.push({
      name: '互动频率',
      value: score,
      reason: `${level} (${totalEngagements}次/30天)`,
    });

    return score;
  }

  // 时间线评分：预计成交时间越近概率越高
  private scoreTimeline(opportunity: Opportunity, factors: PredictionFactor[]): number {
    const expectedCloseDate = opportunity.expectedCloseDate;
    
    if (!expectedCloseDate) {
      factors.push({
        name: '时间线',
        value: 50,
        reason: '未设置预计成交日期',
      });
      return 50;
    }

    const today = new Date();
    const closeDate = new Date(expectedCloseDate);
    const daysUntilClose = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let score = 0;
    let level = '';

    // 评分规则：
    // 已过期 = 30分（需要重新评估）
    // 0-30天 = 90分（即将成交）
    // 31-60天 = 70分
    // 61-90天 = 60分
    // 91-180天 = 50分
    // >180天 = 40分

    if (daysUntilClose < 0) {
      score = 30;
      level = '已过期';
    } else if (daysUntilClose <= 30) {
      score = 90;
      level = '近期成交';
    } else if (daysUntilClose <= 60) {
      score = 70;
      level = '短期';
    } else if (daysUntilClose <= 90) {
      score = 60;
      level = '中期';
    } else if (daysUntilClose <= 180) {
      score = 50;
      level = '长期';
    } else {
      score = 40;
      level = '远期';
    }

    factors.push({
      name: '时间线',
      value: score,
      reason: `${level} (${daysUntilClose < 0 ? '已过' : '还有'}${Math.abs(daysUntilClose)}天)`,
    });

    return score;
  }

  // 生成推荐策略
  private generateRecommendation(
    opportunity: Opportunity,
    probability: number,
    level: PredictionLevel,
    breakdown: DimensionBreakdown[],
    context?: any
  ): PredictionRecommendation {
    const reasons: string[] = [];
    const tips: string[] = [];
    let action = '';
    let priority: 'urgent' | 'normal' | 'low' = 'normal';

    // 分析低分维度
    const lowScoreDimensions = breakdown.filter(d => d.score < 50);
    const highScoreDimensions = breakdown.filter(d => d.score >= 70);

    // 根据概率级别生成建议
    if (probability >= 70) {
      // 高概率商机
      action = '重点跟进 - 建议尽快推进';
      priority = 'urgent';
      
      reasons.push(`商机处于${breakdown.find(d => d.dimension === 'stage')?.factors[0]?.reason || '关键'}阶段`);
      
      if (highScoreDimensions.length > 0) {
        highScoreDimensions.forEach(d => {
          const factor = d.factors[0];
          if (factor) reasons.push(`${factor.reason}，是加分项`);
        });
      }

      tips.push('建议安排高层会面加速决策');
      tips.push('准备好合同和报价方案');
      tips.push('保持密切沟通，防止竞争对手介入');
      
    } else if (probability >= 40) {
      // 中概率商机
      action = '培育跟进 - 持续推动';
      priority = 'normal';

      reasons.push('商机有潜力但需要进一步推进');
      
      if (lowScoreDimensions.length > 0) {
        lowScoreDimensions.forEach(d => {
          reasons.push(`${d.dimension}维度得分偏低(${d.score}分)`);
        });
      }

      tips.push('增加客户互动频率');
      tips.push('深入了解客户需求和痛点');
      tips.push('解决客户顾虑');

    } else {
      // 低概率商机
      action = '暂缓跟进 - 低优先级维护';
      priority = 'low';

      reasons.push('商机成交可能性较低');
      
      if (lowScoreDimensions.length > 0) {
        lowScoreDimensions.slice(0, 3).forEach(d => {
          reasons.push(`${d.dimension}维度得分低(${d.score}分)`);
        });
      }

      tips.push('定期维护即可');
      tips.push('如有资源可尝试激活');
      tips.push('记录关键信息以便后续参考');
    }

    // 添加维度相关的特定建议
    breakdown.forEach(d => {
      if (d.dimension === 'engagement' && d.score < 50) {
        tips.push('建议增加跟进频次，如每周至少一次互动');
      }
      if (d.dimension === 'competition' && d.score < 40) {
        tips.push('关注竞争对手动向，准备差异化方案');
      }
    });

    return {
      action,
      priority,
      reasons,
      tips,
    };
  }

  // 批量计算预测
  calculateBatchPredictions(
    opportunities: Opportunity[],
    contextMap: Map<string, {
      customer?: Customer;
      activities?: Activity[];
      followUps?: FollowUp[];
      wonOpportunities?: Opportunity[];
      lostOpportunities?: Opportunity[];
    }>
  ): PredictionResult[] {
    return opportunities.map(opp => 
      this.calculatePrediction(opp, contextMap.get(opp.id))
    );
  }

  // 获取配置
  getConfig(): PredictionConfig {
    return this.config;
  }

  // 更新配置
  updateConfig(newConfig: Partial<PredictionConfig>): void {
    this.config = this.mergeConfig(newConfig);
  }
}

// ============ 预测辅助函数 ============

// 计算加权管道预测
export function calculateWeightedPipeline(
  opportunities: Array<{ value: number; probability: number }>
): {
  totalValue: number;
  weightedValue: number;
  bestCase: number;
  expectedValue: number;
} {
  const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);
  const weightedValue = opportunities.reduce(
    (sum, o) => sum + (o.value * o.probability / 100), 
    0
  );
  
  // 最佳情况：所有高概率商机都成交
  const bestCase = opportunities
    .filter(o => o.probability >= 70)
    .reduce((sum, o) => sum + o.value, 0);

  // 期望值 = 加权预测
  const expectedValue = weightedValue;

  return {
    totalValue,
    weightedValue,
    bestCase,
    expectedValue,
  };
}

// 统计预测分布
export function calculatePredictionDistribution(
  probabilities: number[]
): {
  high: number;
  medium: number;
  low: number;
  average: number;
  total: number;
} {
  const high = probabilities.filter(p => p >= 70).length;
  const medium = probabilities.filter(p => p >= 40 && p < 70).length;
  const low = probabilities.filter(p => p < 40).length;
  const average = probabilities.length > 0 
    ? Math.round(probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length)
    : 0;

  return {
    high,
    medium,
    low,
    average,
    total: probabilities.length,
  };
}
