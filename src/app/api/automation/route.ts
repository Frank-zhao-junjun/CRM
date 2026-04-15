import { NextRequest, NextResponse } from 'next/server';
import { PRESET_RULES, type AutomationRule, type AutomationStats, type AutomationExecution } from '@/lib/automation-types';

// 模拟数据存储
let automationRules: AutomationRule[] = PRESET_RULES.map((rule, index) => ({
  id: `rule_${Date.now()}_${index}`,
  ...rule,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

let executions: AutomationExecution[] = [];

// GET - 获取自动化规则列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  let filtered = [...automationRules];

  if (type) {
    filtered = filtered.filter(r => r.applicableTo === type || r.applicableTo === 'all');
  }

  if (isActive !== null) {
    filtered = filtered.filter(r => r.isActive === (isActive === 'true'));
  }

  // 获取统计数据
  const stats: AutomationStats = {
    totalRules: automationRules.length,
    activeRules: automationRules.filter(r => r.isActive).length,
    executionsToday: executions.filter(e => {
      const today = new Date().toDateString();
      return new Date(e.executedAt).toDateString() === today;
    }).length,
    executionsThisWeek: executions.filter(e => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(e.executedAt) > weekAgo;
    }).length,
    successRate: executions.length > 0
      ? Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100)
      : 100,
  };

  return NextResponse.json({
    rules: filtered,
    stats,
    executions: executions.slice(-50).reverse(),
  });
}

// POST - 创建/更新自动化规则
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rule } = body;

    if (action === 'create') {
      const newRule: AutomationRule = {
        id: `rule_${Date.now()}`,
        ...rule,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      automationRules.push(newRule);
      return NextResponse.json({ success: true, rule: newRule });
    }

    if (action === 'update') {
      const index = automationRules.findIndex(r => r.id === rule.id);
      if (index >= 0) {
        automationRules[index] = {
          ...automationRules[index],
          ...rule,
          updatedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, rule: automationRules[index] });
      }
      return NextResponse.json({ success: false, error: '规则不存在' }, { status: 404 });
    }

    if (action === 'toggle') {
      const { ruleId, isActive } = body;
      const index = automationRules.findIndex(r => r.id === ruleId);
      if (index >= 0) {
        automationRules[index].isActive = isActive;
        automationRules[index].updatedAt = new Date().toISOString();
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: false, error: '规则不存在' }, { status: 404 });
    }

    if (action === 'delete') {
      const { ruleId } = body;
      automationRules = automationRules.filter(r => r.id !== ruleId);
      return NextResponse.json({ success: true });
    }

    if (action === 'apply-preset') {
      const { presetIndex } = body;
      if (PRESET_RULES[presetIndex]) {
        const newRule: AutomationRule = {
          id: `rule_${Date.now()}`,
          ...PRESET_RULES[presetIndex],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        automationRules.push(newRule);
        return NextResponse.json({ success: true, rule: newRule });
      }
      return NextResponse.json({ success: false, error: '预设不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: '请求解析失败' }, { status: 400 });
  }
}
