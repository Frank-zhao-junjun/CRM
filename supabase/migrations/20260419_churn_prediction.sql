-- 流失预警模块数据库迁移
-- 创建日期: 2026-04-19
-- 功能: 客户流失风险评估与预警

-- ============================================
-- 1. 添加客户流失风险字段到 customers 表
-- ============================================

-- 添加流失风险分数字段
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS churn_risk_score INTEGER DEFAULT 0;

-- 添加流失风险等级字段
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS churn_risk_level VARCHAR(20) DEFAULT 'low';

-- 添加流失风险详情JSON字段
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS churn_risk_details JSONB DEFAULT '[]'::jsonb;

-- 添加流失风险更新时间
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS churn_risk_updated_at TIMESTAMPTZ;

-- 添加风险上升检测字段（用于检测风险变化）
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS churn_risk_previous_score INTEGER DEFAULT 0;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk_level ON customers(churn_risk_level);
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk_score ON customers(churn_risk_score);
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk_updated ON customers(churn_risk_updated_at);

-- ============================================
-- 2. 创建流失预警配置表
-- ============================================

CREATE TABLE IF NOT EXISTS churn_prediction_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL DEFAULT 'default',
    
    -- 阈值配置
    high_risk_threshold INTEGER NOT NULL DEFAULT 70,
    medium_risk_threshold INTEGER NOT NULL DEFAULT 40,
    
    -- 维度配置 (JSON)
    dimension_configs JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- 预警规则
    enable_auto_alert BOOLEAN NOT NULL DEFAULT true,
    alert_on_high_risk BOOLEAN NOT NULL DEFAULT true,
    alert_on_risk_increase BOOLEAN NOT NULL DEFAULT true,
    risk_increase_threshold INTEGER NOT NULL DEFAULT 15,
    
    -- 元数据
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO churn_prediction_config (
    name,
    high_risk_threshold,
    medium_risk_threshold,
    dimension_configs,
    enable_auto_alert,
    alert_on_high_risk,
    alert_on_risk_increase,
    risk_increase_threshold,
    is_active
) VALUES (
    'default',
    70,
    40,
    '[
        {
            "dimension": "last_interaction",
            "label": "最近互动时间",
            "description": "根据与客户的最后互动时间评估",
            "maxScore": 100,
            "weight": 25,
            "isActive": true
        },
        {
            "dimension": "order_frequency",
            "label": "订单频率",
            "description": "根据最近订单时间评估",
            "maxScore": 100,
            "weight": 20,
            "isActive": true
        },
        {
            "dimension": "opportunity_conversion",
            "label": "商机转化率",
            "description": "根据商机转化情况评估",
            "maxScore": 100,
            "weight": 15,
            "isActive": true
        },
        {
            "dimension": "contract_expiry",
            "label": "合同到期",
            "description": "根据合同到期时间评估",
            "maxScore": 100,
            "weight": 20,
            "isActive": true
        },
        {
            "dimension": "activity_level",
            "label": "客户活跃度",
            "description": "根据客户活跃情况评估",
            "maxScore": 100,
            "weight": 20,
            "isActive": true
        }
    ]'::jsonb,
    true,
    true,
    true,
    15,
    true
) ON CONFLICT (name) WHERE name = 'default' DO NOTHING;

-- ============================================
-- 3. 创建流失预警表
-- ============================================

CREATE TABLE IF NOT EXISTS churn_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 关联客户
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    
    -- 预警信息
    alert_type VARCHAR(50) NOT NULL,  -- high_risk, contract_expiring, no_activity, risk_increase
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- 风险信息
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    
    -- 状态
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    
    -- 预警来源
    source VARCHAR(50),  -- auto, manual
    
    -- 元数据
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    dismissed_by UUID
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_churn_alerts_customer ON churn_alerts(customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_alerts_risk_level ON churn_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_alerts_is_read ON churn_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_churn_alerts_created ON churn_alerts(created_at DESC);

-- ============================================
-- 4. 创建流失风险计算历史表
-- ============================================

CREATE TABLE IF NOT EXISTS churn_risk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 客户信息
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- 风险详情
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    risk_details JSONB NOT NULL,
    
    -- 计算上下文摘要
    last_interaction_days INTEGER,
    last_order_days INTEGER,
    opportunity_count INTEGER,
    opportunity_conversion_rate DECIMAL(5,2),
    contract_days_to_expiry INTEGER,
    activity_days INTEGER,
    
    -- 元数据
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_churn_risk_history_customer ON churn_risk_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_history_calculated ON churn_risk_history(calculated_at DESC);

-- ============================================
-- 5. 创建RLS策略 (Row Level Security)
-- ============================================

-- 流失预警表RLS
ALTER TABLE churn_alerts ENABLE ROW LEVEL SECURITY;

-- 创建策略: 用户只能看到自己客户的预警
CREATE POLICY churn_alerts_select ON churn_alerts
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM customers 
            WHERE owner_id = auth.uid() OR assigned_to = auth.uid()
        )
    );

