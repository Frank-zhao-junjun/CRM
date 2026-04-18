'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSignature, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Contract {
  id: string;
  contract_number: string;
  status: 'draft' | 'executing' | 'completed' | 'terminated';
  amount: number;
  effective_date?: string;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
}

const CONTRACT_STATUS_CONFIG: Record<string, { label: string; className: string; color: string }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  executing: { label: '执行中', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  completed: { label: '已完成', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  terminated: { label: '已终止', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
};

interface CustomerContractsCardProps {
  customerId: string;
  className?: string;
}

export function CustomerContractsCard({ customerId, className }: CustomerContractsCardProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm?type=contracts&customerId=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setContracts(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
            <FileSignature className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          合同
          {contracts.length > 0 && (
            <Badge variant="secondary" className="ml-1">{contracts.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/contracts/new?customerId=${customerId}`}>
            添加
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-8">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无合同</p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <Link href={`/contracts/new?customerId=${customerId}`}>
                创建合同
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.slice(0, 5).map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{contract.contract_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {contract.expiration_date 
                      ? `有效期至 ${format(new Date(contract.expiration_date), 'yyyy/MM/dd', { locale: zhCN })}`
                      : format(new Date(contract.created_at), 'yyyy/MM/dd', { locale: zhCN })
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge variant="outline" className={cn('text-xs', CONTRACT_STATUS_CONFIG[contract.status]?.className)}>
                    {CONTRACT_STATUS_CONFIG[contract.status]?.label || contract.status}
                  </Badge>
                  <p className="font-medium text-sm whitespace-nowrap">
                    ¥{Number(contract.amount).toLocaleString()}
                  </p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {contracts.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/contracts?customerId=${customerId}`}>
                  查看全部 {contracts.length} 个合同
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
