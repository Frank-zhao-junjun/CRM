-- AI 线索评分功能 (V4.2)
-- 为线索表添加评分相关字段

-- 1. 为 leads 表添加评分字段
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_level TEXT CHECK (score_level IN ('hot', 'warm', 'cold'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_details JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP WITH TIME ZONE;

-- 2. 创建评分配置表
CREATE TABLE IF NOT EXISTS lead_scoring_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    weights JSONB NOT NULL DEFAULT '[]',
    company_size_rules JSONB NOT NULL DEFAULT '[]',
    industry_rules JSONB NOT NULL DEFAULT '[]',
    source_rules JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建评分历史记录表（用于追踪评分变化）
CREATE TABLE IF NOT EXISTS lead_score_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    score_level TEXT NOT NULL CHECK (score_level IN ('hot', 'warm', 'cold')),
    score_details JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_leads_score_level ON leads(score_level);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_lead_id ON lead_score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_calculated_at ON lead_score_history(calculated_at);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_config_is_default ON lead_scoring_config(is_default);

-- 4. 插入默认评分配置
INSERT INTO lead_scoring_config (name, description, weights, company_size_rules, industry_rules, source_rules, is_default)
VALUES (
    '默认评分配置',
    '适用于一般销售场景的线索评分配置',
    '[
        {"dimension": "company_size", "weight": 20, "isActive": true},
        {"dimension": "industry_match", "weight": 20, "isActive": true},
        {"dimension": "source_quality", "weight": 25, "isActive": true},
        {"dimension": "engagement_level", "weight": 15, "isActive": true},
        {"dimension": "estimated_value", "weight": 10, "isActive": true},
        {"dimension": "contact_complete", "weight": 10, "isActive": true}
    ]'::jsonb,
    '[
        {"range": "1-50", "minEmployees": 1, "maxEmployees": 50, "score": 30, "label": "小微企业"},
        {"range": "51-200", "minEmployees": 51, "maxEmployees": 200, "score": 50, "label": "中小企业"},
        {"range": "201-1000", "minEmployees": 201, "maxEmployees": 1000, "score": 80, "label": "中大型企业"},
        {"range": "1000+", "minEmployees": 1001, "maxEmployees": null, "score": 100, "label": "大型企业"}
    ]'::jsonb,
    '[
        {"industry": "科技", "isTargetIndustry": true, "score": 90},
        {"industry": "金融", "isTargetIndustry": true, "score": 85},
        {"industry": "医疗", "isTargetIndustry": true, "score": 85},
        {"industry": "教育", "isTargetIndustry": true, "score": 80},
        {"industry": "制造业", "isTargetIndustry": false, "score": 70},
        {"industry": "零售", "isTargetIndustry": false, "score": 60},
        {"industry": "其他", "isTargetIndustry": false, "score": 50}
    ]'::jsonb,
    '[
        {"source": "referral", "quality": "high", "score": 95},
        {"source": "event", "quality": "high", "score": 85},
        {"source": "website", "quality": "medium", "score": 70},
        {"source": "advertisement", "quality": "medium", "score": 60},
        {"source": "cold_call", "quality": "low", "score": 40},
        {"source": "other", "quality": "low", "score": 30}
    ]'::jsonb,
    true
) ON CONFLICT DO NOTHING;

-- 5. 开启 RLS
ALTER TABLE lead_scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY;

-- 6. 创建策略：所有用户可读写
CREATE POLICY "Allow all access to lead_scoring_config" ON lead_scoring_config 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to lead_score_history" ON lead_score_history 
    FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为 lead_scoring_config 表创建触发器
DROP TRIGGER IF EXISTS update_lead_scoring_config_updated_at ON lead_scoring_config;
CREATE TRIGGER update_lead_scoring_config_updated_at
    BEFORE UPDATE ON lead_scoring_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建定时任务函数（用于每日重新计算所有线索评分）
CREATE OR REPLACE FUNCTION recalculate_all_lead_scores()
RETURNS void AS $$
DECLARE
    lead_record RECORD;
    customer_record RECORD;
    contact_record RECORD;
    score_result JSONB;
BEGIN
    FOR lead_record IN SELECT * FROM leads LOOP
        -- 获取客户信息
        SELECT * INTO customer_record FROM customers WHERE id = lead_record.customer_id;
        
        -- 计算评分（这里简化处理，实际应该在应用层计算）
        score_result := jsonb_build_object(
            'totalScore', 50,
            'level', 'warm',
            'lastCalculatedAt', NOW()::text
        );
        
        -- 更新线索评分
        UPDATE leads 
        SET ai_score = (score_result->>'totalScore')::integer,
            score_level = score_result->>'level',
            score_details = score_result,
            last_scored_at = NOW()
        WHERE id = lead_record.id;
        
        -- 记录评分历史
        INSERT INTO lead_score_history (lead_id, score, score_level, score_details)
        VALUES (
            lead_record.id,
            (score_result->>'totalScore')::integer,
            score_result->>'level',
            score_result
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_all_lead_scores() IS '重新计算所有线索的AI评分';
