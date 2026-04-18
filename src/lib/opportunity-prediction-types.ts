// AI 商机预测模块 - 类型定义

import { OpportunityStage } from './crm-types';

// ============ 预测维度类型 ============
export type PredictionDimension = 
  | 'stage'              // 商机阶段
  | 'amount'             // 金额大小
  | 'customer_history'   // 客户历史
  | 'competition'        // 竞争状况
  | 'engagement'         // 互动频率
  | 'timeline';          // 时间线

// 预测级别
export type PredictionLevel = 'high' | 'medium' | 'low';

// 预测级别配置
export const PREDICTION_LEVEL_CONFIG: Record<PredictionLevel, { 
  label: string; 
  color: string; 
  bgClass: string;
  borderClass: string;
  probabilityRange: string;
  strategy: string;
  priority: number;
}> = {
  high: {
    label: '高概率',
    color: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    probabilityRange: '70%-100%',
    strategy: '重点跟进',
    priority: 1,
  },
  medium: {
    label: '中概率',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    probabilityRange: '40%-69%',
    strategy: '培育跟进',
    priority: 2,
  },
  low: {
    label: '低概率',
    color: 'text-gray-600 dark:text-gray-400',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/30',
    probabilityRange: '0%-39%',
    strategy: '暂缓跟进',
    priority: 3,
  },
};

// ============ 预测权重配置 ============
export interface PredictionWeight {
  dimension: PredictionDimension;
  weight: number; // 权重百分比 (0-100)
  isActive: boolean;
}

export const DEFAULT_PREDICTION_WEIGHTS: PredictionWeight[] = [
  { dimension: 'stage', weight: 30, isActive: true },
  { dimension: 'amount', weight: 15, isActive: true },
  { dimension: 'customer_history', weight: 20, isActive: true },
  { dimension: 'competition', weight: 15, isActive: true },
  { dimension: 'engagement', weight: 10, isActive: true },
  { dimension: 'timeline', weight: 10, isActive: true },
];

// ============ 维度配置 ============
export interface DimensionConfig {
  dimension: PredictionDimension;
  label: string;
  description: string;
  maxScore: number;
}

export const DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    dimension: 'stage',
    label: '商机阶段',
    description: '根据商机所处阶段评估',
    maxScore: 100,
  },
  {
    dimension: 'amount',
    label: '金额大小',
    description: '根据商机金额评估成交可能性',
    maxScore: 100,
  },
  {
    dimension: 'customer_history',
    label: '客户历史',
    description: '客户历史成交记录',
    maxScore: 100,
  },
  {
    dimension: 'competition',
    label: '竞争状况',
    description: '竞争对手情况',
    maxScore: 100,
  },
  {
    dimension: 'engagement',
    label: '互动频率',
    description: '最近30天内的互动次数',
    maxScore: 100,
  },
  {
    dimension: 'timeline',
    label: '时间线',
    description: '预计成交时间',
    maxScore: 100,
  },
];

// ============ 阶段基准概率配置 ============
export interface StageProbabilityConfig {
  stage: OpportunityStage;
  baseProbability: number;
  label: string;
}

export const DEFAULT_STAGE_PROBABILITIES: StageProbabilityConfig[] = [
  { stage: 'qualified', baseProbability: 10, label: '商机确认' },
  { stage: 'discovery', baseProbability: 30, label: '需求调研' },
  { stage: 'proposal', baseProbability: 50, label: '方案报价' },
  { stage: 'negotiation', baseProbability: 70, label: '商务洽谈' },
  { stage: 'contract', baseProbability: 90, label: '合同签署' },
  { stage: 'closed_won', baseProbability: 100, label: '成交' },
  { stage: 'closed_lost', baseProbability: 0, label: '失败' },
];

// ============ 预测结果 ============
export interface PredictionResult {
  opportunityId: string;
  probability: number; // 0-100
  level: PredictionLevel;
  breakdown: DimensionBreakdown[];
  recommendation: PredictionRecommendation;
  lastCalculatedAt: string;
}

export interface DimensionBreakdown {
  dimension: PredictionDimension;
  score: number;
  maxScore: number;
  weight: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  value: number;
  reason: string;
}

export interface PredictionRecommendation {
  action: string;
  priority: 'urgent' | 'normal' | 'low';
  reasons: string[];
  tips: string[];
}

// ============ 商机预测配置 ============
export interface PredictionConfig {
  id: string;
  name: string;
  description?: string;
  weights: PredictionWeight[];
  stageProbabilities: StageProbabilityConfig[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 默认预测配置
export const DEFAULT_PREDICTION_CONFIG: Omit<PredictionConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '默认预测配置',
  description: '适用于一般销售场景的商机预测配置',
  isDefault: true,
  weights: DEFAULT_PREDICTION_WEIGHTS,
  stageProbabilities: DEFAULT_STAGE_PROBABILITIES,
};

// ============ 辅助函数 ============

// 获取预测级别
export function getPredictionLevel(probability: number): PredictionLevel {
  if (probability >= 70) return 'high';
  if (probability >= 40) return 'medium';
  return 'low';
}

// 获取预测级别颜色
export function getPredictionColorClass(probability: number): string {
  if (probability >= 70) return 'text-green-600 dark:text-green-400';
  if (probability >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-600 dark:text-gray-400';
}

// 获取预测徽章样式
export function getPredictionBadgeClass(probability: number): string {
  if (probability >= 70) return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
  if (probability >= 40) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
  return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30';
}

// 获取预测级别进度条颜色
export function getPredictionProgressColor(probability: number): string {
  if (probability >= 70) return 'from-green-400 to-emerald-500';
  if (probability >= 40) return 'from-yellow-400 to-amber-500';
  return 'from-gray-400 to-gray-500';
}

// 维度图标映射
export const DIMENSION_ICONS: Record<PredictionDimension, string> = {
  stage: 'Briefcase',
  amount: 'DollarSign',
  customer_history: 'Building2',
  competition: 'Users',
  engagement: 'MessageCircle',
  timeline: 'Clock',
};

export const DIMENSION_LABELS: Record<PredictionDimension, string> = {
  stage: '商机阶段',
  amount: '金额大小',
  customer_history: '客户历史',
  competition: '竞争状况',
  engagement: '互动频率',
  timeline: '时间线',
};
