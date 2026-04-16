// 报表系统类型定义

// ============ 报表数据时间范围 ============
export type TimeRange = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

// ============ 销售漏斗数据 ============
export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  amount: number;
  conversionRate: number;
}

export interface FunnelReport {
  stages: FunnelStage[];
  totalCount: number;
  totalAmount: number;
  overallConversionRate: number;
}

// ============ 团队排名数据 ============
export interface TeamMemberMetrics {
  userId: string;
  userName: string;
  avatar?: string;
  closedAmount: number;
  newOpportunities: number;
  conversionRate: number;
  growthRate: number; // 环比增长率
  rank: number;
}

export interface TeamRankingReport {
  members: TeamMemberMetrics[];
  period: DateRange;
}

// ============ 收入预测数据 ============
export interface RevenueForecast {
  month: string;
  optimistic: number;  // 乐观预测（所有商机）
  expected: number;     // 预期（按概率加权）
  conservative: number; // 保守预测（仅高概率）
  actual?: number;      // 实际收入
}

export interface ForecastReport {
  forecasts: RevenueForecast[];
  totalOptimistic: number;
  totalExpected: number;
  totalConservative: number;
  totalActual?: number;
}

// ============ 阶段转化数据 ============
export interface ConversionMetrics {
  stage: string;
  label: string;
  enteredCount: number;
  convertedCount: number;
  conversionRate: number;
  avgStayDays: number;
  isBottleneck: boolean; // 是否是瓶颈阶段
}

export interface ConversionReport {
  metrics: ConversionMetrics[];
  period: DateRange;
}

// ============ 报表统计概览 ============
export interface ReportSummary {
  totalRevenue: number;
  revenueGrowth: number;
  totalDeals: number;
  dealConversion: number;
  avgDealValue: number;
  pipelineValue: number;
}

// ============ 报表配置 ============
export interface ReportConfig {
  defaultTimeRange: TimeRange;
  currency: string;
  showGrowth: boolean;
}
