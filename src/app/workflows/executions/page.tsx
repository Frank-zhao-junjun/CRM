'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Workflow,
  Play,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface Execution {
  id: string;
  workflow_id: string;
  trigger_type: string;
  trigger_source?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  input_data?: string;
  output_data?: string;
  error_message?: string;
  node_executions?: string;
  created_at: string;
}

interface Workflow {
  id: string;
  name: string;
}

function ExecutionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowIdFromUrl = searchParams.get('workflowId');
  
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>(workflowIdFromUrl || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 加载工作流列表
  const loadWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows?limit=100');
      const data = await res.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
    }
  };

  // 加载执行日志
  const loadExecutions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWorkflow !== 'all') {
        params.set('workflowId', selectedWorkflow);
      }
      params.set('page', String(currentPage));
      params.set('limit', '20');
      params.set('action', 'executions');
      
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const res = await fetch(`/api/workflows?${params.toString()}`);
      const data = await res.json();

      if (data.executions) {
        setExecutions(data.executions);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('加载执行日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  useEffect(() => {
    loadExecutions();
  }, [selectedWorkflow, statusFilter, currentPage]);

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 格式化耗时
  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // 状态配置
  const STATUS_CONFIG = {
    running: { label: '运行中', color: 'bg-blue-100 text-blue-600', icon: Loader2, animate: true },
    success: { label: '成功', color: 'bg-green-100 text-green-600', icon: CheckCircle, animate: false },
    failed: { label: '失败', color: 'bg-red-100 text-red-600', icon: XCircle, animate: false },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-600', icon: Clock, animate: false },
  };

  // 查看详情
  const handleViewDetail = (execution: Execution) => {
    setSelectedExecution(execution);
    setDetailOpen(true);
  };

  // 获取工作流名称
  const getWorkflowName = (workflowId: string) => {
    const wf = workflows.find(w => w.id === workflowId);
    return wf?.name || workflowId;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/workflows')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            执行日志
          </h1>
          <p className="text-muted-foreground">查看工作流的执行历史记录</p>
        </div>
      </div>

      {/* 筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="选择工作流" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部工作流</SelectItem>
                {workflows.map((wf) => (
                  <SelectItem key={wf.id} value={wf.id}>
                    {wf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="running">运行中</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 执行日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            执行记录
          </CardTitle>
          <CardDescription>共 {executions.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无执行记录</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">工作流</TableHead>
                    <TableHead className="w-[100px]">触发方式</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="w-[180px]">开始时间</TableHead>
                    <TableHead className="w-[100px]">耗时</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec) => {
                    const config = STATUS_CONFIG[exec.status] || STATUS_CONFIG.running;
                    const StatusIcon = config.icon;
                    
                    return (
                      <TableRow key={exec.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={() => handleViewDetail(exec)}>
                          <div className="flex items-center gap-2">
                            <Workflow className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium truncate max-w-[150px]">
                              {getWorkflowName(exec.workflow_id)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {exec.trigger_type === 'schedule' && <Clock className="h-3 w-3 mr-1" />}
                            {exec.trigger_type === 'event' && <Zap className="h-3 w-3 mr-1" />}
                            {exec.trigger_type === 'manual' && <Play className="h-3 w-3 mr-1" />}
                            {exec.trigger_type === 'schedule' ? '定时' :
                             exec.trigger_type === 'event' ? '事件' : '手动'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <StatusIcon className={`h-3 w-3 mr-1 ${config.animate ? 'animate-spin' : ''}`} />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(exec.started_at)}
                        </TableCell>
                        <TableCell>
                          {formatDuration(exec.duration_ms)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(exec)}
                          >
                            详情
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    第 {currentPage} / {totalPages} 页
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 执行详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>执行详情</DialogTitle>
            <DialogDescription>
              工作流执行详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">工作流</Label>
                  <p className="font-medium">{getWorkflowName(selectedExecution.workflow_id)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div>
                    {(() => {
                      const config = STATUS_CONFIG[selectedExecution.status];
                      const StatusIcon = config.icon;
                      return (
                        <Badge className={config.color}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${config.animate ? 'animate-spin' : ''}`} />
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">触发方式</Label>
                  <p>{selectedExecution.trigger_type === 'schedule' ? '定时执行' :
                      selectedExecution.trigger_type === 'event' ? '事件触发' : '手动触发'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">耗时</Label>
                  <p>{formatDuration(selectedExecution.duration_ms)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">开始时间</Label>
                  <p>{formatTime(selectedExecution.started_at)}</p>
                </div>
                {selectedExecution.completed_at && (
                  <div>
                    <Label className="text-muted-foreground">完成时间</Label>
                    <p>{formatTime(selectedExecution.completed_at)}</p>
                  </div>
                )}
              </div>

              {/* 触发来源 */}
              {selectedExecution.trigger_source && (
                <div>
                  <Label className="text-muted-foreground">触发来源</Label>
                  <p className="p-2 bg-muted rounded mt-1">{selectedExecution.trigger_source}</p>
                </div>
              )}

              {/* 错误信息 */}
              {selectedExecution.error_message && (
                <div>
                  <Label className="text-red-600">错误信息</Label>
                  <p className="p-3 bg-red-50 border border-red-200 rounded mt-1 text-red-700 text-sm">
                    {selectedExecution.error_message}
                  </p>
                </div>
              )}

              {/* 节点执行详情 */}
              {selectedExecution.node_executions && (
                <div>
                  <Label className="text-muted-foreground">节点执行详情</Label>
                  <div className="p-3 bg-muted rounded mt-1 space-y-2">
                    {(() => {
                      try {
                        const nodes = JSON.parse(selectedExecution.node_executions);
                        return nodes.map((node: { nodeId: string; label: string; status: string; duration?: number }, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={node.status === 'success' ? 'bg-green-50' : 'bg-red-50'}>
                                {node.status === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {node.status}
                              </Badge>
                              <span>{node.label}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{node.duration}ms</span>
                          </div>
                        ));
                      } catch {
                        return <p className="text-sm text-muted-foreground">无法解析节点执行详情</p>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* 输出数据 */}
              {selectedExecution.output_data && (
                <div>
                  <Label className="text-muted-foreground">输出数据</Label>
                  <pre className="p-3 bg-muted rounded mt-1 text-xs overflow-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedExecution.output_data), null, 2);
                      } catch {
                        return selectedExecution.output_data;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}

export default function ExecutionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <ExecutionsPageContent />
    </Suspense>
  );
}
