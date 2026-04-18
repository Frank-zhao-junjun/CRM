-- Products 表迁移脚本
-- 创建时间: 2026-04-20
-- 说明: 产品管理模块持久化

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50),
  cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  image_url VARCHAR(500),
  specifications JSONB DEFAULT '{}',
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(sku);
CREATE INDEX IF NOT EXISTS products_is_active_idx ON products(is_active);

-- RLS 策略
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许所有用户读取产品" ON products
  FOR SELECT USING (true);

CREATE POLICY "允许所有用户管理产品" ON products
  FOR ALL USING (true);

-- 注释
COMMENT ON TABLE products IS '产品表 - 存储产品基本信息';
COMMENT ON COLUMN products.specifications IS '产品规格 JSON';
