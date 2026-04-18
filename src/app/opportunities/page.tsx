'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, DollarSign, Building2, Calendar, Briefcase, ChevronRight, Trash2, TrendingUp, Clock, LayoutGrid, Download, FileSpreadsheet, Sparkles, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { OpportunityStage } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import { QuickFollowUp } from '@/components/crm/quick-follow-up';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { OpportunityPredictionEngine } from '@/lib/opportunity-prediction-engine';
import { QuickProbability, ProbabilityBadge } from '@/components/crm/prediction-components';
import { getPredictionColorClass } from '@/lib/opportunity-prediction-types';

async function handleExport(format: 'csv' | 'xlsx') {
  try {
    const response = await fetch(`/api/export?type=opportunities&format=${format}`);
    if (!response.ok) { const error = await response.json(); throw new Error(error.error || '导出失败'); }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `opportunities_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) { alert(`导出失败: ${(error as Error).message}`); }
}

const stageConfig: Record<OpportunityStage, { label: string; className: string; gradient: string; color: string }> = {
  // 注意: lead 阶段已移除，销售线索在独立页面管理
  qualified: { 
    label: '商机确认', 
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    gradient: 'from-blue-400 to-cyan-500',
    color: 'text-blue-600 dark:text-blue-400'
  },
  discovery: { 
    label: '需求调研', 
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    gradient: 'from-sky-400 to-blue-500',
    color: 'text-sky-600 dark:text-sky-400'
  },
  proposal: { 
    label: '方案报价', 
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    gradient: 'from-purple-400 to-pink-500',
    color: 'text-purple-600 dark:text-purple-400'
  },
  negotiation: { 
    label: '商务洽谈', 
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    gradient: 'from-orange-400 to-amber-500',
    color: 'text-orange-600 dark:text-orange-400'
  },
  contract: { 
    label: '合同签署', 
    className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    gradient: 'from-teal-400 to-emerald-500',
    color: 'text-teal-600 dark:text-teal-400'
  },
  closed_won: { 
    label: '成交', 
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    gradient: 'from-green-400 to-emerald-500',
    color: 'text-green-600 dark:text-green-400'
  },
  closed_lost: { 
    label: '失败', 
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    gradient: 'from-red-400 to-rose-500',
    color: 'text-red-600 dark:text-red-400'
  },
};

function StageIcon({ stage, className }: { stage: OpportunityStage; className?: string }) {
  const config = stageConfig[stage];
  return (
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      "bg-gradient-to-br shadow-lg",
      config.gradient,
      className
    )}>
      <Briefcase className="h-5 w-5 text-white" />
    </div>
  );
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const { opportunities, deleteOpportunity } = useCRM();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [probabilityFilter, setProbabilityFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'probability', direction: 'desc' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [quickFollowUp, setQuickFollowUp] = useState<{ open: boolean; entityId: string; entityName: string }>({
    open: false, entityId: '', entityName: '',
  });

  // 创建预测引擎
  const predictionEngine = useMemo(() => new OpportunityPredictionEngine(), []);

  // 计算所有商机的 AI 预测概率
  const opportunitiesWithPredictions = useMemo(() => {
    return opportunities.map(opp => {
      const prediction = predictionEngine.calculatePrediction(opp);
      return {
        ...opp,
        aiProbability: prediction.probability,
        aiLevel: prediction.level,
      };
    });
  }, [opportunities, predictionEngine]);

  // 筛选和排序
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunitiesWithPredictions.filter(opp => {
      const matchesSearch = 
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === 'all' || opp.stage === stageFilter;
      
      // 概率筛选
      let matchesProbability = true;
      if (probabilityFilter === 'high') {
        matchesProbability = opp.aiProbability >= 70;
      } else if (probabilityFilter === 'medium') {
        matchesProbability = opp.aiProbability >= 40 && opp.aiProbability < 70;
      } else if (probabilityFilter === 'low') {
        matchesProbability = opp.aiProbability < 40;
      }
      
      return matchesSearch && matchesStage && matchesProbability;
    });

    // 排序
    filtered.sort((a, b) => {
      if (sortConfig.key === 'probability') {
        return sortConfig.direction === 'desc' 
          ? b.aiProbability - a.aiProbability 
          : a.aiProbability - b.aiProbability;
      }
      if (sortConfig.key === 'value') {
        return sortConfig.direction === 'desc' 
          ? b.value - a.value 
          : a.value - b.value;
      }
      if (sortConfig.key === 'title') {
        return sortConfig.direction === 'desc'
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [opportunitiesWithPredictions, search, stageFilter, probabilityFilter, sortConfig]);

  // 统计预测分布
  const predictionStats = useMemo(() => {
    const high = opportunitiesWithPredictions.filter(o => o.aiProbability >= 70).length;
    const medium = opportunitiesWithPredictions.filter(o => o.aiProbability >= 40 && o.aiProbability < 70).length;
    const low = opportunitiesWithPredictions.filter(o => o.aiProbability < 40).length;
    return { high, medium, low, total: opportunitiesWithPredictions.length };
  }, [opportunitiesWithPredictions]);

  // 排序切换
  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // 获取排序图标
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-3 w-3" />;
    return sortConfig.direction === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />;
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteOpportunity(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 rounded-3xl -z-10" />
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">商机</h1>
            <p className="text-muted-foreground mt-1">
              共 {filteredOpportunities.length} 个商机，总价值 ¥{filteredOpportunities.reduce((sum, o) => sum + o.value, 0).toLocaleString()}
            </p>
            {/* AI 预测概览 */}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400 font-medium">高概率: {predictionStats.high}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">中概率: {predictionStats.medium}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 dark:text-gray-400 font-medium">低概率: {predictionStats.low}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/opportunities/new')}
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              新建机会
            </Button>
            <Link href="/opportunities/kanban">
              <Button variant="outline" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                看板视图
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Filters */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索商机名称或客户..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/50"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11">
                <SelectValue placeholder="筛选阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                <SelectItem value="qualified">商机确认</SelectItem>
                <SelectItem value="discovery">需求调研</SelectItem>
                <SelectItem value="proposal">方案报价</SelectItem>
                <SelectItem value="negotiation">商务洽谈</SelectItem>
                <SelectItem value="contract">合同签署</SelectItem>
                <SelectItem value="closed_won">成交</SelectItem>
                <SelectItem value="closed_lost">失败</SelectItem>
              </SelectContent>
            </Select>
            {/* AI 概率筛选器 */}
            <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11">
                <SelectValue placeholder="成交概率" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部概率</SelectItem>
                <SelectItem value="high">高概率 (≥70%)</SelectItem>
                <SelectItem value="medium">中概率 (40-69%)</SelectItem>
                <SelectItem value="low">低概率 (<40%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden md:block card-hover">
        <CardContent className="p-0">
          {filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center mb-4">
                <Briefcase className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">暂无商机</h3>
              <p className="text-sm text-muted-foreground mb-4">开始创建你的第一个商机</p>
              <Button 
                onClick={() => router.push('/opportunities/new')}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500"
              >
                <Plus className="h-4 w-4" />
                新建机会
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('title')}>
                    <div className="flex items-center gap-1">
                      商机
                      {getSortIcon('title')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">客户</TableHead>
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('value')}>
                    <div className="flex items-center gap-1">
                      金额
                      {getSortIcon('value')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">阶段</TableHead>
                  <TableHead className="font-semibold cursor-pointer hover:bg-muted/50 w-[200px]" onClick={() => toggleSort('probability')}>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-green-600" />
                      AI 预测
                      {getSortIcon('probability')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">预计成交</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities.map((opp, index) => {
                  const stage = stageConfig[opp.stage];
                  const probabilityColor = getPredictionColorClass(opp.aiProbability);
                  return (
                    <TableRow 
                      key={opp.id}
                      className={cn(
                        "group cursor-pointer transition-all duration-200",
                        "hover:bg-accent/50"
                      )}
                      onClick={() => router.push(`/opportunities/${opp.id}`)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StageIcon stage={opp.stage} />
                          <span className="font-medium group-hover:text-primary transition-colors">
                            {opp.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {opp.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                            ¥{opp.value.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(stage.className)}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            "bg-gradient-to-r",
                            stage.gradient
                          )} />
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <ProbabilityBadge probability={opp.aiProbability} size="sm" />
                            </div>
                            <span className={cn("text-sm font-medium", probabilityColor)}>
                              {opp.aiProbability}%
                            </span>
                          </div>
                          <Progress 
                            value={opp.aiProbability} 
                            className={cn(
                              "h-2",
                              "[&>div]:bg-gradient-to-r",
                              opp.aiProbability >= 70 ? "[&>div]:from-green-400 [&>div]:to-emerald-500" :
                              opp.aiProbability >= 40 ? "[&>div]:from-yellow-400 [&>div]:to-amber-500" :
                              "[&>div]:from-gray-400 [&>div]:to-gray-500"
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {opp.expectedCloseDate ? (
                            format(new Date(opp.expectedCloseDate), 'yyyy/MM/dd', { locale: zhCN })
                          ) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickFollowUp({ open: true, entityId: opp.id, entityName: opp.title });
                            }}
                          >
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(opp.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredOpportunities.length === 0 ? (
          <Card className="card-hover">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">暂无商机数据</p>
              <Button 
                onClick={() => router.push('/opportunities/new')}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500"
              >
                <Plus className="h-4 w-4" />
                新建机会
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredOpportunities.map((opp, index) => {
            const stage = stageConfig[opp.stage];
            const probabilityColor = getPredictionColorClass(opp.aiProbability);
            return (
              <Card 
                key={opp.id}
                className={cn(
                  "cursor-pointer card-hover",
                  "animate-in slide-in-from-bottom-2",
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => router.push(`/opportunities/${opp.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <StageIcon stage={opp.stage} className="w-12 h-12" />
                      <div>
                        <h3 className="font-semibold">{opp.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {opp.customerName}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(stage.className)}>
                      {stage.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-foreground">¥{opp.value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-sm">
                          {opp.expectedCloseDate ? (
                            format(new Date(opp.expectedCloseDate), 'MM/dd', { locale: zhCN })
                          ) : '未设置'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-green-600" />
                          <span className="font-medium">AI 预测</span>
                        </div>
                        <span className={cn("font-medium", probabilityColor)}>成交概率 {opp.aiProbability}%</span>
                      </div>
                      <Progress 
                        value={opp.aiProbability} 
                        className={cn(
                          "h-2",
                          "[&>div]:bg-gradient-to-r",
                          opp.aiProbability >= 70 ? "[&>div]:from-green-400 [&>div]:to-emerald-500" :
                          opp.aiProbability >= 40 ? "[&>div]:from-yellow-400 [&>div]:to-amber-500" :
                          "[&>div]:from-gray-400 [&>div]:to-gray-500"
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>预计成交</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              确认删除商机
            </DialogTitle>
            <DialogDescription>
              确定要删除这个商机吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 快捷跟进对话框 */}
      <QuickFollowUp
        open={quickFollowUp.open}
        onOpenChange={(open) => setQuickFollowUp(prev => ({ ...prev, open }))}
        entityType="opportunity"
        entityId={quickFollowUp.entityId}
        entityName={quickFollowUp.entityName}
      />
    </div>
  );
}
