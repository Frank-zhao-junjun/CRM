'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Ticket,
  ArrowLeft,
  Building2,
  User,
  Clock,
  Send,
  CheckCircle,
  RotateCcw,
  XCircle,
  MessageSquare,
  History,
  Edit,
  AlertCircle,
  Loader2,
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
    email?: string;
    phone?: string;
  };
  type: 'inquiry' | 'technical' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  assignee_id?: string;
  assignee_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  comments?: TicketComment[];
  activities?: Activity[];
}

interface TicketComment {
  id: string;
  ticket_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_type: 'staff' | 'customer';
  is_internal: boolean;
  created_at: string;
}

interface Activity {
  id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  description: string;
  timestamp: string;
}

interface TicketDetailProps {
  ticketId: string;
}

// 状态配置
const STATUS_CONFIG = {
  pending: { label: '待处理', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', nextActions: ['processing'] },
  processing: { label: '处理中', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', nextActions: ['resolved'] },
  resolved: { label: '已解决', color: 'bg-green-500/10 text-green-600 border-green-500/20', nextActions: ['closed', 'processing'] },
  closed: { label: '已关闭', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', nextActions: ['processing'] },
};

const PRIORITY_CONFIG = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-600' },
  high: { label: '高', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: '紧急', color: 'bg-red-100 text-red-600' },
};

const TYPE_CONFIG = {
  inquiry: { label: '问题咨询', color: 'bg-purple-100 text-purple-600' },
  technical: { label: '技术故障', color: 'bg-red-100 text-red-600' },
  complaint: { label: '投诉建议', color: 'bg-orange-100 text-orange-600' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-600' },
};

const NEXT_STATUS_LABELS: Record<string, string> = {
  processing: '开始处理',
  resolved: '标记为已解决',
  closed: '关闭工单',
};

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activities'>('comments');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 加载工单详情
  const loadTicket = async () => {
    try {
      const res = await fetch(`/api/tickets?id=${ticketId}`);
      const data = await res.json();
      
      if (data.id) {
        setTicket(data);
      }
    } catch (error) {
      console.error('加载工单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  // 自动滚动到底部
  useEffect(() => {
    if (activeTab === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.comments?.length, activeTab]);

  // 提交回复
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addComment',
          data: {
            content: replyContent.trim(),
            authorId: 'staff',
            authorName: '客服人员',
            authorType: 'staff',
          },
        }),
      });
      
      const data = await res.json();
      
      if (data.id) {
        setReplyContent('');
        await loadTicket();
      }
    } catch (error) {
      console.error('提交回复失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 变更状态
  const handleChangeStatus = async () => {
    if (!targetStatus) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changeStatus',
          data: { status: targetStatus },
        }),
      });
      
      const data = await res.json();
      
      if (data.id) {
        setStatusDialogOpen(false);
        await loadTicket();
      }
    } catch (error) {
      console.error('变更状态失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">工单不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/tickets')}>
          返回工单列表
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[ticket.status];

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/tickets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="h-6 w-6" />
              {ticket.ticket_number}
            </h1>
            <p className="text-muted-foreground">{ticket.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={statusConfig.color} variant="outline">
            {statusConfig.label}
          </Badge>
          <Badge className={PRIORITY_CONFIG[ticket.priority]?.color}>
            {PRIORITY_CONFIG[ticket.priority]?.label}
          </Badge>
          
          {/* 状态变更按钮 */}
          {statusConfig.nextActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => {
                setTargetStatus(action);
                setStatusDialogOpen(true);
              }}
            >
              {action === 'processing' && <RotateCcw className="h-4 w-4 mr-1" />}
              {action === 'resolved' && <CheckCircle className="h-4 w-4 mr-1" />}
              {action === 'closed' && <XCircle className="h-4 w-4 mr-1" />}
              {NEXT_STATUS_LABELS[action]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：工单详情 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>工单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">工单类型</Label>
                  <div className="mt-1">
                    <Badge className={TYPE_CONFIG[ticket.type]?.color}>
                      {TYPE_CONFIG[ticket.type]?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">优先级</Label>
                  <div className="mt-1">
                    <Badge className={PRIORITY_CONFIG[ticket.priority]?.color}>
                      {PRIORITY_CONFIG[ticket.priority]?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">处理人</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {ticket.assignee_name || '未分配'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">创建时间</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatTime(ticket.created_at)}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">工单描述</Label>
                <p className="mt-1 p-3 bg-muted/50 rounded-lg">{ticket.description}</p>
              </div>
              
              {ticket.resolved_at && (
                <div>
                  <Label className="text-muted-foreground">解决时间</Label>
                  <p className="mt-1">{formatTime(ticket.resolved_at)}</p>
                </div>
              )}
              
              {ticket.closed_at && (
                <div>
                  <Label className="text-muted-foreground">关闭时间</Label>
                  <p className="mt-1">{formatTime(ticket.closed_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 沟通记录和活动 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  沟通记录
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === 'comments' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('comments')}
                  >
                    回复
                  </Button>
                  <Button
                    variant={activeTab === 'activities' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('activities')}
                  >
                    活动
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'comments' ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {ticket.comments && ticket.comments.length > 0 ? (
                    ticket.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg ${
                          comment.author_type === 'staff'
                            ? 'bg-blue-50 border border-blue-100 ml-8'
                            : 'bg-gray-50 border border-gray-100 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={comment.author_type === 'staff' ? 'bg-blue-100' : 'bg-gray-100'}>
                              {comment.author_type === 'staff' ? '客服' : '客户'}
                            </Badge>
                            <span className="font-medium">{comment.author_name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      暂无沟通记录
                    </p>
                  )}
                  <div ref={commentsEndRef} />
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {ticket.activities && ticket.activities.length > 0 ? (
                    ticket.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <History className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <p>{activity.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      暂无活动记录
                    </p>
                  )}
                </div>
              )}

              {/* 回复输入框 */}
              {ticket.status !== 'closed' && (
                <div className="mt-4 pt-4 border-t">
                  <Textarea
                    placeholder="输入回复内容..."
                    rows={3}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button onClick={handleSubmitReply} disabled={!replyContent.trim() || submitting}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      发送
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：客户信息 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                关联客户
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.customer ? (
                <>
                  <div>
                    <Label className="text-muted-foreground">客户名称</Label>
                    <p className="font-medium">{ticket.customer.name}</p>
                  </div>
                  {ticket.customer.company && (
                    <div>
                      <Label className="text-muted-foreground">公司</Label>
                      <p>{ticket.customer.company}</p>
                    </div>
                  )}
                  {ticket.customer.email && (
                    <div>
                      <Label className="text-muted-foreground">邮箱</Label>
                      <p>{ticket.customer.email}</p>
                    </div>
                  )}
                  {ticket.customer.phone && (
                    <div>
                      <Label className="text-muted-foreground">电话</Label>
                      <p>{ticket.customer.phone}</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-2" asChild>
                    <Link href={`/customers/${ticket.customer_id}`}>
                      查看客户详情
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">客户信息不可用</p>
              )}
            </CardContent>
          </Card>

          {/* 时间线 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                时间线
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">创建工单</p>
                    <p className="text-sm text-muted-foreground">{formatTime(ticket.created_at)}</p>
                  </div>
                </div>
                
                {ticket.resolved_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="font-medium text-green-600">已解决</p>
                      <p className="text-sm text-muted-foreground">{formatTime(ticket.resolved_at)}</p>
                    </div>
                  </div>
                )}
                
                {ticket.closed_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-gray-400" />
                    <div>
                      <p className="font-medium text-gray-600">已关闭</p>
                      <p className="text-sm text-muted-foreground">{formatTime(ticket.closed_at)}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="font-medium">最后更新</p>
                    <p className="text-sm text-muted-foreground">{formatTime(ticket.updated_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 状态变更确认对话框 */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认变更状态</DialogTitle>
            <DialogDescription>
              确定要将工单状态变更为"{STATUS_CONFIG[targetStatus as keyof typeof STATUS_CONFIG]?.label}"吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleChangeStatus} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
