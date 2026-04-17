'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Briefcase,
  TrendingUp,
  Clock,
  AlertTriangle,
  UserPlus,
  Zap,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  TRIGGER_TYPE_CONFIG,
  ENTITY_TYPE_CONFIG,
  ACTION_TYPE_CONFIG,
  RuleConfig,
} from '@/lib/automation-engine';
import type { RuleTemplate } from '@/lib/automation-engine';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  TrendingUp,
  Clock,
  AlertTriangle,
  UserPlus,
  Zap,
};

interface RuleListProps {
  rules: Array<RuleConfig & {
    id: string;
    is_enabled: boolean;
    trigger_count: number;
    last_triggered_at?: string;
    is_system?: boolean;
    created_at: string;
  }>;
  onEdit: (rule: RuleConfig & { id: string }) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDuplicate: (rule: RuleConfig) => void;
  onViewStats: (id: string) => void;
}

export function RuleList({
  rules,
  onEdit,
  onDelete,
  onToggle,
  onDuplicate,
  onViewStats,
}: RuleListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setRuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      onDelete(ruleToDelete);
      setRuleToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无自动化规则</h3>
            <p className="text-muted-foreground mb-4">
              创建您的第一条自动化规则，或从预设模板中选择
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => {
        const triggerConfig = TRIGGER_TYPE_CONFIG[rule.trigger_type];
        const entityConfig = ENTITY_TYPE_CONFIG[rule.entity_type];
        
        return (
          <Card 
            key={rule.id} 
            className={`transition-opacity ${!rule.is_enabled ? 'opacity-60' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${triggerConfig.color}20` }}
                  >
                    <RefreshCw 
                      className="h-5 w-5" 
                      style={{ color: triggerConfig.color }} 
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">{rule.name}</CardTitle>
                    {rule.description && (
                      <CardDescription className="mt-1">
                        {rule.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rule.is_system && (
                    <Badge variant="secondary" className="text-xs">
                      系统预设
                    </Badge>
                  )}
                  <Switch
                    checked={rule.is_enabled}
                    onCheckedChange={(checked) => onToggle(rule.id, checked)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(rule)}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewStats(rule.id)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        统计
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                        <Copy className="h-4 w-4 mr-2" />
                        复制
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(rule.id)}
                        className="text-red-600 dark:text-red-400"
                        disabled={rule.is_system}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {triggerConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {entityConfig.label}
                </Badge>
                {rule.conditions.map((condition, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {condition.field} {condition.operator} {condition.value}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>触发 {rule.trigger_count} 次</span>
                  </div>
                  {rule.last_triggered_at && (
                    <div className="text-muted-foreground">
                      上次: {new Date(rule.last_triggered_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {rule.actions.map((action, idx) => {
                    const actionConfig = ACTION_TYPE_CONFIG[action.type];
                    const Icon = actionConfig ? 
                      { 'create_task': CheckSquare, 'send_notification': Bell, 'update_field': Edit }[action.type] || Zap
                      : Zap;
                    return (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Icon className="h-3 w-3 mr-1" />
                        {actionConfig?.label || action.type}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条自动化规则吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 导入缺失的图标
import { CheckSquare, Bell } from 'lucide-react';

// 预设模板卡片
interface TemplateCardProps {
  template: RuleTemplate;
  onUse: (template: RuleTemplate) => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const Icon = ICON_MAP[template.icon] || Zap;

  return (
    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onUse(template)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm">{template.name}</CardTitle>
            <Badge variant="secondary" className="text-xs mt-1">
              {template.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </CardContent>
    </Card>
  );
}