-- 创建策略: 只有风险升高时自动插入
CREATE POLICY churn_alerts_insert ON churn_alerts
    FOR INSERT
    TO authenticated
    WITH CHECK (source = 'auto');

-- 创建策略: 可以标记已读
CREATE POLICY churn_alerts_update ON churn_alerts
    FOR UPDATE
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM customers 
            WHERE owner_id = auth.uid() OR assigned_to = auth.uid()
        )
    );

-- 流失预警配置表RLS (仅管理员可修改)
ALTER TABLE churn_prediction_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY churn_prediction_config_view ON churn_prediction_config
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- ============================================
-- 6. 创建触发器函数
-- ============================================

-- 当客户风险分数变化时，记录历史
CREATE OR REPLACE FUNCTION record_churn_risk_history()
RETURNS TRIGGER AS $$
BEGIN
    -- 记录历史
    INSERT INTO churn_risk_history (
        customer_id,
        risk_score,
        risk_level,
        risk_details,
        calculated_at
    ) VALUES (
        NEW.id,
        NEW.churn_risk_score,
        NEW.churn_risk_level,
        NEW.churn_risk_details,
        NOW()
    );
    
    -- 如果风险升高，生成预警
    IF NEW.churn_risk_score > COALESCE(NEW.churn_risk_previous_score, 0) + 15 THEN
        INSERT INTO churn_alerts (
            customer_id,
            customer_name,
            alert_type,
            title,
            message,
            risk_score,
            risk_level,
            source
        ) VALUES (
            NEW.id,
            NEW.name,
            CASE 
                WHEN NEW.churn_risk_level = 'high' THEN 'high_risk'
                ELSE 'risk_increase'
            END,
            NEW.name || ' 流失风险升高',
            NEW.name || ' 的流失风险评分从 ' || COALESCE(NEW.churn_risk_previous_score, 0) || ' 上升到 ' || NEW.churn_risk_score || ' 分',
            NEW.churn_risk_score,
            NEW.churn_risk_level,
            'auto'
        );
    END IF;
    
    -- 更新前一个分数
    NEW.churn_risk_previous_score = COALESCE(NEW.churn_risk_previous_score, NEW.churn_risk_score);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_record_churn_risk ON customers;
CREATE TRIGGER trigger_record_churn_risk
    AFTER UPDATE OF churn_risk_score ON customers
    FOR EACH ROW
    EXECUTE FUNCTION record_churn_risk_history();

-- ============================================
-- 7. 创建定期计算函数 (供 cron 调用)
-- ============================================

CREATE OR REPLACE FUNCTION calculate_all_churn_risks()
RETURNS void AS $$
DECLARE
    customer_row RECORD;
BEGIN
    FOR customer_row IN SELECT id, name FROM customers LOOP
        -- 这里会调用风险评估引擎
        -- 实际实现在应用层进行，这里只记录日志
        RAISE NOTICE 'Calculating churn risk for customer: %', customer_row.name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. 注释说明
-- ============================================

COMMENT ON TABLE churn_prediction_config IS '流失预警配置表，存储风险评估规则和阈值';
COMMENT ON TABLE churn_alerts IS '流失预警表，存储生成的流失风险预警';
COMMENT ON TABLE churn_risk_history IS '流失风险历史记录表，用于追踪风险变化趋势';

COMMENT ON COLUMN customers.churn_risk_score IS '客户流失风险分数 (0-100)';
COMMENT ON COLUMN customers.churn_risk_level IS '客户流失风险等级 (high/medium/low)';
COMMENT ON COLUMN customers.churn_risk_details IS '客户流失风险详情 (JSON格式)';
COMMENT ON COLUMN customers.churn_risk_updated_at IS '流失风险最后更新时间';
