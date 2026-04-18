#!/usr/bin/env python3
import re

with open('/workspace/projects/src/lib/crm-context.tsx', 'r') as f:
    content = f.read()

# === Fix 1: qualifyLead ===
old_qualify = """const qualifyLead = useCallback(async (leadId: string, opportunityData: {
    opportunityTitle: string;
    value: number;
    contactId?: string;
    contactName?: string;
    expectedCloseDate: string;
    notes?: string;
  }) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newOpportunity: SalesOpportunity = {
      id: generateId(),
      title: opportunityData.opportunityTitle,
      customerId: lead.customerId,
      customerName: lead.customerName,
      contactId: opportunityData.contactId,
      contactName: opportunityData.contactName,
      value: opportunityData.value,
      stage: 'qualified',
      probability: 10,
      expectedCloseDate: opportunityData.expectedCloseDate,
      description: opportunityData.notes,
      sourceLeadId: leadId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await apiPost('addOpportunity', newOpportunity);
    setOpportunities(prev => [...prev, newOpportunity]);
    
    await updateLead(leadId, { status: 'qualified' });
    addActivity('qualified', 'opportunity', newOpportunity.id, newOpportunity.title, `线索 "${lead.title}" 已转化为商机`);
  }, [leads, updateLead, addActivity]);"""

new_qualify = """const qualifyLead = useCallback(async (leadId: string, opportunityData: {
    opportunityTitle: string;
    value: number;
    contactId?: string;
    contactName?: string;
    expectedCloseDate: string;
    notes?: string;
  }) => {
    const result = await apiPost<{ error?: string }>('qualifyLead', { leadId, ...opportunityData });
    if (!result.error) {
      await loadData();
    }
  }, [loadData]);"""

if old_qualify in content:
    content = content.replace(old_qualify, new_qualify, 1)
    print("qualifyLead: FIXED")
else:
    print("qualifyLead: NOT FOUND - checking...")
    idx = content.find('const qualifyLead')
    if idx >= 0:
        end = content.find('}, [leads, updateLead, addActivity]);', idx) + len('}, [leads, updateLead, addActivity]);')
        print(f"  Found at idx={idx}, ends at {end}")
        print(f"  Expected len={len(old_qualify)}")
        print(f"  Actual snippet: {repr(content[idx:idx+200])}")

# === Fix 2: changeOpportunityStage ===
old_change_stage = """const changeOpportunityStage = useCallback(async (id: string, newStage: OpportunityStage, reason?: string) => {
    const opportunity = opportunities.find(o => o.id === id);
    if (!opportunity) return;

    const stageConfig = {
      qualified: '线索',
      discovery: '需求确认',
      proposal: '方案报价',
      negotiation: '商务谈判',
      contract: '合同签署',
      closed_won: '已成交',
      closed_lost: '已输单',
    };

    const oldStage = opportunity.stage;
    const probabilityMap: Record<OpportunityStage, number> = {
      qualified: 10,
      discovery: 25,
      proposal: 50,
      negotiation: 75,
      contract: 90,
      closed_won: 100,
      closed_lost: 0,
    };

    await updateOpportunity(id, { 
      stage: newStage, 
      probability: probabilityMap[newStage],
      notes: reason || opportunity.notes 
    });

    const activityType = newStage === 'closed_won' ? 'closed_won' : newStage === 'closed_lost' ? 'closed_lost' : 'stage_change';
    const description = activityType === 'closed_won' 
      ? `商机成交！金额：¥${opportunity.value.toLocaleString()}`
      : activityType === 'closed_lost'
      ? `商机输单${reason ? `，原因：${reason}` : ''}`
      : `阶段变更: ${stageConfig[oldStage]} → ${stageConfig[newStage]}`;

    addActivity(activityType, 'opportunity', id, opportunity.title, description);
  }, [opportunities, updateOpportunity, addActivity]);"""

new_change_stage = """const changeOpportunityStage = useCallback(async (id: string, newStage: OpportunityStage, reason?: string) => {
    const result = await apiPut<{ error?: string }>('changeStage', id, { stage: newStage, reason });
    if (!result.error) {
      await loadData();
    }
  }, [loadData]);"""

if old_change_stage in content:
    content = content.replace(old_change_stage, new_change_stage, 1)
    print("changeOpportunityStage: FIXED")
else:
    print("changeOpportunityStage: NOT FOUND - checking...")
    idx = content.find('const changeOpportunityStage')
    if idx >= 0:
        end = content.find('}, [opportunities, updateOpportunity, addActivity]);', idx) + len('}, [opportunities, updateOpportunity, addActivity]);')
        print(f"  Found at idx={idx}, ends at {end}")
        print(f"  Expected len={len(old_change_stage)}")

with open('/workspace/projects/src/lib/crm-context.tsx', 'w') as f:
    f.write(content)
print("File written.")
