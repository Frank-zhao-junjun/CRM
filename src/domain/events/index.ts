// 导出所有领域事件
export { 
  DomainEvent, 
  generateEventId,
  type LeadCreatedPayload,
  type LeadStatusChangedPayload,
  type LeadQualifiedPayload,
  type LeadDisqualifiedPayload,
  LeadCreatedEvent,
  LeadStatusChangedEvent,
  LeadQualifiedEvent,
  LeadDisqualifiedEvent,
} from './LeadEvents';

export {
  type OpportunityCreatedPayload,
  type OpportunityStageChangedPayload,
  type OpportunityClosedWonPayload,
  type OpportunityClosedLostPayload,
  OpportunityCreatedEvent,
  OpportunityStageChangedEvent,
  OpportunityClosedWonEvent,
  OpportunityClosedLostEvent,
} from './OpportunityEvents';

export {
  type CustomerCreatedPayload,
  type CustomerUpdatedPayload,
  type CustomerDeletedPayload,
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerDeletedEvent,
} from './CustomerEvents';
