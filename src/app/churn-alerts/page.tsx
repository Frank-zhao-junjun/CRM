'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Phone,
  Mail,
  MoreHorizontal,
  Bell,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { ChurnRiskLevel, CHURN_RISK_CONFIG, ChurnAlert } from '@/lib/churn-prediction-types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PageWrapper } from '@/components/crm/page-wrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChurnRiskDisplay, ChurnRiskMini } from '@/components/crm/churn-risk-display';

export default function ChurnAlertsPage() {
  const [alerts, setAlerts] = useState<ChurnAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState<ChurnRiskLevel | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = 10;

  // 加载预警列表
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (riskLevelFilter !== 'all') {
        params.append('riskLevel', riskLevelFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`/api/churn/alerts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setTotal(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
      }
    } catch (err) {
      console.error('获取流失预警失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, riskLevelFilter, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // 标记预警已读
  const markAsRead = async (alertId: string) => {
    try {
      const res = await fetch(`/api/churn/alerts/${alertId}/read`, {
        method: 'POST',
      });
      if (res.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ));
      }
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  // 忽略预警
  const dismissAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/churn/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        setTotal(prev => prev - 1);
      }
    } catch (err) {
      console.error('忽略预警失败:', err);
    }
  };

  // 统计数据
  const highRiskCount = alerts.filter(a => a.riskLevel === 'high').length;
  const mediumRiskCount = alerts.filter(a => a.riskLevel === 'medium').length;
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">流失预警</h1>
              <p className="text-muted-foreground text-sm">
                及时发现高流失风险客户，主动干预降低流失率
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/churn-alerts/config">
                <Settings className="w-4 h-4 mr-2" />
                配置
              </Link>
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-sm text-muted-foreground">预警总数</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</div>
              <p className="text-sm text-muted-foreground">高风险客户</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{mediumRiskCount}</div>
              <p className="text-sm text-muted-foreground">中风险客户</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unreadCount}</div>
              <p className="text-sm text-muted-foreground">未读预警</p>
            </CardContent>
          </Card>
        </div>

        {/* 筛选栏 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索客户名称..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={riskLevelFilter}
                onValueChange={(value) => {
                  setRiskLevelFilter(value as ChurnRiskLevel | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="风险等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等级</SelectItem>
                  <SelectItem value="high">高风险</SelectItem>
                  <SelectItem value="medium">中风险</SelectItem>
                  <SelectItem value="low">低风险</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 预警列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5" />
              预警列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">暂无预警信息</p>
                <p className="text-sm text-muted-foreground mt-1">
                  所有客户流失风险均在可控范围内
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">风险等级</TableHead>
                      <TableHead>客户名称</TableHead>
                      <TableHead>预警类型</TableHead>
                      <TableHead>风险分数</TableHead>
                      <TableHead>预警时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        className={!alert.isRead ? 'bg-blue-500/5' : ''}
                      >
                        <TableCell>
                          <ChurnRiskBadge level={alert.riskLevel} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!alert.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                            <span className="font-medium">{alert.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="truncate text-sm">{alert.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChurnRiskMini level={alert.riskLevel} score={alert.riskScore} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(alert.createdAt), 'yyyy/MM/dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/customers/${alert.customerId}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                查看
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/follow-ups/new?customerId=${alert.customerId}`}>
                                    <Phone className="w-4 h-4 mr-2" />
                                    快速跟进
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/customers/${alert.customerId}?action=email`}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    发送邮件
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!alert.isRead && (
                                  <DropdownMenuItem onClick={() => markAsRead(alert.id)}>
                                    标记已读
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => dismissAlert(alert.id)}
                                >
                                  忽略此预警
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)}，共 {total} 条
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">
                        第 {page} / {totalPages} 页
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

// 风险等级徽章组件
function ChurnRiskBadge({ level }: { level: ChurnRiskLevel }) {
  const config = CHURN_RISK_CONFIG[level];
  
  return (
    <Badge
      variant="outline"
      className={`${config.bgClass} ${config.borderClass} ${config.textClass}`}
    >
      {config.label}
    </Badge>
  );
}
