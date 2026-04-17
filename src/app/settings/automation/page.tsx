'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Plus,
  RefreshCw,
  BarChart3,
  Play,
  History,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings2,
} from 'lucide-react';
import { RuleList, TemplateCard } from '@/components/automation/rule-list';
import { RuleEditor } from '@/components/automation/rule-editor';
import { RuleConfig, RULE_TEMPLATES } from '@/lib/automation-engine';
import type { RuleTemplate } from '@/lib/automation-engine';

// 规则数据接口
interface RuleData extends RuleConfig {
  id: string;
  is_enabled: boolean;
  trigger_count: number;
  last_triggered_at?: string;
  is_system?: boolean;
  created_at: string;
}

// 统计数据接口
interface RuleStats {
  total_rules: number;
  enabled_rules: number;
  total_triggers: number;
  rules: Array<{
    id: string;
    name: string;
    trigger_count: number;
    last_triggered_at?: string;
    is_enabled: boolean;
  }>;
}

export default function AutomationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RuleData[]>([]);
  const [stats, setStats] = useState<RuleStats | null>(null);
  const [logs, setLogs] = useState<Array<{
    id: string;
    rule_id: string;
    entity_id?: string;
    entity_type: string;
    entity_name?: string;
    action_type: string;
    status: string;
    created_at: string;
    automation_rules?: { name: string };
  }>>([]);
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<(RuleData) | undefined>();
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载
      const [rulesRes, statsRes, logsRes] = await Promise.all([
        fetch('/api/automation'),
        fetch('/api/automation?action=stats'),
        fetch('/api/automation?action=logs'),
      ]);

      const rulesData = await rulesRes.json();
      const statsData = await statsRes.json();
      const logsData = await logsRes.json();

      if (rulesData.success) {
        setRules(rulesData.data || []);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }
      if (logsData.success) {
        setLogs(logsData.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      // 使用模拟数据
      setStats({
        total_rules: 5,
        enabled_rules: 3,
        total_triggers: 156,
        rules: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 创建规则
  const handleCreateRule = () => {
    setEditingRule(undefined);
    setEditorMode('create');
    setEditorOpen(true);
  };

  // 编辑规则
  const handleEditRule = (rule: RuleConfig & { id: string }) => {
    setEditingRule(rule as RuleData);
    setEditorMode('edit');
    setEditorOpen(true);
  };

  // 保存规则
  const handleSaveRule = async (rule: RuleConfig) => {
    try {
      const url = editorMode === 'create' 
        ? '/api/automation' 
        : `/api/automation?id=${editingRule?.id}`;
      
      const method = editorMode === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('保存规则失败:', error);
    }
  };

  // 删除规则
  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/automation?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('删除规则失败:', error);
    }
  };

  // 切换规则状态
  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/automation?id=${id}&toggle=${enabled ? 'enable' : 'disable'}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('切换规则状态失败:', error);
    }
  };

  // 复制规则
  const handleDuplicateRule = async (rule: RuleConfig) => {
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, name: `${rule.name} (副本)` }),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('复制规则失败:', error);
    }
  };

  // 使用模板
  const handleUseTemplate = async (template: RuleTemplate) => {
    try {
      const res = await fetch(`/api/automation?templateId=${template.id}`);
      const data = await res.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('使用模板失败:', error);
    }
  };

  // 查看统计
  const handleViewStats = (ruleId: string) => {
    // TODO: 实现统计详情弹窗
    console.log('查看统计:', ruleId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载自动化规则...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings2 className="h-8 w-8 text-primary" />
            自动化规则引擎
          </h1>
          <p className="text-muted-foreground mt-1">
            设置自动化规则，自动执行任务和发送通知
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="h-4 w-4 mr-2" />
          创建规则
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总规则数</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_rules || rules.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已启用</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.enabled_rules || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计触发</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_triggers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月触发</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 规则列表和模板 */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rules">
            <Zap className="h-4 w-4 mr-2" />
            规则列表
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Plus className="h-4 w-4 mr-2" />
            预设模板
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            执行日志
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules">
          <RuleList
            rules={rules}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            onToggle={handleToggleRule}
            onDuplicate={handleDuplicateRule}
            onViewStats={handleViewStats}
          />
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {RULE_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>执行日志</CardTitle>
              <CardDescription>最近50条规则执行记录</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  暂无执行日志
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">
                            {log.automation_rules?.name || '规则'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.action_type === 'create_task' && '创建任务'}
                            {log.action_type === 'send_notification' && '发送通知'}
                            {log.action_type === 'update_field' && '更新字段'}
                            {' - '}
                            {log.entity_type}: {log.entity_name || log.entity_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status === 'success' ? '成功' : '失败'}
                        </Badge>
                        <Clock className="h-4 w-4" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 规则编辑器 */}
      <RuleEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveRule}
        initialRule={editingRule}
        mode={editorMode}
      />
    </div>
  );
}
