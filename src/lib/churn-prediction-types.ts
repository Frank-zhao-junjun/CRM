// 流失风险预测模块 - 类型定义

import { CustomerStatus } from './crm-types';

// ============ 流失风险等级 ============
export type ChurnRiskLevel = 'high' | 'medium' | 'low';

// 风险等级配置
export const CHURN_RISK_CONFIG: Record<ChurnRiskLevel, {
  label: string;
  labelEn: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  priority: number;
  description: string;
}> = {
  high: {
    label: '高风险',
    labelEn: 'High Risk',
    color: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-600 dark:text-red-400',
    priority: 1,
    description: '客户流失风险极高，需要立即跟进',
  },
  medium: {
    label: '中风险',
    labelEn: 'Medium Risk',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    priority: 2,
    description: '客户存在流失风险，建议安排跟进',
  },
  low: {
    label: '低风险',
    labelEn: 'Low Risk',
    color: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-600 dark:text-green-400',
    priority: 3,
    description: '客户状态稳定，保持正常维护',
  },
};

// ============ 流失风险评估维度 ============
export type ChurnDimension =
  | 'last_interaction'    // 最近互动时间
  | 'order_frequency'      // 订单频率
  | 'opportunity_conversion' // 商机转化率
  | 'contract_expiry'      // 合同到期
  | 'activity_level';      // 客户活跃度

// 维度配置
export interface DimensionConfig {
  dimension: ChurnDimension;
  label: string;
  description: string;
  maxScore: number;
  weight: number;
  isActive: boolean;
}

export const DEFAULT_DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    dimension: 'last_interaction',
    label: '最近互动时间',
    description: '根据与客户的最后互动时间评估',
    maxScore: 100,
    weight: 25,
    isActive: true,
  },
  {
    dimension: 'order_frequency',
    label: '订单频率',
    description: '根据最近订单时间评估',
    maxScore: 100,
    weight: 20,
    isActive: true,
  },
  {
    dimension: 'opportunity_conversion',
    label: '商机转化率',
    description: '根据商机转化情况评估',
    maxScore: 100,
    weight: 15,
    isActive: true,
  },
  {
    dimension: 'contract_expiry',
    label: '合同到期',
    description: '根据合同到期时间评估',
    maxScore: 100,
    weight: 20,
    isActive: true,
  },
  {
    dimension: 'activity_level',
    label: '客户活跃度',
    description: '根据客户活跃情况评估',
    maxScore: 100,
    weight: 20,
    isActive: true,
  },
];

// ============ 风险因素 ============
export interface ChurnFactor {
  name: string;
  dimension: ChurnDimension;
  value: number;
  reason: string;
  details?: string;
}

// ============ 维度评分结果 ============
export interface DimensionScore {
  dimension: ChurnDimension;
  score: number;
  maxScore: number;
  weight: number;
  factors: ChurnFactor[];
}

// ============ 综合风险结果 ============
export interface ChurnRiskResult {
  customerId: string;
  riskScore: number;           // 0-100 综合风险分
  riskLevel: ChurnRiskLevel;   // 风险等级
  dimensions: DimensionScore[];
  factors: ChurnFactor[];
  alerts: ChurnAlert[];
  lastCalculatedAt: string;
}

// ============ 流失预警 ============
export interface ChurnAlert {
  id: string;
  customerId: string;
  customerName: string;
  type: 'risk_increase' | 'high_risk' | 'contract_expiring' | 'no_activity';
  title: string;
  message: string;
  riskScore: number;
  riskLevel: ChurnRiskLevel;
  createdAt: string;
  isRead: boolean;
  isDismissed: boolean;
}

// ============ 流失预警配置 ============
export interface ChurnPredictionConfig {
  // 阈值配置
  highRiskThreshold: number;  // 高风险阈值，默认70
  mediumRiskThreshold: number; // 中风险阈值，默认40
  
  // 维度权重
  dimensionConfigs: DimensionConfig[];
  
