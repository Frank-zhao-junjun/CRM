'use client';

import { useState } from 'react';
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
import { Plus, Search, DollarSign, Building2, Calendar } from 'lucide-react';
import { OpportunityStage } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
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

const stageLabels: Record<OpportunityStage, { label: string; className: string }> = {
  lead: { label: '线索', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  qualified: { label: 'qualified', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  proposal: { label: '提案', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  negotiation: { label: '谈判', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  closed_won: { label: '成交', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  closed_lost: { label: '失败', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function OpportunitiesPage() {
  const router = useRouter();
  const { opportunities, deleteOpportunity } = useCRM();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(search.toLowerCase()) ||
      opp.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'all' || opp.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteOpportunity(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索机会..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="筛选阶段" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部阶段</SelectItem>
              <SelectItem value="lead">线索</SelectItem>
              <SelectItem value="qualified">qualified</SelectItem>
              <SelectItem value="proposal">提案</SelectItem>
              <SelectItem value="negotiation">谈判</SelectItem>
              <SelectItem value="closed_won">成交</SelectItem>
              <SelectItem value="closed_lost">失败</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => router.push('/opportunities/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新建机会
        </Button>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>机会名称</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>阶段</TableHead>
                <TableHead>概率</TableHead>
                <TableHead>预计成交</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无销售机会数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredOpportunities.map((opp) => (
                  <TableRow 
                    key={opp.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/opportunities/${opp.id}`)}
                  >
                    <TableCell className="font-medium">{opp.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {opp.customerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ¥{opp.value.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(stageLabels[opp.stage].className)}>
                        {stageLabels[opp.stage].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{opp.probability}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(opp.expectedCloseDate), 'yyyy/MM/dd', { locale: zhCN })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredOpportunities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              暂无销售机会数据
            </CardContent>
          </Card>
        ) : (
          filteredOpportunities.map((opp) => (
            <Card 
              key={opp.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/opportunities/${opp.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{opp.title}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {opp.customerName}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn(stageLabels[opp.stage].className)}>
                    {stageLabels[opp.stage].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    ¥{opp.value.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(opp.expectedCloseDate), 'MM/dd', { locale: zhCN })}
                  </div>
                  <span>{opp.probability}%</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个销售机会吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
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
