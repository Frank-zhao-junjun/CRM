// 导出所有仓储接口
export { 
  ICustomerRepository, 
  IContactRepository, 
  type CustomerFilter 
} from './ICustomerRepository';

export { 
  ISalesLeadRepository, 
  type LeadFilter 
} from './ISalesLeadRepository';

export { 
  ISalesOpportunityRepository, 
  type OpportunityFilter 
} from './ISalesOpportunityRepository';

export { 
  IActivityRepository, 
  type ActivityRecord 
} from './IActivityRepository';
