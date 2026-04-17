# CRM产品多级价格管理功能开发任务

## 项目信息
- 项目ID: 7628668399886991423
- 仓库: https://github.com/Frank-zhao-junjun/CRM
- 部署域名: https://24w4b99929.coze.site

## 任务目标
为CRM系统添加产品多级价格管理功能（V3.2）

## 功能需求

### 1. 数据模型扩展
在 src/lib/crm-types.ts 添加：

```typescript
// 产品价格等级
export type PriceLevel = 'retail' | 'wholesale' | 'agent' | 'vip';

export interface ProductPrice {
  id: string;
  productId: string;
  level: PriceLevel;
  price: number;
  minQuantity?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

// 客户等级
export type CustomerTier = 'normal' | 'silver' | 'gold' | 'vip';

export interface CustomerTierConfig {
  customerId: string;
  tier: CustomerTier;
  discountRate?: number;
  creditLimit?: number;
  paymentTerms?: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export const PRICE_LEVEL_CONFIG: Record<PriceLevel, { label: string; discount: number; color: string }> = {
  retail: { label: '零售价', discount: 0, color: 'text-gray-700' },
  wholesale: { label: '批发价', discount: 0.1, color: 'text-blue-600' },
  agent: { label: '代理价', discount: 0.2, color: 'text-green-600' },
  vip: { label: 'VIP价', discount: 0.3, color: 'text-purple-600' },
};

export const CUSTOMER_TIER_CONFIG: Record<CustomerTier, { label: string; color: string }> = {
  normal: { label: '普通客户', color: 'text-gray-600' },
  silver: { label: '银牌客户', color: 'text-gray-400' },
  gold: { label: '金牌客户', color: 'text-yellow-500' },
  vip: { label: 'VIP客户', color: 'text-purple-600' },
};
```

### 2. 创建数据库操作函数
在 src/lib/supabase/ 目录添加数据库操作函数：

**文件: src/lib/supabase/product-prices.ts**
```typescript
import { supabase } from './client';
import type { ProductPrice, PriceLevel } from '@/lib/crm-types';

export async function getProductPrices(productId: string): Promise<ProductPrice[]> {
  const { data, error } = await supabase
    .from('product_prices')
    .select('*')
    .eq('product_id', productId)
    .order('level');
  if (error) throw error;
  return data || [];
}

export async function createProductPrice(price: Omit<ProductPrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductPrice> {
  const { data, error } = await supabase
    .from('product_prices')
    .insert(price)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProductPrice(id: string, updates: Partial<ProductPrice>): Promise<ProductPrice> {
  const { data, error } = await supabase
    .from('product_prices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProductPrice(id: string): Promise<void> {
  const { error } = await supabase
    .from('product_prices')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getSuggestedPrice(productId: string, customerTier?: string): Promise<number> {
  // 根据客户等级返回建议价格
  const { data, error } = await supabase
    .from('product_prices')
    .select('*')
    .eq('product_id', productId)
    .lte('effective_from', new Date().toISOString().split('T')[0])
    .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)
    .single();
  
  if (error || !data) {
    // 兜底：返回产品默认单价
    const { data: product } = await supabase.from('products').select('unit_price').eq('id', productId).single();
    return product?.unit_price || 0;
  }
  return data.price;
}
```

**文件: src/lib/supabase/customer-tiers.ts**
```typescript
import { supabase } from './client';
import type { CustomerTierConfig } from '@/lib/crm-types';

export async function getCustomerTier(customerId: string): Promise<CustomerTierConfig | null> {
  const { data, error } = await supabase
    .from('customer_tiers')
    .select('*')
    .eq('customer_id', customerId)
    .lte('effective_from', new Date().toISOString().split('T')[0])
    .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)
    .single();
  if (error) return null;
  return data;
}

export async function updateCustomerTier(customerId: string, tier: string, discountRate?: number): Promise<void> {
  await supabase.from('customer_tiers').upsert({
    customer_id: customerId,
    tier,
    discount_rate: discountRate,
    effective_from: new Date().toISOString().split('T')[0],
  });
}
```

### 3. 创建API路由
**文件: src/app/api/products/[id]/prices/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getProductPrices, createProductPrice } from '@/lib/supabase/product-prices';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const prices = await getProductPrices(id);
    return NextResponse.json(prices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const price = await createProductPrice({ ...body, productId: id });
    return NextResponse.json(price, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create price' }, { status: 500 });
  }
}
```

**文件: src/app/api/products/prices/[priceId]/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { updateProductPrice, deleteProductPrice } from '@/lib/supabase/product-prices';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ priceId: string }> }) {
  const { priceId } = await params;
  try {
    const body = await request.json();
    const price = await updateProductPrice(priceId, body);
    return NextResponse.json(price);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ priceId: string }> }) {
  const { priceId } = await params;
  try {
    await deleteProductPrice(priceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete price' }, { status: 500 });
  }
}
```

