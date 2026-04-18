// 流失预警配置 API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 模拟配置数据
let mockConfig = {
  highRiskThreshold: 70,
  mediumRiskThreshold: 40,
  dimensionConfigs: [
    { dimension: 'last_interaction', label: '最近互动时间', description: '根据与客户的最后互动时间评估', maxScore: 100, weight: 25, isActive: true },
    { dimension: 'order_frequency', label: '订单频率', description: '根据最近订单时间评估', maxScore: 100, weight: 20, isActive: true },
    { dimension: 'opportunity_conversion', label: '商机转化率', description: '根据商机转化情况评估', maxScore: 100, weight: 15, isActive: true },
    { dimension: 'contract_expiry', label: '合同到期', description: '根据合同到期时间评估', maxScore: 100, weight: 20, isActive: true },
    { dimension: 'activity_level', label: '客户活跃度', description: '根据客户活跃情况评估', maxScore: 100, weight: 20, isActive: true },
  ],
  enableAutoAlert: true,
  alertOnHighRisk: true,
  alertOnRiskIncrease: true,
  riskIncreaseThreshold: 15,
};

// 获取配置
export async function GET() {
  try {
    // 尝试从数据库获取
    try {
      const { data, error } = await supabase
        .from('churn_prediction_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!error && data) {
        return NextResponse.json({
          config: {
            highRiskThreshold: data.high_risk_threshold,
            mediumRiskThreshold: data.medium_risk_threshold,
            dimensionConfigs: data.dimension_configs,
            enableAutoAlert: data.enable_auto_alert,
            alertOnHighRisk: data.alert_on_high_risk,
            alertOnRiskIncrease: data.alert_on_risk_increase,
            riskIncreaseThreshold: data.risk_increase_threshold,
          },
        });
      }
    } catch (dbError) {
      console.log('数据库查询失败，使用默认配置');
    }

    return NextResponse.json({ config: mockConfig });
  } catch (error) {
    console.error('获取配置失败:', error);
    return NextResponse.json({ config: mockConfig });
  }
}

// 保存配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: '配置不能为空' }, { status: 400 });
    }

    // 更新模拟配置
    mockConfig = {
      highRiskThreshold: config.highRiskThreshold || 70,
      mediumRiskThreshold: config.mediumRiskThreshold || 40,
      dimensionConfigs: config.dimensionConfigs || mockConfig.dimensionConfigs,
      enableAutoAlert: config.enableAutoAlert ?? true,
      alertOnHighRisk: config.alertOnHighRisk ?? true,
      alertOnRiskIncrease: config.alertOnRiskIncrease ?? true,
      riskIncreaseThreshold: config.riskIncreaseThreshold || 15,
    };

    // 尝试保存到数据库
    try {
      // 先检查是否存在
      const { data: existing } = await supabase
        .from('churn_prediction_config')
        .select('id')
        .eq('is_active', true)
        .single();

      if (existing) {
        await supabase
          .from('churn_prediction_config')
          .update({
            high_risk_threshold: mockConfig.highRiskThreshold,
            medium_risk_threshold: mockConfig.mediumRiskThreshold,
            dimension_configs: mockConfig.dimensionConfigs,
            enable_auto_alert: mockConfig.enableAutoAlert,
            alert_on_high_risk: mockConfig.alertOnHighRisk,
            alert_on_risk_increase: mockConfig.alertOnRiskIncrease,
            risk_increase_threshold: mockConfig.riskIncreaseThreshold,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('churn_prediction_config').insert({
          high_risk_threshold: mockConfig.highRiskThreshold,
          medium_risk_threshold: mockConfig.mediumRiskThreshold,
          dimension_configs: mockConfig.dimensionConfigs,
          enable_auto_alert: mockConfig.enableAutoAlert,
          alert_on_high_risk: mockConfig.alertOnHighRisk,
          alert_on_risk_increase: mockConfig.alertOnRiskIncrease,
          risk_increase_threshold: mockConfig.riskIncreaseThreshold,
          is_active: true,
        });
      }
    } catch (dbError) {
      console.log('数据库保存失败，使用内存存储');
    }

    return NextResponse.json({ success: true, config: mockConfig });
  } catch (error) {
    console.error('保存配置失败:', error);
    return NextResponse.json({ error: '保存配置失败' }, { status: 500 });
  }
}
