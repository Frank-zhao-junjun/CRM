# CRM产品多级价格管理功能开发任务 V3.2

## 项目信息
- 项目ID: 7628668399886991423
- 仓库: https://github.com/Frank-zhao-junjun/CRM
- 部署域名: https://24w4b99929.coze.site

## 任务目标
为CRM系统添加产品多级价格管理功能

## 需求详情

### 1. 数据模型扩展
在 src/lib/crm-types.ts 添加类型定义和产品价格等级配置常量。

添加内容：
- PriceLevel 类型：retail, wholesale, agent, vip
- ProductPrice 接口：id, productId, level, price, minQuantity, effectiveFrom, effectiveTo, createdAt, updatedAt
- CustomerTier 类型：normal, silver, gold, vip
- CustomerTierConfig 接口：customerId, tier, discountRate, creditLimit, paymentTerms, effectiveFrom, effectiveTo
- PRICE_LEVEL_CONFIG 常量：四种价格等级的标签、折扣率、颜色配置
- CUSTOMER_TIER_CONFIG 常量：四种客户等级的标签和颜色配置

### 2. 数据库操作函数
创建 src/lib/supabase/product-prices.ts，实现以下函数：
- getProductPrices(productId) - 获取产品价格列表
- createProductPrice(price) - 创建新产品价格
- updateProductPrice(id, updates) - 更新价格
- deleteProductPrice(id) - 删除价格
- getSuggestedPrice(productId, customerTier) - 根据客户等级获取建议价格

创建 src/lib/supabase/customer-tiers.ts，实现以下函数：
- getCustomerTier(customerId) - 获取客户等级配置
- updateCustomerTier(customerId, tier, discountRate) - 更新客户等级

### 3. API路由
创建以下API路由文件：
- src/app/api/products/[id]/prices/route.ts - GET获取价格列表，POST添加价格
- src/app/api/products/prices/[priceId]/route.ts - PUT更新价格，DELETE删除价格
- src/app/api/customers/[id]/tier/route.ts - GET获取等级，PUT更新等级

### 4. 页面组件
创建以下页面：
- src/app/products/[id]/prices/page.tsx - 产品价格管理页面，展示四种价格等级卡片，支持添加/编辑/删除价格
- src/app/reports/product-margin/page.tsx - 产品利润分析报表页面，使用recharts展示利润率排名柱状图

### 5. 数据库迁移
创建 supabase/migrations/20260417_product_pricing.sql：
- product_prices 表：id(uuid), product_id(uuid外键), level(varchar), price(decimal), min_quantity(int), effective_from(date), effective_to(date)
- customer_tiers 表：id(uuid), customer_id(uuid外键), tier(varchar), discount_rate(decimal), credit_limit(decimal), payment_terms(int), effective_from(date), effective_to(date)
- 相关索引

### 6. 更新侧边栏导航
在 src/components/crm/sidebar.tsx 添加：
- 产品价格管理链接（在产品分类下）
- 产品利润报表链接（在报表中心下）

### 7. 更新README.md
添加V3.2功能说明段落：
- 零售价、批发价、代理价、VIP价多级价格体系
- 客户等级管理（普通/银牌/金牌/VIP）
- 报价单自动填充最优价格
- 产品利润分析报表

## 技术要求
- 只做PC端，移动端不需要
- 复用现有shadcn/ui组件库
- 使用supabase作为数据库
- 保持与现有页面风格一致
- 使用recharts进行图表展示

## 验收标准
1. 产品详情页可查看和管理多级价格
2. 支持添加/编辑/删除产品价格
3. 客户详情页可查看和修改客户等级
4. 新建报价单选择产品时可自动填充最优价格
5. 产品利润分析报表正确计算毛利并可视化展示
6. 价格历史记录可追溯
7. 所有价格数据持久化到数据库
