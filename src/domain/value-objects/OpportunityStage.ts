// 值对象: 商机阶段
export type OpportunityStageType = 'qualified' | 'discovery' | 'proposal' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost';

// 阶段转换规则定义（API 与领域层共用，避免多处硬编码分叉）
export const OPPORTUNITY_VALID_TRANSITIONS: Record<
  OpportunityStageType,
  OpportunityStageType[]
> = {
  qualified: ['discovery', 'closed_lost'],
  discovery: ['proposal', 'closed_lost'],
  proposal: ['negotiation', 'closed_lost'],
  negotiation: ['contract', 'closed_lost'],
  contract: ['closed_won', 'closed_lost'],
  closed_won: [], // 终态
  closed_lost: [], // 终态
};

/** @deprecated 内部使用 {@link OPPORTUNITY_VALID_TRANSITIONS} */
const VALID_TRANSITIONS = OPPORTUNITY_VALID_TRANSITIONS;

// 各阶段默认概率
export const OPPORTUNITY_DEFAULT_STAGE_PROBABILITY: Record<OpportunityStageType, number> = {
  qualified: 20,
  discovery: 30,
  proposal: 45,
  negotiation: 65,
  contract: 85,
  closed_won: 100,
  closed_lost: 0,
};

/** @deprecated 内部使用 {@link OPPORTUNITY_DEFAULT_STAGE_PROBABILITY} */
const DEFAULT_PROBABILITY = OPPORTUNITY_DEFAULT_STAGE_PROBABILITY;

/** API / 活动描述用中文阶段名 */
export const OPPORTUNITY_STAGE_LABELS_ZH: Record<OpportunityStageType, string> = {
  qualified: '商机确认',
  discovery: '需求调研',
  proposal: '方案报价',
  negotiation: '商务洽谈',
  contract: '合同签署',
  closed_won: '成交',
  closed_lost: '失败',
};

export class OpportunityStage {
  private constructor(public readonly value: OpportunityStageType) {}

  static create(value: OpportunityStageType): OpportunityStage {
    return new OpportunityStage(value);
  }

  static qualified(): OpportunityStage {
    return new OpportunityStage('qualified');
  }

  static discovery(): OpportunityStage {
    return new OpportunityStage('discovery');
  }

  static proposal(): OpportunityStage {
    return new OpportunityStage('proposal');
  }

  static negotiation(): OpportunityStage {
    return new OpportunityStage('negotiation');
  }

  static contract(): OpportunityStage {
    return new OpportunityStage('contract');
  }

  static closedWon(): OpportunityStage {
    return new OpportunityStage('closed_won');
  }

  static closedLost(): OpportunityStage {
    return new OpportunityStage('closed_lost');
  }

  // 验证是否可以转换到目标阶段
  canTransitionTo(target: OpportunityStage): boolean {
    const validTargets = VALID_TRANSITIONS[this.value] || [];
    return validTargets.includes(target.value);
  }

  // 获取有效转换目标
  getValidTransitions(): OpportunityStage[] {
    return (VALID_TRANSITIONS[this.value] || []).map(v => OpportunityStage.create(v));
  }

  getDefaultProbability(): number {
    return DEFAULT_PROBABILITY[this.value];
  }

  isWon(): boolean {
    return this.value === 'closed_won';
  }

  isLost(): boolean {
    return this.value === 'closed_lost';
  }

  isTerminal(): boolean {
    return this.value === 'closed_won' || this.value === 'closed_lost';
  }

  equals(other: OpportunityStage): boolean {
    return this.value === other.value;
  }

  getLabel(): string {
    return OPPORTUNITY_STAGE_LABELS_ZH[this.value];
  }
}
