# 产品多级价格管理功能 - V3.2

## 功能概述
为CRM系统添加产品多级价格管理功能，支持零售价、批发价、代理价、VIP价四种价格等级，并能根据客户等级自动填充报价价格。

## 需求背景
当前系统产品仅有单一售价，无法满足不同客户等级的销售场景。本功能将实现：
- 适应不同客户群体的差异化定价策略
- 提升销售效率，自动填充最优价格
- 支持价格灵活调整和历史追踪

## 功能设计

### 1. 数据模型扩展

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

export const PRICE_LEVEL_CONFIG = {
  retail: { label: '零售价', discount: 0, color: 'text-gray-700' },
  wholesale: { label: '批发价', discount: 0.1, color: 'text-blue-600' },
  agent: { label: '代理价', discount: 0.2, color: 'text-green-600' },
  vip: { label: 'VIP价', discount: 0.3, color: 'text-purple-600' },
};

export const CUSTOMER_TIER_CONFIG = {
  normal: { label: '普通客户', color: 'text-gray-600' },
  silver: { label: '银牌客户', color: 'text-gray-400' },
  gold: { label: '金牌客户', color: 'text-yellow-500' },
  vip: { label: 'VIP客户', color: 'text-purple-600' },
};
```

### 2. 产品价格管理页面 (/products/[id]/prices)
- 查看产品所有价格等级
- 添加/编辑/删除价格
- 价格历史记录查看

### 3. 客户等级管理（客户详情页新增标签）
- 查看/修改客户等级
- 等级对应的折扣和账期

### 4. 报价单价格自动填充
- 新建报价单选择产品时自动填充最优价格
- 根据客户等级和最低起订量匹配

### 5. 产品利润分析报表 (/reports/product-margin)
- 各产品利润率对比
- 不同价格等级的毛利分布

## 页面清单
- /products/[id]/prices - 产品价格管理（新建）
- /reports/product-margin - 产品利润分析（新建）
- /customers/[id] - 添加等级管理标签（修改）

## API 接口
- GET/POST /api/products/[id]/prices
- PUT/DELETE /api/products/prices/[priceId]
- GET /api/products/[id]/suggested-price
- GET/PUT /api/customers/[id]/tier
- GET /api/reports/product-margin

## 验收标准
1. 产品详情页可查看和管理多级价格
2. 支持添加/编辑/删除产品价格
3. 客户详情页可查看和修改客户等级
4. 新建报价单选择产品时自动填充最优价格
5. 产品利润分析报表正确计算毛利
