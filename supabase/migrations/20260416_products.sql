-- 产品管理表 (US-10: 产品持久化补齐)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware', 'service', 'consulting', 'other')),
    description TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT '件',
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to products" ON products FOR ALL USING (true) WITH CHECK (true);
