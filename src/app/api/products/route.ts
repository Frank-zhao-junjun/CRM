// 产品管理 API

import { NextRequest, NextResponse } from 'next/server';
import { Product, ProductCategory, PRODUCT_CATEGORY_CONFIG } from '@/lib/crm-types';

// 模拟产品数据（实际项目中应使用数据库）
const mockProducts: Product[] = [
  {
    id: 'prod_001',
    name: 'CRM企业版年度授权',
    sku: 'SW-CRM-ENT-Y',
    category: 'software',
    description: '企业级CRM系统年度授权，包含全部功能模块',
    unitPrice: 58000,
    unit: '套/年',
    cost: 20000,
    stock: 999,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod_002',
    name: 'CRM专业版年度授权',
    sku: 'SW-CRM-PRO-Y',
    category: 'software',
    description: '专业版CRM系统年度授权',
    unitPrice: 28000,
    unit: '套/年',
    cost: 10000,
    stock: 999,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod_003',
    name: '实施服务（标准版）',
    sku: 'SRV-IMP-STD',
    category: 'service',
    description: '标准版系统实施服务',
    unitPrice: 15000,
    unit: '人天',
    cost: 8000,
    stock: 100,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod_004',
    name: '定制开发服务',
    sku: 'SRV-CUS-DEV',
    category: 'consulting',
    description: '按需定制开发服务',
    unitPrice: 2000,
    unit: '人天',
    cost: 1200,
    stock: 200,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'prod_005',
    name: '智能报表服务器',
    sku: 'HW-RPT-SRV',
    category: 'hardware',
    description: '高性能报表服务器设备',
    unitPrice: 45000,
    unit: '台',
    cost: 30000,
    stock: 10,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly');

    let products = [...mockProducts];

    if (id) {
      const product = products.find(p => p.id === id);
      if (!product) {
        return NextResponse.json({ error: '产品不存在' }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      const keyword = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.sku.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword)
      );
    }

    if (activeOnly === 'true') {
      products = products.filter(p => p.isActive);
    }

    // 添加分类配置信息
    const result = products.map(p => ({
      ...p,
      categoryConfig: PRODUCT_CATEGORY_CONFIG[p.category],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, id } = body;

    switch (action) {
      case 'getCategories': {
        return NextResponse.json(PRODUCT_CATEGORY_CONFIG);
      }

      default:
        return NextResponse.json({ error: '未知的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
