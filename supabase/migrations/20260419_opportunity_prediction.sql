-- AI 商机预测功能 (V5.2)
-- 为 opportunities 表添加预测相关字段

-- 1. 为 opportunities 表添加预测字段
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ai_probability INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS prediction_level TEXT CHECK (prediction_level IN ('high', 'medium', 'low'));
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS prediction_details JSONB;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_predicted_at TIMESTAMP WITH TIME ZONE;

-- 2. 创建商机预测配置表
CREATE TABLE IF NOT EXISTS opportunity_prediction_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    weights JSONB NOT NULL DEFAULT '[]',
    stage_probabilities JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建预测历史记录表（用于追踪预测变化）
CREATE TABLE IF NOT EXISTS opportunity_prediction_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    probability INTEGER NOT NULL,
    prediction_level TEXT NOT NULL CHECK (prediction_level IN ('high', 'medium', 'low')),
    prediction_details JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_opportunities_ai_probability ON opportunities(ai_probability);
CREATE INDEX IF NOT EXISTS idx_opportunities_prediction_level ON opportunities(prediction_level);
CREATE INDEX IF NOT EXISTS idx_opportunity_prediction_history_opportunity_id ON opportunity_prediction_history(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_prediction_history_calculated_at ON opportunity_prediction_history(calculated_at);
CREATE INDEX IF NOT EXISTS idx_opportunity_prediction_config_is_default ON opportunity_prediction_config(is_default);

-- 4. 插入默认预测配置
INSERT INTO opportunity_prediction_config (name, description, weights, stage_probabilities, is_default)
VALUES (
    '默认预测配置',
    '适用于一般销售场景的商机预测配置',
    '[
        {"dimension": "stage", "weight": 30, "isActive": true},
        {"dimension": "amount", "weight": 15, "isActive": true},
        {"dimension": "customer_history", "weight": 20, "isActive": true},
        {"dimension": "competition", "weight": 15, "isActive": true},
        {"dimension": "engagement", "weight": 10, "isActive": true},
        {"dimension": "timeline", "weight": 10, "isActive": true}
    ]'::jsonb,
    '[
        {"stage": "qualified", "baseProbability": 10, "label": "商机确认"},
        {"stage": "discovery", "baseProbability": 30, "label": "需求调研"},
        {"stage": "proposal", "baseProbability": 50, "label": "方案报价"},
        {"stage": "negotiation", "baseProbability": 70, "label": "商务洽谈"},
        {"stage": "contract", "baseProbability": 90, "label": "合同签署"},
        {"stage": "closed_won", "baseProbability": 100, "label": "成交"},
        {"stage": "closed_lost", "baseProbability": 0, "label": "失败"}
    ]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- 5. 开启 RLS
ALTER TABLE opportunity_prediction_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_prediction_history ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略：所有用户可读写
CREATE POLICY "Allow all access to opportunity_prediction_config" ON opportunity_prediction_config 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to opportunity_prediction_history" ON opportunity_prediction_history 
    FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为 opportunity_prediction_config 表创建触发器
DROP TRIGGER IF EXISTS update_opportunity_prediction_config_updated_at ON opportunity_prediction_config;
CREATE TRIGGER update_opportunity_prediction_config_updated_at
    BEFORE UPDATE ON opportunity_prediction_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建函数：根据阶段计算基础概率