  // 维度规则配置
  lastInteractionRules: InteractionRule[];
  orderFrequencyRules: OrderFrequencyRule[];
  opportunityConversionRules: ConversionRule[];
  contractExpiryRules: ContractExpiryRule[];
  activityLevelRules: ActivityRule[];
  
  // 预警规则
  enableAutoAlert: boolean;
  alertOnHighRisk: boolean;
  alertOnRiskIncrease: boolean;
  riskIncreaseThreshold: number;  // 风险上升多少分触发预警
}

// 互动时间规则
export interface InteractionRule {
  daysThreshold: number;
  scorePenalty: number;
  reason: string;
}

// 订单频率规则
export interface OrderFrequencyRule {
  daysThreshold: number;
  scorePenalty: number;
  reason: string;
}

// 商机转化规则
export interface ConversionRule {
  conversionRateThreshold: number;
  scorePenalty: number;
  reason: string;
}

// 合同到期规则
export interface ContractExpiryRule {
  daysThreshold: number;
  scorePenalty: number;
  reason: string;
}

// 活跃度规则
export interface ActivityRule {
  daysThreshold: number;
  scorePenalty: number;
  reason: string;
}

// 默认配置
export const DEFAULT_CHURN_CONFIG: ChurnPredictionConfig = {
  highRiskThreshold: 70,
  mediumRiskThreshold: 40,
  dimensionConfigs: DEFAULT_DIMENSION_CONFIGS,
  
  // 最近互动时间规则：超过N天无互动扣分
  lastInteractionRules: [
    { daysThreshold: 30, scorePenalty: 20, reason: '超过30天无互动' },
    { daysThreshold: 60, scorePenalty: 40, reason: '超过60天无互动' },
    { daysThreshold: 90, scorePenalty: 60, reason: '超过90天无互动' },
  ],
  
  // 订单频率规则：超过N天无订单扣分
  orderFrequencyRules: [
    { daysThreshold: 180, scorePenalty: 30, reason: '超过180天无订单' },
    { daysThreshold: 365, scorePenalty: 50, reason: '超过365天无订单' },
  ],
  
  // 商机转化规则：转化率低于N%扣分
  opportunityConversionRules: [
    { conversionRateThreshold: 10, scorePenalty: 20, reason: '商机转化率低于10%' },
    { conversionRateThreshold: 5, scorePenalty: 40, reason: '商机转化率低于5%' },
  ],
  
  // 合同到期规则：N天内到期或已过期
  contractExpiryRules: [
    { daysThreshold: 30, scorePenalty: 30, reason: '合同30天内到期' },
    { daysThreshold: 0, scorePenalty: 50, reason: '合同已过期' },
  ],
  
  // 活跃度规则：超过N天无活动
  activityLevelRules: [
    { daysThreshold: 90, scorePenalty: 20, reason: '超过90天无活动' },
    { daysThreshold: 180, scorePenalty: 40, reason: '超过180天无活动' },
  ],
  
  enableAutoAlert: true,
  alertOnHighRisk: true,
  alertOnRiskIncrease: true,
  riskIncreaseThreshold: 15,
};

// ============ 客户流失数据上下文 ============
export interface CustomerChurnContext {
  customer: {
    id: string;
    name: string;
    status: CustomerStatus;
    createdAt: string;
    updatedAt: string;
  };
  lastInteractionDate?: string;
  lastOrderDate?: string;
  totalOrders: number;
  opportunities: Array<{
    id: string;
    stage: string;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    status: string;
    endDate: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    timestamp: string;
  }>;
  followUps: Array<{
    id: string;
    completedAt?: string;
    scheduledAt?: string;
  }>;
}

// ============ API 类型 ============
export interface ChurnRiskSummary {
  customerId: string;
  customerName: string;
  riskScore: number;
  riskLevel: ChurnRiskLevel;
  topFactors: ChurnFactor[];
  lastCalculatedAt: string;
}

export interface ChurnAlertListParams {
  riskLevel?: ChurnRiskLevel;
  page?: number;
  pageSize?: number;
}

export interface ChurnAlertListResponse {
  alerts: ChurnAlert[];
  total: number;
  page: number;
  pageSize: number;
}
