// AI 线索评分引擎 - 核心算法

import { 
  ScoredLead, 
  LeadScoreResult, 
  DimensionScore, 
  ScoreFactor, 
  ScoreLevel,
  LeadScoringConfig,
  DEFAULT_SCORING_CONFIG,
  ScoreDimension
} from './lead-scoring-types';
import { SalesLead, Customer, Contact, Activity, FollowUp } from './crm-types';

// ============ 评分计算引擎 ============
export class LeadScoringEngine {
  private config: LeadScoringConfig;

  constructor(config?: Partial<LeadScoringConfig>) {
    this.config = this.mergeConfig(config);
  }

  // 合并配置
  private mergeConfig(partial?: Partial<LeadScoringConfig>): LeadScoringConfig {
    return {
      ...DEFAULT_SCORING_CONFIG,
      ...partial,
      weights: partial?.weights || DEFAULT_SCORING_CONFIG.weights,
      companySizeRules: partial?.companySizeRules || DEFAULT_SCORING_CONFIG.companySizeRules,
      industryRules: partial?.industryRules || DEFAULT_SCORING_CONFIG.industryRules,
      sourceRules: partial?.sourceRules || DEFAULT_SCORING_CONFIG.sourceRules,
    } as LeadScoringConfig;
  }

  // 计算线索评分
  calculateScore(lead: SalesLead, context?: {
    customer?: Customer;
    contacts?: Contact[];
    activities?: Activity[];
    followUps?: FollowUp[];
  }): LeadScoreResult {
    const dimensions: DimensionScore[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // 获取活跃权重
    const activeWeights = this.config.weights.filter(w => w.isActive);
    
    for (const weightConfig of activeWeights) {
      const dimensionScore = this.calculateDimensionScore(
        lead, 
        weightConfig.dimension, 
        weightConfig.weight,
        context
      );
      dimensions.push(dimensionScore);
      
      totalScore += dimensionScore.score * (dimensionScore.weight / 100);
      totalWeight += dimensionScore.weight;
    }

    // 归一化总分
    const finalScore = totalWeight > 0 
      ? Math.round(totalScore / totalWeight * 100)
      : 0;

    // 确定评分级别
    const level = this.getScoreLevel(finalScore);

    return {
      leadId: lead.id,
      totalScore: Math.min(100, Math.max(0, finalScore)),
      level,
      dimensions,
      strategy: this.getStrategy(level),
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  // 计算单个维度分数
  private calculateDimensionScore(
    lead: SalesLead,
    dimension: ScoreDimension,
    weight: number,
    context?: {
      customer?: Customer;
      contacts?: Contact[];
      activities?: Activity[];
      followUps?: FollowUp[];
    }
  ): DimensionScore {
    const factors: ScoreFactor[] = [];
    let score = 0;

    switch (dimension) {
      case 'company_size':
        score = this.scoreCompanySize(lead, context, factors);
        break;
      case 'industry_match':
        score = this.scoreIndustryMatch(lead, context, factors);
        break;
      case 'source_quality':
        score = this.scoreSourceQuality(lead, factors);
        break;
      case 'engagement_level':
        score = this.scoreEngagementLevel(lead, context, factors);
        break;
      case 'estimated_value':
        score = this.scoreEstimatedValue(lead, factors);
        break;
      case 'contact_complete':
        score = this.scoreContactComplete(lead, context, factors);
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

  // 公司规模评分
  private scoreCompanySize(
    lead: SalesLead, 
    context: any, 
    factors: ScoreFactor[]
  ): number {
    const customer = context?.customer;
    if (!customer) {
      factors.push({
        name: '公司规模',
        value: 50,
        reason: '无客户信息，使用默认值',
      });
      return 50;
    }

    // 从客户信息中获取规模（如果有员工数字段）
    const employees = (customer as any).employees || 500;
    const rule = this.config.companySizeRules.find(r => {
      if (r.minEmployees && r.maxEmployees) {
        return employees >= r.minEmployees && employees <= r.maxEmployees;
      }
      if (r.minEmployees && !r.maxEmployees) {
        return employees >= r.minEmployees;
      }
      if (!r.minEmployees && r.maxEmployees) {
        return employees <= r.maxEmployees;
      }
      return false;
    });

    const score = rule?.score || 50;
    factors.push({
      name: '公司规模',
      value: score,
      reason: rule?.label || '未知规模',
    });

    return score;
  }

  // 行业匹配度评分
  private scoreIndustryMatch(
    lead: SalesLead, 
    context: any, 
    factors: ScoreFactor[]
  ): number {
    const customer = context?.customer;
    if (!customer || !customer.industry) {
      factors.push({
        name: '行业匹配',
        value: 50,
        reason: '无行业信息，使用默认值',
      });
      return 50;
    }

    const rule = this.config.industryRules.find(
      r => r.industry.toLowerCase() === customer.industry.toLowerCase()
    );

    const score = rule?.score || 50;
    factors.push({
      name: '行业匹配',
      value: score,
      reason: rule?.isTargetIndustry ? '目标行业' : '非目标行业',
    });

    return score;
  }

  // 来源渠道质量评分
  private scoreSourceQuality(lead: SalesLead, factors: ScoreFactor[]): number {
    const rule = this.config.sourceRules.find(r => r.source === lead.source);
    const score = rule?.score || 50;
    
    factors.push({
      name: '来源渠道',
      value: score,
      reason: rule?.quality === 'high' ? '高质量来源' : 
             rule?.quality === 'medium' ? '中等质量来源' : '低质量来源',
    });

    return score;
  }

  // 互动频率评分
  private scoreEngagementLevel(
    lead: SalesLead, 
    context: any, 
    factors: ScoreFactor[]
  ): number {
    const activities = context?.activities || [];
    const followUps = context?.followUps || [];
    
    // 计算最近30天内的互动次数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivities = activities.filter((a: Activity) => 
      a.entityType === 'lead' && 
      a.entityId === lead.id &&
      new Date(a.timestamp) >= thirtyDaysAgo
    );
    
    const recentFollowUps = followUps.filter((f: FollowUp) => 
      f.entityType === 'lead' && 
      f.entityId === lead.id &&
      new Date(f.createdAt) >= thirtyDaysAgo
    );
    
    const totalEngagements = recentActivities.length + recentFollowUps.length;
    
    // 评分规则：0次=0分，1-2次=40分，3-5次=70分，6+次=100分
    let score = 0;
    let reason = '无互动记录';
    
    if (totalEngagements === 0) {
      score = 20; // 新线索可能有少量互动
    } else if (totalEngagements <= 2) {
      score = 50;
      reason = '少量互动';
    } else if (totalEngagements <= 5) {
      score = 75;
      reason = '中等互动频率';
    } else {
      score = 100;
      reason = '高互动频率';
    }

    factors.push({
      name: '互动频率',
      value: score,
      reason: `${reason} (${totalEngagements}次/30天)`,
    });

    return score;
  }

  // 预估价值评分
  private scoreEstimatedValue(lead: SalesLead, factors: ScoreFactor[]): number {
    // 评分规则：根据预估金额分级
    // <1万=20分，1-10万=40分，10-50万=70分，50万+=100分
    let score = 0;
    let level = '';

    if (lead.estimatedValue < 10000) {
      score = 20;
      level = '小额';
    } else if (lead.estimatedValue < 100000) {
      score = 50;
      level = '中小额';
    } else if (lead.estimatedValue < 500000) {
      score = 75;
      level = '中等额';
    } else {
      score = 100;
      level = '大额';
    }

    factors.push({
      name: '预估价值',
      value: score,
      reason: `${level} (¥${lead.estimatedValue.toLocaleString()})`,
    });

    return score;
  }

  // 联系信息完整度评分
  private scoreContactComplete(
    lead: SalesLead, 
    context: any, 
    factors: ScoreFactor[]
  ): number {
    let completeness = 0;
    const reasons: string[] = [];

    // 检查必要字段
    if (lead.contactName) {
      completeness += 25;
      reasons.push('联系人');
    }
    
    if (lead.contactId && context?.contacts) {
      const contact = context.contacts.find((c: Contact) => c.id === lead.contactId);
      if (contact?.email) {
        completeness += 25;
        reasons.push('邮箱');
      }
      if (contact?.phone) {
        completeness += 25;
        reasons.push('电话');
      }
    } else {
      // 如果没有联系人ID，尝试从客户获取
      if (context?.customer?.email) {
        completeness += 25;
        reasons.push('邮箱');
      }
      if (context?.customer?.phone) {
        completeness += 25;
        reasons.push('电话');
      }
    }

    // 检查公司网站
    if (context?.customer?.website) {
      completeness += 25;
      reasons.push('网站');
    }

    const score = Math.min(100, completeness);
    factors.push({
      name: '信息完整度',
      value: score,
      reason: reasons.length > 0 ? reasons.join(', ') : '信息不完整',
    });

    return score;
  }

  // 获取评分级别
  private getScoreLevel(score: number): ScoreLevel {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }

  // 获取跟进策略
  private getStrategy(level: ScoreLevel): string {
    switch (level) {
      case 'hot':
        return '立即跟进 - 优先安排电话或面谈';
      case 'warm':
        return '培育计划 - 定期发送资料，保持联系';
      case 'cold':
        return '暂缓跟进 - 低优先级，可定期维护';
    }
  }

  // 批量计算评分
  calculateBatchScores(
    leads: SalesLead[],
    contextMap: Map<string, {
      customer?: Customer;
      contacts?: Contact[];
      activities?: Activity[];
      followUps?: FollowUp[];
    }>
  ): LeadScoreResult[] {
    return leads.map(lead => 
      this.calculateScore(lead, contextMap.get(lead.id))
    );
  }
}

// ============ 评分辅助函数 ============

// 获取评分级别对应的颜色
export function getScoreColorClass(score: number): string {
  if (score >= 70) return 'text-red-600 dark:text-red-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-600 dark:text-gray-400';
}

// 获取评分徽章背景色
export function getScoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
  return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30';
}

// 获取评分对应的建议操作
export function getRecommendedAction(score: number): {
  action: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
} {
  if (score >= 70) {
    return {
      action: '立即联系',
      priority: 'high',
      color: 'text-red-600',
    };
  }
  if (score >= 40) {
    return {
      action: '培育跟进',
      priority: 'medium',
      color: 'text-yellow-600',
    };
  }
  return {
    action: '定期维护',
    priority: 'low',
    color: 'text-gray-600',
  };
}

// 计算分数排名
export function calculateScoreRank(leads: ScoredLead[]): ScoredLead[] {
  return [...leads]
    .filter(l => l.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

// 获取分数分布统计
export function getScoreDistribution(leads: ScoredLead[]): {
  hot: number;
  warm: number;
  cold: number;
  average: number;
  total: number;
} {
  const scoredLeads = leads.filter(l => l.score !== undefined);
  
  if (scoredLeads.length === 0) {
    return { hot: 0, warm: 0, cold: 0, average: 0, total: 0 };
  }

  const stats = {
    hot: scoredLeads.filter(l => l.scoreLevel === 'hot').length,
    warm: scoredLeads.filter(l => l.scoreLevel === 'warm').length,
    cold: scoredLeads.filter(l => l.scoreLevel === 'cold').length,
    average: Math.round(
      scoredLeads.reduce((sum, l) => sum + (l.score || 0), 0) / scoredLeads.length
    ),
    total: scoredLeads.length,
  };

  return stats;
}

// 导出单例实例
export const defaultScoringEngine = new LeadScoringEngine();
