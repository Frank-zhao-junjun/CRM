-- US-06 工作流自动化兼容字段补齐
-- 兼容当前 API/UI 使用的 workflows 字段命名

ALTER TABLE workflows
  ADD COLUMN IF NOT EXISTS trigger_entity VARCHAR(50),
  ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- 兼容旧字段 execution_count -> run_count（仅在 run_count 仍为0时回填）
UPDATE workflows
SET run_count = execution_count
WHERE run_count = 0
  AND execution_count IS NOT NULL;

CREATE INDEX IF NOT EXISTS workflows_trigger_entity_idx ON workflows(trigger_entity);
CREATE INDEX IF NOT EXISTS workflows_last_run_at_idx ON workflows(last_run_at);
