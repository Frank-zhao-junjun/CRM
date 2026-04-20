import { describe, expect, it } from 'vitest';
import {
  OPPORTUNITY_DEFAULT_STAGE_PROBABILITY,
  OPPORTUNITY_VALID_TRANSITIONS,
} from '@/domain/value-objects/OpportunityStage';

describe('OpportunityStage rules (US-02)', () => {
  it('allows qualified → discovery and closed_lost only', () => {
    expect(OPPORTUNITY_VALID_TRANSITIONS.qualified).toEqual(['discovery', 'closed_lost']);
  });

  it('blocks closed_won from transitioning further', () => {
    expect(OPPORTUNITY_VALID_TRANSITIONS.closed_won).toEqual([]);
  });

  it('assigns default probability for negotiation', () => {
    expect(OPPORTUNITY_DEFAULT_STAGE_PROBABILITY.negotiation).toBe(65);
  });
});