**文件: src/app/api/customers/[id]/tier/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCustomerTier, updateCustomerTier } from '@/lib/supabase/customer-tiers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tier = await getCustomerTier(id);
    return NextResponse.json(tier || { tier: 'normal' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tier' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await updateCustomerTier(id, body.tier, body.discountRate);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
  }
}
```

### 4. 创建产品价格管理页面

**文件: src/app/products/[id]/prices/page.tsx**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICE_LEVEL_CONFIG } from '@/lib/crm-types';
import type { ProductPrice, PriceLevel } from '@/lib/crm-types';
import { format } from '@/lib/utils';

export default function ProductPricesPage() {
  const params = useParams();
  const productId = params.id as string;
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ level: 'retail' as PriceLevel, price: 0, minQuantity: 1 });

  useEffect(() => {
    fetchPrices();
  }, [productId]);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/prices`);
      const data = await res.json();
      setPrices(data);
    } catch (error) {
      console.error('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/products/${productId}/prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      fetchPrices();
    } catch (error) {
      console.error('Failed to create price');
    }
  };

  const handleDelete = async (priceId: string) => {
    if (!confirm('确定删除此价格?')) return;
    try {
      await fetch(`/api/products/prices/${priceId}`, { method: 'DELETE' });
      fetchPrices();
    } catch (error) {
      console.error('Failed to delete price');
    }
  };

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品价格管理</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? '取消' : '添加价格'}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>添加新价格</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">价格等级</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as PriceLevel })}
                  className="w-full p-2 border rounded"
                >
                  {Object.entries(PRICE_LEVEL_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">最低起订量</label>
                <input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <Button type="submit">保存</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PRICE_LEVEL_CONFIG).map(([level, config]) => {
          const price = prices.find((p) => p.level === level);
          return (
            <Card key={level}>
              <CardHeader className="pb-2">
                <CardTitle className={config.color}>{config.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {price ? (
                  <>
                    <p className="text-2xl font-bold">¥{price.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">最低{price.minQuantity || 1}件起</p>
                    <p className="text-xs text-gray-400 mt-2">
                      生效: {format(new Date(price.effectiveFrom))}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleDelete(price.id)}
                    >
                      删除
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-400">未设置</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### 5. 创建产品利润分析报表页面

**文件: src/app/reports/product-margin/page.tsx**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/lib/supabase/client';

interface ProductMargin {
  name: string;
  cost: number;
  price: number;
  margin: number;
  marginRate: number;
}

export default function ProductMarginPage() {
  const [data, setData] = useState<ProductMargin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
      const margins: ProductMargin[] = (products || []).map((p: any) => ({
        name: p.name,
        cost: p.cost || 0,
        price: p.unit_price,
        margin: p.unit_price - (p.cost || 0),
        marginRate: p.cost ? ((p.unit_price - p.cost) / p.unit_price * 100) : 100,
      }));
      setData(margins.sort((a, b) => b.marginRate - a.marginRate));
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getColor = (rate: number) => {
    if (rate >= 50) return '#22c55e';
    if (rate >= 30) return '#3b82f6';
    if (rate >= 15) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) return <div className="p-8">加载中...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">产品利润分析</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">平均利润率</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.length > 0 ? (data.reduce((sum, d) => sum + d.marginRate, 0) / data.length).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">高利润产品</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {data.filter(d => d.marginRate >= 50).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">低利润产品</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {data.filter(d => d.marginRate < 15).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>利润率排名</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '利润率']} />
                <Bar dataKey="marginRate" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={getColor(entry.marginRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. 添加数据库迁移
在 supabase/migrations/ 创建新迁移文件：

**文件: supabase/migrations/20260417_product_pricing.sql**
```sql
-- 产品价格表
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL CHECK (level IN ('retail', 'wholesale', 'agent', 'vip')),
  price DECIMAL(12,2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客户等级表
CREATE TABLE IF NOT EXISTS customer_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('normal', 'silver', 'gold', 'vip')),
  discount_rate DECIMAL(5,2) DEFAULT 0,
  credit_limit DECIMAL(12,2),
  payment_terms INTEGER,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_level ON product_prices(level);
CREATE INDEX IF NOT EXISTS idx_customer_tiers_customer_id ON customer_tiers(customer_id);
```

### 7. 更新侧边栏导航
在 src/components/crm/sidebar.tsx 添加：
- 产品价格管理链接（在产品下）
- 产品利润报表链接（在报表中心下）

### 8. 更新README
在 README.md 添加V3.2功能说明：
```markdown
### 12. 产品多级价格管理 (V3.2)
- 零售价、批发价、代理价、VIP价多级价格体系
- 客户等级管理（普通/银牌/金牌/VIP）
- 报价单自动填充最优价格
- 产品利润分析报表
```

## 注意事项
- 只做PC端，移动端不需要
- 复用现有的shadcn/ui组件
- 使用supabase作为数据库
- 保持与现有页面的风格一致
