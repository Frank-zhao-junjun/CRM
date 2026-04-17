import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  RULE_TEMPLATES,
  RuleConfig,
  stringifyConditions,
  stringifyActions,
  parseConditions,
  parseActions,
} from '@/lib/automation-engine';
import type { AutomationRule } from '@/storage/database/shared/schema';

// 获取所有自动化规则
async function getAutomationRules() {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data?.map((rule: AutomationRule) => ({
    ...rule,
    conditions: parseConditions(rule.conditions),
    actions: parseActions(rule.actions),
  })) || [];
}

// 获取单个规则
async function getAutomationRule(id: string) {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    conditions: parseConditions(data.conditions),
    actions: parseActions(data.actions),
  };
}

// 创建规则
async function createRule(rule: RuleConfig) {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      name: rule.name,
      description: rule.description || null,
      trigger_type: rule.trigger_type,
      entity_type: rule.entity_type,
      conditions: stringifyConditions(rule.conditions),
      actions: stringifyActions(rule.actions),
      is_enabled: rule.is_enabled ?? true,
      priority: rule.priority ?? 0,
      is_system: false,
      trigger_count: 0,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    conditions: parseConditions(data.conditions),
    actions: parseActions(data.actions),
  };
}

// 更新规则
async function updateRule(id: string, updates: Partial<RuleConfig>) {
  const supabase = await getSupabaseClient();
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
  if (updates.entity_type !== undefined) updateData.entity_type = updates.entity_type;
  if (updates.conditions !== undefined) updateData.conditions = stringifyConditions(updates.conditions);
  if (updates.actions !== undefined) updateData.actions = stringifyActions(updates.actions);
  if (updates.is_enabled !== undefined) updateData.is_enabled = updates.is_enabled;
  if (updates.priority !== undefined) updateData.priority = updates.priority;

  const { data, error } = await supabase
    .from('automation_rules')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    conditions: parseConditions(data.conditions),
    actions: parseActions(data.actions),
  };
}

// 删除规则
async function deleteRule(id: string) {
  const supabase = await getSupabaseClient();
  
  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return { success: true };
}

// 启用/禁用规则
async function toggleRule(id: string, isEnabled: boolean) {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('automation_rules')
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    conditions: parseConditions(data.conditions),
    actions: parseActions(data.actions),
  };
}

// 从模板创建规则
async function createFromTemplate(templateId: string) {
  const template = RULE_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error('模板不存在');
  }

  return createRule(template.config);
}

// 获取规则执行日志
async function getRuleLogs(ruleId?: string, limit = 50) {
  const supabase = await getSupabaseClient();
  
  let query = supabase
    .from('automation_logs')
    .select('*, automation_rules(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

// 获取规则统计
async function getRuleStats() {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('automation_rules')
    .select('id, name, trigger_count, last_triggered_at, is_enabled');

  if (error) {
    throw error;
  }

  return {
    total_rules: data?.length || 0,
    enabled_rules: data?.filter(r => r.is_enabled).length || 0,
    total_triggers: data?.reduce((sum, r) => sum + (r.trigger_count || 0), 0) || 0,
    rules: data || [],
  };
}

// GET /api/automation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');
  const ruleId = searchParams.get('ruleId');
  const templateId = searchParams.get('templateId');

  try {
    // 获取规则统计
    if (action === 'stats') {
      const stats = await getRuleStats();
      return NextResponse.json({ success: true, data: stats });
    }

    // 获取规则执行日志
    if (action === 'logs') {
      const logs = await getRuleLogs(ruleId || undefined);
      return NextResponse.json({ success: true, data: logs });
    }

    // 获取预设模板
    if (action === 'templates') {
      return NextResponse.json({ success: true, data: RULE_TEMPLATES });
    }

    // 从模板创建规则
    if (templateId) {
      const rule = await createFromTemplate(templateId);
      return NextResponse.json({ success: true, data: rule });
    }

    // 获取单个规则
    if (id) {
      const rule = await getAutomationRule(id);
      if (!rule) {
        return NextResponse.json({ success: false, error: '规则不存在' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: rule });
    }

    // 获取所有规则
    const rules = await getAutomationRules();
    return NextResponse.json({ success: true, data: rules });

  } catch (error) {
    console.error('获取自动化规则失败:', error);
    return NextResponse.json(
      { success: false, error: '获取自动化规则失败' },
      { status: 500 }
    );
  }
}

// POST /api/automation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rule = await createRule(body);
    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error) {
    console.error('创建自动化规则失败:', error);
    return NextResponse.json(
      { success: false, error: '创建自动化规则失败' },
      { status: 500 }
    );
  }
}

// PUT /api/automation
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少规则ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const rule = await updateRule(id, body);
    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('更新自动化规则失败:', error);
    return NextResponse.json(
      { success: false, error: '更新自动化规则失败' },
      { status: 500 }
    );
  }
}

// PATCH /api/automation
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const toggle = searchParams.get('toggle');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少规则ID' }, { status: 400 });
  }

  try {
    if (toggle === 'enable') {
      const rule = await toggleRule(id, true);
      return NextResponse.json({ success: true, data: rule });
    }
    if (toggle === 'disable') {
      const rule = await toggleRule(id, false);
      return NextResponse.json({ success: true, data: rule });
    }
    
    return NextResponse.json({ success: false, error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('切换规则状态失败:', error);
    return NextResponse.json(
      { success: false, error: '切换规则状态失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/automation
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少规则ID' }, { status: 400 });
  }

  try {
    await deleteRule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除自动化规则失败:', error);
    return NextResponse.json(
      { success: false, error: '删除自动化规则失败' },
      { status: 500 }
    );
  }
}
