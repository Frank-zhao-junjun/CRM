// 工作流管理 API (V5.2)

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 预置工作流模板
const PRESET_WORKFLOWS = [
  {
    id: 'preset-welcome-email',
    name: '新客户欢迎邮件',
    description: '新客户创建后自动发送欢迎邮件',
    is_system: true,
    trigger_type: 'event',
    trigger_config: JSON.stringify({ 
      event: 'customer.created',
      description: '当创建新客户时触发' 
    }),
    nodes: JSON.stringify([
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { label: '触发器', nodeType: 'trigger', config: { event: 'customer.created' } }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 350, y: 200 },
        data: { label: '发送邮件', nodeType: 'action', actionType: 'send_email', config: { template: 'welcome' } }
      }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 'trigger-1', target: 'action-1', type: 'smoothstep' }
    ]),
  },
  {
    id: 'preset-opportunity-notify',
    name: '商机阶段变更通知',
    description: '商机阶段变更时通知负责人',
    is_system: true,
    trigger_type: 'event',
    trigger_config: JSON.stringify({ 
      event: 'opportunity.stage_changed',
      description: '当商机阶段变更时触发' 
    }),
    nodes: JSON.stringify([
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { label: '触发器', nodeType: 'trigger', config: { event: 'opportunity.stage_changed' } }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 350, y: 200 },
        data: { label: '条件判断', nodeType: 'condition', config: { field: 'newStage', operator: 'equals', value: 'closed_won' } }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 600, y: 150 },
        data: { label: '发送通知', nodeType: 'action', actionType: 'send_notification', config: { message: '恭喜！商机已成交' } }
      }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 'trigger-1', target: 'condition-1', type: 'smoothstep' },
      { id: 'e2', source: 'condition-1', target: 'action-1', type: 'smoothstep', label: '是' }
    ]),
  },
  {
    id: 'preset-payment-reminder',
    name: '回款逾期提醒',
    description: '回款逾期前3天自动提醒',
    is_system: true,
    trigger_type: 'schedule',
    trigger_config: JSON.stringify({ 
      cron: '0 9 * * *',
      description: '每天早上9点执行' 
    }),
    nodes: JSON.stringify([
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { label: '定时触发', nodeType: 'trigger', config: { cron: '0 9 * * *' } }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 350, y: 200 },
        data: { label: '查询逾期', nodeType: 'action', actionType: 'query_data', config: { entity: 'invoices', filter: 'overdue' } }
      },
      {
        id: 'action-2',
        type: 'action',
        position: { x: 600, y: 200 },
        data: { label: '发送提醒', nodeType: 'action', actionType: 'send_notification', config: { message: '您有回款已逾期，请及时处理' } }
      }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 'trigger-1', target: 'action-1', type: 'smoothstep' },
      { id: 'e2', source: 'action-1', target: 'action-2', type: 'smoothstep' }
    ]),
  },
  {
    id: 'preset-lead-followup',
    name: '线索未跟进提醒',
    description: '线索超过7天未跟进时提醒负责人',
    is_system: true,
    trigger_type: 'schedule',
    trigger_config: JSON.stringify({ 
      cron: '0 10 * * 1-5',
      description: '工作日上午10点执行' 
    }),
    nodes: JSON.stringify([
      {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { label: '定时触发', nodeType: 'trigger', config: { cron: '0 10 * * 1-5' } }
      },
      {
        id: 'action-1',
        type: 'action',
        position: { x: 350, y: 200 },
        data: { label: '查询未跟进线索', nodeType: 'action', actionType: 'query_data', config: { entity: 'leads', filter: 'stale_7days' } }
      },
      {
        id: 'action-2',
        type: 'action',
        position: { x: 600, y: 200 },
        data: { label: '创建任务', nodeType: 'action', actionType: 'create_task', config: { title: '跟进线索', dueDays: 1 } }
      }
    ]),
    edges: JSON.stringify([
      { id: 'e1', source: 'trigger-1', target: 'action-1', type: 'smoothstep' },
      { id: 'e2', source: 'action-1', target: 'action-2', type: 'smoothstep' }
    ]),
  },
];

