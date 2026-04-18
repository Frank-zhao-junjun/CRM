// AI 线索评分模块 - 类型定义

import { LeadSourceType, LeadStatusType } from './crm-types';

// ============ 评分维度类型 ============
export type ScoreDimension = 
  | 'company_size'      // 公司规模
  | 'industry_match'    // 行业匹配度
  | 'source_quality'    // 来源渠道质量
  | 'engagement_level'  // 互动频率
  | 'estimated_value'   // 预估价值
  | 'contact_complete'; // 联系信息完整度

// 评分级别
export type ScoreLevel = 'hot' | 'warm' | 'cold';

// 评分级别配置
export const SCORE_LEVEL_CONFIG: Record<ScoreLevel, { 
  label: string; 
  color: string; 
  bgClass: string;
  borderClass: string;
  strategy: string;
  priority: number;
}> = {
  hot: {
    label: '高优先级',
    color: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    strategy: '立即跟进',
    priority: 1,
  },
  warm: {
    label: '中优先级',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/30',
    strategy: '培育计划',
    priority: 2,
  },
  cold: {
    label: '低优先级',
    color: 'text-gray-600 dark:text-gray-400',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/30',
    strategy: '暂缓跟进',
    priority: 3,
  },
};

// ============ 评分权重配置 ============
export interface ScoreWeight {
  dimension: ScoreDimension;
  weight: number; // 权重百分比 (0-100)
  isActive: boolean;
}

export const DEFAULT_WEIGHTS: ScoreWeight[] = [
  { dimension: 'company_size', weight: 20, isActive: true },
  { dimension: 'industry_match', weight: 20, isActive: true },
  { dimension: 'source_quality', weight: 25, isActive: true },
  { dimension: 'engagement_level', weight: 15, isActive: true },
  { dimension: 'estimated_value', weight: 10, isActive: true },
  { dimension: 'contact_complete', weight: 10, isActive: true },
];

// ============ 评分维度配置 ============
export interface DimensionConfig {
  dimension: ScoreDimension;
  label: string;
  description: string;
  maxScore: number;
}

export const DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    dimension: 'company_size',
    label: '公司规模',
    description: '根据客户公司规模评分',
    maxScore: 100,
  },
  {
    dimension: 'industry_match',
    label: '行业匹配度',
    description: '与目标行业的匹配程度',
    maxScore: 100,
  },
  {
    dimension: 'source_quality',
    label: '来源渠道',
    description: '线索来源渠道的质量',
    maxScore: 100,
  },
  {
    dimension: 'engagement_level',
    label: '互动频率',
    description: '与线索的互动程度',
    maxScore: 100,
  },
  {
    dimension: 'estimated_value',
    label: '预估价值',
    description: '预估交易价值',
    maxScore: 100,
  },
  {
    dimension: 'contact_complete',
    label: '信息完整度',
    description: '联系方式完整程度',
    maxScore: 100,
  },
];

// ============ 评分结果 ============
export interface LeadScoreResult {
  leadId: string;
  totalScore: number; // 0-100
  level: ScoreLevel;
  dimensions: DimensionScore[];
  strategy: string;
  lastCalculatedAt: string;
}

export interface DimensionScore {
  dimension: ScoreDimension;
  score: number;
  maxScore: number;
  weight: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  value: number;
  reason: string;
}

// ============ 线索评分配置 ============
export interface LeadScoringConfig {
  id: string;
  name: string;
  description?: string;
  weights: ScoreWeight[];
  companySizeRules: CompanySizeRule[];
  industryRules: IndustryRule[];
  sourceRules: SourceQualityRule[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 公司规模规则
export interface CompanySizeRule {
  range: string; // 如 "1-50", "51-200", "201-1000", "1000+"
  minEmployees?: number;
  maxEmployees?: number;
  score: number;
  label: string;
}

// 行业规则
export interface IndustryRule {
  industry: string;
  isTargetIndustry: boolean;
  score: number;
}

// 来源渠道质量规则
export interface SourceQualityRule {
  source: LeadSourceType;
  quality: 'high' | 'medium' | 'low';
  score: number;
}

// 评分配置预设
export const DEFAULT_SCORING_CONFIG: Omit<LeadScoringConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '默认评分配置',
  description: '适用于一般销售场景的线索评分配置',
  isDefault: true,
  weights: DEFAULT_WEIGHTS,
  companySizeRules: [
    { range: '1-50', minEmployees: 1, maxEmployees: 50, score: 30, label: '小微企业' },
    { range: '51-200', minEmployees: 51, maxEmployees: 200, score: 50, label: '中小企业' },
    { range: '201-1000', minEmployees: 201, maxEmployees: 1000, score: 80, label: '中大型企业' },
    { range: '1000+', minEmployees: 1001, maxEmployees: undefined, score: 100, label: '大型企业' },
  ],
  industryRules: [
    { industry: '科技', isTargetIndustry: true, score: 90 },
    { industry: '金融', isTargetIndustry: true, score: 85 },
    { industry: '医疗', isTargetIndustry: true, score: 85 },
    { industry: '教育', isTargetIndustry: true, score: 80 },
    { industry: '制造业', isTargetIndustry: false, score: 70 },
    { industry: '零售', isTargetIndustry: false, score: 60 },
    { industry: '其他', isTargetIndustry: false, score: 50 },
  ],
  sourceRules: [
    { source: 'referral', quality: 'high', score: 95 },
    { source: 'event', quality: 'high', score: 85 },
    { source: 'website', quality: 'medium', score: 70 },
    { source: 'advertisement', quality: 'medium', score: 60 },
    { source: 'cold_call', quality: 'low', score: 40 },
    { source: 'other', quality: 'low', score: 30 },
  ],
};

// 扩展 SalesLead 类型
export interface ScoredLead {
  id: string;
  title: string;
  source: LeadSourceType;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  estimatedValue: number;
  probability: number;
  status: LeadStatusType;
  notes?: string;
  // 评分相关字段
  score?: number;
  scoreLevel?: ScoreLevel;
  scoreDetails?: LeadScoreResult;
  // 客户扩展字段（用于评分）
  customerIndustry?: string;
  customerEmployees?: number;
  customerWebsite?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}
