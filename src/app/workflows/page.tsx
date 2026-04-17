'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Plus,
  Search,
  MoreHorizontal,
  Workflow,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Zap,
  Clock,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  WorkflowEditor,
  WorkflowTemplate,
} from '@/components/workflows/workflow-editor';
import { TemplateSelector } from '@/components/workflows/template-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, string>;
  status: string;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  trigger_type: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // 加载工作流列表
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (data.success) {
        setWorkflows(data.data);
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载执行日志
  const loadExecutions = async () => {
    try {
      setExecutionsLoading(true);
      const res = await fetch('/api/workflows/executions');
      const data = await res.json();
      if (data.success) {
        setExecutions(data.data.slice(0, 20)); // 只显示最近20条
      }
    } catch (error) {
      console.error('加载执行日志失败:', error);
    } finally {
      setExecutionsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, []);

  // 过滤工作流
  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 创建工作流
  const handleCreate = () => {
    setTemplateDialogOpen(true);
  };

  // 从模板创建
  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setTemplateDialogOpen(false);
    setEditingWorkflow({
      id: '',
      name: template.name,
      description: template.description,
      trigger_type: template.triggerType,
      trigger_config: template.triggerConfig,
      status: 'draft',
      execution_count: 0,
      last_executed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setEditorMode('create');
    setEditorOpen(true);
  };

  // 编辑工作流
  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setEditorMode('edit');
    setEditorOpen(true);
  };

  // 查看工作流
  const handleView = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setDetailDialogOpen(true);
  };

  // 删除工作流
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
    setConfirmDelete(null);
  };

  // 保存工作流
  const handleSave = async (workflowData: {
    name: string;
    description: string;
    triggerType: string;
    triggerConfig: Record<string, string>;
    nodes: unknown[];
    edges: unknown[];
  }) => {
    try {
      if (editorMode === 'edit' && editingWorkflow?.id) {
        // 更新
        await fetch(`/api/workflows/${editingWorkflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflowData.name,
            description: workflowData.description,
            trigger_type: workflowData.triggerType,
            trigger_config: workflowData.triggerConfig,
            nodes: workflowData.nodes,
            edges: workflowData.edges,
          }),
        });
      } else {
        // 创建
        await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: workflowData.name,
            description: workflowData.description,
            trigger_type: workflowData.triggerType,
            trigger_config: workflowData.triggerConfig,
            nodes: workflowData.nodes,
            edges: workflowData.edges,
          }),
        });
      }
      loadWorkflows();
      setEditorOpen(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 执行工作流
  const handleExecute = async (id: string) => {
    try {
      await fetch(`/api/workflows/${id}/execute`, {
        method: 'POST',
      });
      loadExecutions();
    } catch (error) {
      console.error('执行失败:', error);
    }
  };

  // 发布/取消发布
  const handleToggleStatus = async (workflow: Workflow) => {
    try {
      const newStatus = workflow.status === 'active' ? 'draft' : 'active';
      await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadWorkflows();
    } catch (error) {
      console.error('状态更新失败:', error);
    }
  };

  // 状态显示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">已启用</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'inactive':
        return <Badge variant="outline">已停用</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 执行状态显示
  const getExecutionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">运行中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 触发类型显示
  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'manual':
        return '手动';
      case 'schedule':
        return '定时';
      case 'event':
        return '事件';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">工作流自动化</h1>
          <p className="text-sm text-muted-foreground">
            设计自动化业务流程，提高工作效率
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadWorkflows();
              loadExecutions();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建工作流
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总工作流</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已启用</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter((w) => w.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">今日执行</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.filter((e) => {
                const today = new Date().toDateString();
                return new Date(e.started_at).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.length > 0
                ? Math.round(
                    (executions.filter((e) => e.status === 'completed').length /
                      executions.length) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 列表和执行日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 工作流列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>工作流列表</CardTitle>
                  <CardDescription>管理你的自动化工作流</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索工作流..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <select
                    className="px-3 py-2 border rounded-md text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">全部状态</option>
                    <option value="active">已启用</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无工作流</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={handleCreate}
                  >
                    创建第一个工作流
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>触发类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>执行次数</TableHead>
                      <TableHead>最近执行</TableHead>
                      <TableHead className="w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkflows.map((workflow) => (
                      <TableRow key={workflow.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{workflow.name}</div>
                            {workflow.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {workflow.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTriggerTypeLabel(workflow.trigger_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(workflow.status)}</TableCell>
                        <TableCell>{workflow.execution_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {workflow.last_executed_at
                            ? new Date(workflow.last_executed_at).toLocaleString('zh-CN')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(workflow)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(workflow)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExecute(workflow.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                立即执行
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(workflow)}>
                                {workflow.status === 'active' ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    停用
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    启用
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setConfirmDelete(workflow.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 执行日志 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>执行日志</CardTitle>
              <CardDescription>最近的工作流执行记录</CardDescription>
            </CardHeader>
            <CardContent>
              {executionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">暂无执行记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {execution.workflow_name}
                          </span>
                          {getExecutionStatusBadge(execution.status)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(execution.started_at).toLocaleString('zh-CN')}
                          </div>
                          {execution.error && (
                            <div className="text-red-500 mt-1 truncate">
                              {execution.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 模板选择弹窗 */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <TemplateSelector
            onSelect={handleTemplateSelect}
            onCancel={() => setTemplateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 工作流编辑器 */}
      <WorkflowEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        initialData={
          editingWorkflow
            ? {
                id: editingWorkflow.id,
                name: editingWorkflow.name,
                description: editingWorkflow.description,
                triggerType: editingWorkflow.trigger_type,
                triggerConfig: editingWorkflow.trigger_config,
                nodes: [],
                edges: [],
              }
            : undefined
        }
        mode={editorMode}
      />

      {/* 工作流详情 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>工作流详情</DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">描述</Label>
                <p className="mt-1">{selectedWorkflow.description || '无'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">触发类型</Label>
                <p className="mt-1">
                  <Badge variant="outline">
                    {getTriggerTypeLabel(selectedWorkflow.trigger_type)}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">状态</Label>
                <div className="mt-1">{getStatusBadge(selectedWorkflow.status)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">触发配置</Label>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(selectedWorkflow.trigger_config, null, 2)}
                </pre>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">执行统计</Label>
                <p className="mt-1">
                  共执行 {selectedWorkflow.execution_count} 次
                  {selectedWorkflow.last_executed_at && (
                    <span className="text-muted-foreground ml-2">
                      最近: {new Date(selectedWorkflow.last_executed_at).toLocaleString('zh-CN')}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">创建时间</Label>
                <p className="mt-1">
                  {new Date(selectedWorkflow.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个工作流吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