CREATE OR REPLACE FUNCTION get_stage_base_probability(p_stage TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_probability INTEGER;
BEGIN
    CASE p_stage
        WHEN 'qualified' THEN v_probability := 10;
        WHEN 'discovery' THEN v_probability := 30;
        WHEN 'proposal' THEN v_probability := 50;
        WHEN 'negotiation' THEN v_probability := 70;
        WHEN 'contract' THEN v_probability := 90;
        WHEN 'closed_won' THEN v_probability := 100;
        WHEN 'closed_lost' THEN v_probability := 0;
        ELSE v_probability := 50;
    END CASE;
    RETURN v_probability;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建函数：计算商机 AI 预测
CREATE OR REPLACE FUNCTION calculate_opportunity_prediction(p_opportunity_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_opportunity RECORD;
    v_probability INTEGER;
    v_level TEXT;
    v_details JSONB;
BEGIN
    -- 获取商机信息
    SELECT * INTO v_opportunity FROM opportunities WHERE id = p_opportunity_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- 根据阶段计算基础概率
    v_probability := get_stage_base_probability(v_opportunity.stage);
    
    -- 根据金额调整概率（大额降低，小额提高）
    IF v_opportunity.value < 50000 THEN
        v_probability := v_probability + 5;
    ELSIF v_opportunity.value > 5000000 THEN
        v_probability := v_probability - 10;
    ELSIF v_opportunity.value > 1000000 THEN
        v_probability := v_probability - 5;
    END IF;
    
    -- 确保概率在 0-100 范围内
    v_probability := GREATEST(0, LEAST(100, v_probability));
    
    -- 确定预测级别
    IF v_probability >= 70 THEN
        v_level := 'high';
    ELSIF v_probability >= 40 THEN
        v_level := 'medium';
    ELSE
        v_level := 'low';
    END IF;
    
    -- 构建预测详情
    v_details := jsonb_build_object(
        'stageScore', get_stage_base_probability(v_opportunity.stage),
        'amountAdjustment', CASE 
            WHEN v_opportunity.value < 50000 THEN 5
            WHEN v_opportunity.value > 5000000 THEN -10
            WHEN v_opportunity.value > 1000000 THEN -5
            ELSE 0
        END,
        'finalProbability', v_probability,
        'calculatedAt', NOW()::text
    );
    
    RETURN jsonb_build_object(
        'probability', v_probability,
        'level', v_level,
        'details', v_details
    );
END;
$$ LANGUAGE plpgsql;

-- 11. 创建定时任务函数（用于批量重新计算所有商机预测）
CREATE OR REPLACE FUNCTION recalculate_all_opportunity_predictions()
RETURNS void AS $$
DECLARE
    opp_record RECORD;
    prediction_result JSONB;
BEGIN
    FOR opp_record IN SELECT id FROM opportunities LOOP
        -- 计算预测
        prediction_result := calculate_opportunity_prediction(opp_record.id);
        
        IF prediction_result IS NOT NULL THEN
            -- 更新商机预测字段
            UPDATE opportunities 
            SET ai_probability = (prediction_result->>'probability')::integer,
                prediction_level = prediction_result->>'level',
                prediction_details = prediction_result->'details',
                last_predicted_at = NOW()
            WHERE id = opp_record.id;
            
            -- 记录预测历史
            INSERT INTO opportunity_prediction_history (
                opportunity_id, 
                probability, 
                prediction_level, 
                prediction_details
            )
            VALUES (
                opp_record.id,
                (prediction_result->>'probability')::integer,
                prediction_result->>'level',
                prediction_result->'details'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_all_opportunity_predictions() IS '重新计算所有商机的AI预测';

-- 12. 创建视图：商机预测汇总
CREATE OR REPLACE VIEW opportunity_prediction_summary AS
SELECT 
    o.id,
    o.title,
    o.customer_id,
    o.stage,
    o.value,
    o.ai_probability,
    o.prediction_level,
    ROUND(o.value * COALESCE(o.ai_probability, 0) / 100.0, 2) AS weighted_value,
    o.last_predicted_at,
    CASE 
        WHEN o.ai_probability >= 70 THEN '高概率'
        WHEN o.ai_probability >= 40 THEN '中概率'
        ELSE '低概率'
    END AS prediction_label,
    CASE 
        WHEN o.ai_probability >= 70 THEN '恭喜！这个商机成交可能性很高'
        WHEN o.ai_probability >= 40 THEN '这个商机需要继续培育和跟进'
        ELSE '建议暂缓或重新评估此商机'
    END AS recommendation
FROM opportunities o
WHERE o.stage NOT IN ('closed_won', 'closed_lost');

COMMENT ON VIEW opportunity_prediction_summary IS '商机预测汇总视图';

-- 13. 创建视图：预测仪表盘数据
CREATE OR REPLACE VIEW prediction_dashboard AS
SELECT 
    COUNT(*) AS total_opportunities,
    COUNT(*) FILTER (WHERE ai_probability >= 70) AS high_probability_count,
    COUNT(*) FILTER (WHERE ai_probability >= 40 AND ai_probability < 70) AS medium_probability_count,
    COUNT(*) FILTER (WHERE ai_probability < 40) AS low_probability_count,
    ROUND(AVG(ai_probability), 1) AS average_probability,
    SUM(value) AS total_pipeline_value,
    ROUND(SUM(value * COALESCE(ai_probability, 0) / 100.0), 2) AS weighted_pipeline_value,
    SUM(value) FILTER (WHERE ai_probability >= 70) AS best_case_value
FROM opportunities
WHERE stage NOT IN ('closed_won', 'closed_lost');

COMMENT ON VIEW prediction_dashboard IS '预测仪表盘数据视图';
