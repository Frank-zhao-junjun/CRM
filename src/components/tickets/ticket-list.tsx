'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Ticket,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  User,
  Building2,
  ArrowUpDown,
} from 'lucide-react';

// 类型定义
interface TicketData {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  customer_id: string;
  customer?: {
    id: string;
    name: string;
    company: string;
  };
  type: 'inquiry' | 'technical' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  assignee_id?: string;
  assignee_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TicketStats {
  pending: number;
  processing: number;
  todayNew: number;
  todayResolved: number;
}

interface TicketListProps {
  onCreateTicket?: () => void;
}

// 状态配置
const STATUS_CONFIG = {
  pending: { label: '待处理', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  processing: { label: '处理中', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: RotateCcw },
  resolved: { label: '已解决', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  closed: { label: '已关闭', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: AlertCircle },
};

// 优先级配置
const PRIORITY_CONFIG = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-600' },
};

// 类型配置
const TYPE_CONFIG = {
  inquiry: { label: '问题咨询', color: 'bg-purple-100 text-purple-600' },
  technical: { label: '技术故障', color: 'bg-red-100 text-red-600' },
  complaint: { label: '投诉建议', color: 'bg-orange-100 text-orange-600' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-600' },
};

export function TicketList({ onCreateTicket }: TicketListProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载数据
  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('page', String(currentPage));
      params.set('limit', '10');

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();

      if (data.tickets) {
        setTickets(data.tickets);
      }
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('加载工单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, typeFilter, currentPage]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 删除工单
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadTickets();
      }
    } catch (error) {
      console.error('删除工单失败:', error);
    }
    setDeleteDialogOpen(false);
    setTicketToDelete(null);
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (hours < 48) return '昨天';
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">处理中</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.processing || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日新增</CardTitle>
            <Plus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.todayNew || 0}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日解决</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.todayResolved || 0}</div>
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
                placeholder="搜索工单编号、标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="urgent">紧急</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="inquiry">问题咨询</SelectItem>
                <SelectItem value="technical">技术故障</SelectItem>
                <SelectItem value="complaint">投诉建议</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onCreateTicket}>
              <Plus className="h-4 w-4 mr-2" />
              新建工单
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 工单列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            工单列表
          </CardTitle>
          <CardDescription>共 {tickets.length} 条工单</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无工单</p>
              <Button variant="outline" className="mt-4" onClick={onCreateTicket}>
                <Plus className="h-4 w-4 mr-2" />
                创建第一个工单
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">工单编号</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead className="w-[120px]">客户</TableHead>
                    <TableHead className="w-[100px]">类型</TableHead>
                    <TableHead className="w-[80px]">优先级</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="w-[100px]">处理人</TableHead>
                    <TableHead className="w-[100px]">创建时间</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => {
                    const StatusIcon = STATUS_CONFIG[ticket.status]?.icon || Clock;
                    return (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell 
                          className="font-medium"
                          onClick={() => router.push(`/tickets/${ticket.id}`)}
                        >
                          {ticket.ticket_number}
                        </TableCell>
                        <TableCell 
                          className="max-w-[250px] truncate"
                          onClick={() => router.push(`/tickets/${ticket.id}`)}
                        >
                          {ticket.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">
                              {ticket.customer?.name || '未知'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={TYPE_CONFIG[ticket.type]?.color}>
                            {TYPE_CONFIG[ticket.type]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={PRIORITY_CONFIG[ticket.priority]?.color}>
                            {PRIORITY_CONFIG[ticket.priority]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_CONFIG[ticket.status]?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[ticket.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.assignee_name ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[80px]">{ticket.assignee_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">未分配</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(ticket.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/tickets/${ticket.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/tickets/${ticket.id}?edit=true`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  setTicketToDelete(ticket.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
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
              确定要删除这个工单吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => ticketToDelete && handleDelete(ticketToDelete)}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
