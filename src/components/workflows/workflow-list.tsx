'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Workflow,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  FileCode,
  Copy,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// 类型定义
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
}

interface WorkflowStats {
  total: number;
  active: number;
  successRate: number;
  todayExecutions: number;
}

interface WorkflowListProps {
  onCreateWorkflow?: () => void;
  onEditWorkflow?: (id: string) => void;
}

// 触发类型配置
const TRIGGER_CONFIG = {
  schedule: { label: '定时执行', icon: Clock, color: 'bg-blue-100 text-blue-600' },
  event: { label: '事件触发', icon: Zap, color: 'bg-purple-100 text-purple-600' },
  manual: { label: '手动触发', icon: Play, color: 'bg-green-100 text-green-600' },
};

export function WorkflowList({ onCreateWorkflow, onEditWorkflow }: WorkflowListProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(currentPage));
      params.set('limit', '10');
      params.set('includeStats', 'true');

      const res = await fetch(`/api/workflows?${params.toString()}`);
      const data = await res.json();

      if (data.workflows) {
        setWorkflows(data.workflows);
      }
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('加载工作流失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, currentPage]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 切换启用状态
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          data: { enabled },
        }),
      });
      await loadData();
    } catch (error) {
      console.error('切换状态失败:', error);
    }
  };

  // 执行工作流
  const handleExecute = async (id: string) => {
    setExecutingId(id);
    try {
      await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
        }),
      });
      await loadData();
    } catch (error) {
      console.error('执行工作流失败:', error);
    } finally {
      setExecutingId(null);
    }
  };

  // 删除工作流
  const handleDelete = async () => {
    if (!workflowToDelete) return;
    try {
      const res = await fetch(`/api/workflows/${workflowToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('删除工作流失败:', error);
    }
    setDeleteDialogOpen(false);
    setWorkflowToDelete(null);
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 计算成功率
  const getSuccessRate = (wf: WorkflowData) => {
    if (wf.execution_count === 0) return 100;
    return Math.round((wf.success_count / wf.execution_count) * 100);
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总工作流</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已启用</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.successRate || 100}%</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日执行</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.todayExecutions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索工作流名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="active">已启用</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              新建工作流
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 工作流列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            工作流列表
          </CardTitle>
          <CardDescription>共 {workflows.length} 个工作流</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无工作流</p>
              <Button variant="outline" className="mt-4" onClick={onCreateWorkflow}>
                <Plus className="h-4 w-4 mr-2" />
                创建第一个工作流
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead className="w-[120px]">触发类型</TableHead>
                    <TableHead className="w-[100px]">执行次数</TableHead>
                    <TableHead className="w-[100px]">成功率</TableHead>
                    <TableHead className="w-[100px]">最近执行</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((wf) => {
                    const triggerInfo = TRIGGER_CONFIG[wf.trigger_type as keyof typeof TRIGGER_CONFIG] || TRIGGER_CONFIG.manual;
                    const TriggerIcon = triggerInfo.icon;
                    const successRate = getSuccessRate(wf);
                    
                    return (
                      <TableRow key={wf.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell 
                          onClick={() => router.push(`/workflows/${wf.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Workflow className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {wf.name}
                                {wf.is_system && (
                                  <Badge variant="outline" className="text-xs">预设</Badge>
                                )}
                              </div>
                              {wf.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {wf.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={triggerInfo.color}>
                            <TriggerIcon className="h-3 w-3 mr-1" />
                            {triggerInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <span className="font-medium">{wf.execution_count}</span>
                            <span className="text-muted-foreground text-sm"> 次</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-center font-medium ${
                            successRate >= 90 ? 'text-green-600' :
                            successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {successRate}%
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {wf.last_executed_at ? formatTime(wf.last_executed_at) : '从未'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={wf.is_active}
                              onCheckedChange={(checked) => handleToggle(wf.id, checked)}
                              disabled={wf.is_system}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={executingId === wf.id}>
                                {executingId === wf.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/workflows/${wf.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExecute(wf.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                立即执行
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEditWorkflow?.(wf.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              {!wf.is_system && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => {
                                      setWorkflowToDelete(wf.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    删除
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个工作流吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
