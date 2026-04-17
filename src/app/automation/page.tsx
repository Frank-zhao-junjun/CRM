'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Play, Pause, Trash2, Settings, 
  BarChart3, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Filter, RefreshCw, Eye
} from 'lucide-react';
import { 
  TRIGGER_LABELS, ACTION_LABELS, PRESET_RULES,
  type AutomationRule, type AutomationStats, type AutomationExecution,
  type AutomationTriggerType, type AutomationActionType
} from '@/lib/automation-types';

// 触发器图标映射
const TRIGGER_ICONS: Record<AutomationTriggerType, string> = {
  stage_change: '🔄',
  lead_created: '✨',
  lead_status_change: '📋',
  opportunity_created: '💼',
  follow_up_overdue: '⏰',
  no_activity_days: '📭',
  contract_expiring: '📄',
  quote_sent: '📧',
  quote_accepted: '✅',
  order_created: '🛒',
};

// 动作图标映射
const ACTION_ICONS: Record<AutomationActionType, string> = {
  create_task: '📝',
  send_email: '📧',
  create_follow_up: '📞',
  update_status: '🔧',
  add_tag: '🏷️',
  send_notification: '🔔',
  assign_owner: '👤',
};

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'executions' | 'presets'>('rules');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automation');
      const data = await res.json();
      setRules(data.rules || []);
      setStats(data.stats || null);
      setExecutions(data.executions || []);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    await fetch('/api/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', ruleId, isActive }),
    });
    fetchData();
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这条规则吗？')) return;
    await fetch('/api/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ruleId }),
    });
    fetchData();
  };

  const applyPreset = async (presetIndex: number) => {
    await fetch('/api/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply-preset', presetIndex }),
    });
    fetchData();
    setActiveTab('rules');
  };

  const filteredRules = filterType === 'all' 
    ? rules 
    : rules.filter(r => r.applicableTo === filterType || r.applicableTo === 'all');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              销售流程自动化
            </h1>
            <p className="text-sm text-gray-500">自动化执行销售流程，告别重复性工作</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">自动化规则</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRules}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              {stats.activeRules} 条规则启用中
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日执行</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.executionsToday}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">本周共 {stats.executionsThisWeek} 次</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本周执行</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.executionsThisWeek}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">自动化任务执行</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">执行成功率</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">本周执行统计</p>
          </div>
        </div>
      )}

      {/* 标签页 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            自动化规则 ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'executions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            执行记录
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            快速添加预设
          </button>
        </div>
      </div>

      {/* 规则列表 */}
      {activeTab === 'rules' && (
        <>
          {/* 筛选器 */}
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
            >
              <option value="all">全部类型</option>
              <option value="lead">线索</option>
              <option value="opportunity">商机</option>
              <option value="contract">合同</option>
            </select>
          </div>

          {/* 规则卡片 */}
          <div className="space-y-4">
            {filteredRules.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Zap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">暂无自动化规则</p>
                <p className="text-sm text-gray-400 mt-1">从预设模板快速添加</p>
                <button
                  onClick={() => setActiveTab('presets')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  查看预设模板
                </button>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
                    rule.isActive
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-300 dark:border-gray-600 opacity-60'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{TRIGGER_ICONS[rule.trigger.type]}</span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            rule.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {rule.isActive ? '已启用' : '已停用'}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {rule.applicableTo === 'all' ? '通用' : rule.applicableTo === 'lead' ? '线索' : rule.applicableTo === 'opportunity' ? '商机' : '合同'}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                        )}
                        
                        {/* 触发器和动作 */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="text-gray-400">当</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                            {TRIGGER_LABELS[rule.trigger.type]}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-400">执行</span>
                          {rule.actions.map((action, idx) => (
                            <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                              <span>{ACTION_ICONS[action.type]}</span>
                              {ACTION_LABELS[action.type]}
                              {action.config.taskTitle && ` (${action.config.taskTitle})`}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleRule(rule.id, !rule.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            rule.isActive
                              ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                              : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                          title={rule.isActive ? '暂停' : '启用'}
                        >
                          {rule.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 执行记录 */}
      {activeTab === 'executions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">最近执行记录</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {executions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无执行记录</p>
              </div>
            ) : (
              executions.slice(0, 20).map((exec) => (
                <div key={exec.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      exec.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                      exec.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                      {exec.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : exec.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {exec.ruleName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {exec.entityType} · {exec.entityName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(exec.executedAt).toLocaleString('zh-CN')}
                    </p>
                    {exec.error && (
                      <p className="text-xs text-red-500 mt-1">{exec.error}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 预设模板 */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_RULES.map((preset, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{preset.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{preset.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                  {TRIGGER_LABELS[preset.trigger.type]}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {preset.actions.map((action, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                    {ACTION_LABELS[action.type]}
                  </span>
                ))}
              </div>

              <button
                onClick={() => applyPreset(index)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加此规则
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
