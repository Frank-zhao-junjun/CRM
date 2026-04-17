'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Workflow,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  History,
  Loader2,
} from 'lucide-react';

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_system: boolean;
  trigger_type: string;
  trigger_config: {
    event?: string;
    cron?: string;
    description?: string;
  };
  nodes: unknown[];
  edges: unknown[];
  execution_count: number;
  success_count: number;
  failure_count: number;
  last_executed_at?: string;
  created_at: string;
  updated_at: string;
  recentExecutions?: Execution[];
}

interface Execution {
  id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [toggling, setToggling] = useState(false);

  // 加载数据
  const loadWorkflow = async () => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      const data = await res.json();
      
      if (data.id) {
        setWorkflow(data);
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  // 切换启用状态
  const handleToggle = async (enabled: boolean) => {
    if (workflow?.is_system) return;
    
    setToggling(true);
    try {
      await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          data: { enabled },
        }),
      });
      await loadWorkflow();
    } catch (error) {
      console.error('切换状态失败:', error);
    } finally {
      setToggling(false);
    }
  };

  // 执行工作流
  const handleExecute = async () => {
    setExecuting(true);
    try {
      await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
        }),
      });
      await loadWorkflow();
    } catch (error) {
      console.error('执行工作流失败:', error);
    } finally {
      setExecuting(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 格式化耗时
  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // 成功率
  const successRate = workflow ? 
    (workflow.execution_count === 0 ? 100 : Math.round((workflow.success_count / workflow.execution_count) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="text-center py-12">
        <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">工作流不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/workflows')}>
          返回工作流列表
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/workflows')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{workflow.name}</h1>
              {workflow.is_system && (
                <Badge variant="outline">预设模板</Badge>
              )}
            </div>
            {workflow.description && (
              <p className="text-muted-foreground">{workflow.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={workflow.is_active}
              onCheckedChange={handleToggle}
              disabled={workflow.is_system || toggling}
            />
            <span className="text-sm">{workflow.is_active ? '已启用' : '已停用'}</span>
          </div>
          
          <Button 
            onClick={handleExecute} 
            disabled={executing || !workflow.is_active}
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                执行中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                立即执行
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={() => router.push('/workflows')}>
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">执行次数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow.execution_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功次数</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{workflow.success_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败次数</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{workflow.failure_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 详情卡片 */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="executions">最近执行</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>工作流配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>触发类型</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {workflow.trigger_type === 'schedule' && <Clock className="h-3 w-3 mr-1" />}
                      {workflow.trigger_type === 'event' && <Zap className="h-3 w-3 mr-1" />}
                      {workflow.trigger_type === 'manual' && <Play className="h-3 w-3 mr-1" />}
                      {workflow.trigger_type === 'schedule' ? '定时执行' :
                       workflow.trigger_type === 'event' ? '事件触发' : '手动触发'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>触发配置</Label>
                  <p className="mt-1 text-sm">
                    {workflow.trigger_config?.description || 
                     workflow.trigger_config?.cron || 
                     workflow.trigger_config?.event || '-'}
                  </p>
                </div>
                
                <div>
                  <Label>节点数量</Label>
                  <p className="mt-1">{workflow.nodes?.length || 0} 个</p>
                </div>
                
                <div>
                  <Label>最近执行</Label>
                  <p className="mt-1">
                    {workflow.last_executed_at ? formatTime(workflow.last_executed_at) : '从未执行'}
                  </p>
                </div>
                
                <div>
                  <Label>创建时间</Label>
                  <p className="mt-1">{formatTime(workflow.created_at)}</p>
                </div>
                
                <div>
                  <Label>更新时间</Label>
                  <p className="mt-1">{formatTime(workflow.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="executions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>最近执行记录</CardTitle>
                <CardDescription>最近10次执行记录</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push(`/workflows/executions?workflowId=${id}`)}>
                <History className="h-4 w-4 mr-2" />
                查看全部
              </Button>
            </CardHeader>
            <CardContent>
              {!workflow.recentExecutions || workflow.recentExecutions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无执行记录
                </div>
              ) : (
                <div className="space-y-3">
                  {workflow.recentExecutions.map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {exec.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : exec.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        )}
                        <div>
                          <div className="font-medium">
                            {exec.status === 'success' ? '执行成功' :
                             exec.status === 'failed' ? '执行失败' : '执行中'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(exec.started_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(exec.duration_ms)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-medium text-muted-foreground">
      {children}
    </div>
  );
}