// GET /api/workflows - 获取工作流列表
export async function GET(request: NextRequest) {
  try {
    const client = await getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeStats = searchParams.get('includeStats') === 'true';
    const action = searchParams.get('action');

    // 获取统计
    if (includeStats) {
      const { data: activeData } = await client
        .from('automation_workflows')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const { count: totalCount } = await client
        .from('automation_workflows')
        .select('*', { count: 'exact', head: true })
        .single();

      const { data: todayExecutions } = await client
        .from('automation_workflow_executions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      const { data: successRate } = await client
        .from('automation_workflow_executions')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      let success = 0, total = 0;
      if (successRate) {
        successRate.forEach((r: { status: string }) => {
          total++;
          if (r.status === 'success') success++;
        });
      }

      return NextResponse.json({
        stats: {
          total: totalCount || 0,
          active: activeData?.length || 0,
          successRate: total > 0 ? Math.round((success / total) * 100) : 100,
          todayExecutions: todayExecutions?.length || 0,
        }
      });
    }

    // 获取执行日志
    if (action === 'executions') {
      const workflowId = searchParams.get('workflowId');
      let query = client.from('automation_workflow_executions').select('*', { count: 'exact' });
      
      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }
      
      query = query.order('created_at', { ascending: false });
      query = query.range((page - 1) * limit, page * limit - 1);
      
      const { data: executions, count } = await query;
      
      return NextResponse.json({
        executions: executions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }

    // 获取单个工作流
    if (id) {
      const { data: workflow, error } = await client
        .from('automation_workflows')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error || !workflow) {
        return NextResponse.json({ error: '工作流不存在' }, { status: 404 });
      }
      
      // 解析 JSON 字段
      const parsed = {
        ...workflow,
        trigger_config: JSON.parse(workflow.trigger_config || '{}'),
        nodes: JSON.parse(workflow.nodes || '[]'),
        edges: JSON.parse(workflow.edges || '[]'),
      };
      
      return NextResponse.json(parsed);
    }

    // 获取预置模板
    if (action === 'templates') {
      return NextResponse.json({ templates: PRESET_WORKFLOWS });
    }

    // 获取列表
    let query = client.from('automation_workflows').select('*', { count: 'exact' });
    
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    query = query.range((page - 1) * limit, page * limit - 1);
    
    const { data: workflows, count } = await query;
    
    // 解析 JSON 字段
    const parsedWorkflows = (workflows || []).map((w: Record<string, unknown>) => ({
      ...w,
      trigger_config: JSON.parse(w.trigger_config as string || '{}'),
      nodes: JSON.parse(w.nodes as string || '[]'),
      edges: JSON.parse(w.edges as string || '[]'),
    }));
    
    return NextResponse.json({
      workflows: parsedWorkflows,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Workflows GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/workflows - 创建工作流
export async function POST(request: NextRequest) {
  try {
    const client = await getSupabaseClient();
    const body = await request.json();
    const { action, data } = body;

    // 使用模板创建
    if (action === 'createFromTemplate') {
      const template = PRESET_WORKFLOWS.find(t => t.id === data.templateId);
      if (!template) {
        return NextResponse.json({ error: '模板不存在' }, { status: 404 });
      }
      
      const { data: workflow, error } = await client
        .from('automation_workflows')
        .insert({
          name: data.name || template.name,
          description: data.description || template.description,
          is_system: false,
          is_active: false,
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config,
          nodes: template.nodes,
          edges: template.edges,
          created_by: 'system',
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return NextResponse.json({
        ...workflow,
        trigger_config: JSON.parse(workflow.trigger_config),
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
      });
    }

    // 创建新工作流
    const { data: workflow, error } = await client
      .from('automation_workflows')
      .insert({
        name: data.name,
        description: data.description || null,
        is_active: data.isActive ?? true,
        is_system: false,
        trigger_type: data.triggerType || 'manual',
        trigger_config: typeof data.triggerConfig === 'string' ? data.triggerConfig : JSON.stringify(data.triggerConfig || {}),
        nodes: typeof data.nodes === 'string' ? data.nodes : JSON.stringify(data.nodes || []),
        edges: typeof data.edges === 'string' ? data.edges : JSON.stringify(data.edges || []),
        created_by: data.createdBy || 'system',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ...workflow,
      trigger_config: JSON.parse(workflow.trigger_config),
      nodes: JSON.parse(workflow.nodes),
      edges: JSON.parse(workflow.edges),
    });
  } catch (error) {
    console.error('Workflows POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/workflows - 更新工作流
export async function PUT(request: NextRequest) {
  try {
    const client = await getSupabaseClient();
    const body = await request.json();
    const { id, data } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少工作流ID' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    if (data.triggerType !== undefined) updates.trigger_type = data.triggerType;
    if (data.triggerConfig !== undefined) {
      updates.trigger_config = typeof data.triggerConfig === 'string' ? data.triggerConfig : JSON.stringify(data.triggerConfig);
    }
    if (data.nodes !== undefined) {
      updates.nodes = typeof data.nodes === 'string' ? data.nodes : JSON.stringify(data.nodes);
    }
    if (data.edges !== undefined) {
      updates.edges = typeof data.edges === 'string' ? data.edges : JSON.stringify(data.edges);
    }

    const { data: workflow, error } = await client
      .from('automation_workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ...workflow,
      trigger_config: JSON.parse(workflow.trigger_config),
      nodes: JSON.parse(workflow.nodes),
      edges: JSON.parse(workflow.edges),
    });
  } catch (error) {
    console.error('Workflows PUT error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
