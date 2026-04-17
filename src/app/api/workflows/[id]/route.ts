// 工作流详情 API - GET/DELETE /api/workflows/[id]

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workflows/[id] - 获取工作流详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getSupabaseClient();
    const { id } = await params;
    
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
    
    // 获取最近的执行记录
    const { data: recentExecutions } = await client
      .from('automation_workflow_executions')
      .select('*')
      .eq('workflow_id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      ...parsed,
      recentExecutions: recentExecutions || [],
    });
  } catch (error) {
    console.error('Workflow GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/workflows/[id] - 更新工作流
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    // 获取当前工作流
    const { data: current, error: fetchError } = await client
      .from('automation_workflows')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (fetchError || !current) {
      return NextResponse.json({ error: '工作流不存在' }, { status: 404 });
    }

    // 切换启用状态
    if (action === 'toggle') {
      const { data: workflow, error } = await client
        .from('automation_workflows')
        .update({
          is_active: data.enabled,
          updated_at: new Date().toISOString(),
        })
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
    }

    // 手动执行
    if (action === 'execute') {
      // 创建执行记录
      const { data: execution, error: execError } = await client
        .from('automation_workflow_executions')
        .insert({
          workflow_id: id,
          trigger_type: 'manual',
          trigger_source: '手动触发',
          status: 'running',
          input_data: JSON.stringify(data?.input || {}),
        })
        .select()
        .single();
      
      if (execError) throw new Error(execError.message);
      
      // 模拟执行（实际应该执行工作流节点）
      try {
        // 执行工作流逻辑
        const nodes = JSON.parse(current.nodes || '[]');
        const edges = JSON.parse(current.edges || '[]');
        
        // 更新执行统计
        const newCount = current.execution_count + 1;
        
        await client
          .from('automation_workflows')
          .update({
            execution_count: newCount,
            last_executed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        
        // 更新执行记录
        await client
          .from('automation_workflow_executions')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: 1000,
            output_data: JSON.stringify({ nodesExecuted: nodes.length, edgesProcessed: edges.length }),
            node_executions: JSON.stringify(nodes.map((n: { id: string; data: { label: string } }) => ({
              nodeId: n.id,
              label: n.data.label,
              status: 'success',
              duration: Math.floor(Math.random() * 500) + 100,
            }))),
          })
          .eq('id', execution.id);
        
        // 更新成功计数
        await client
          .from('automation_workflows')
          .update({ success_count: current.success_count + 1 })
          .eq('id', id);
        
      } catch (execError) {
        // 执行失败
        await client
          .from('automation_workflow_executions')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: (execError as Error).message,
          })
          .eq('id', execution.id);
        
        // 更新失败计数
        await client
          .from('automation_workflows')
          .update({ failure_count: current.failure_count + 1 })
          .eq('id', id);
        
        return NextResponse.json({ 
          success: false, 
          executionId: execution.id,
          error: (execError as Error).message 
        }, { status: 500 });
      }
      
      const { data: updatedExecution } = await client
        .from('automation_workflow_executions')
        .select('*')
        .eq('id', execution.id)
        .single();
      
      return NextResponse.json({ 
        success: true, 
        execution: updatedExecution 
      });
    }

    // 通用更新
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
    console.error('Workflow PATCH error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/workflows/[id] - 删除工作流
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const client = await getSupabaseClient();
    const { id } = await params;
    
    const { data: workflow, error } = await client
      .from('automation_workflows')
      .select('id, is_system')
      .eq('id', id)
      .maybeSingle();
    
    if (error || !workflow) {
      return NextResponse.json({ error: '工作流不存在' }, { status: 404 });
    }
    
    // 不能删除系统预设模板
    if (workflow.is_system) {
      return NextResponse.json({ error: '不能删除系统预设模板' }, { status: 403 });
    }
    
    // 删除工作流（执行记录会级联删除）
    await client.from('automation_workflows').delete().eq('id', id);
    
    return NextResponse.json({ success: true, message: '工作流已删除' });
  } catch (error) {
    console.error('Workflow DELETE error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
