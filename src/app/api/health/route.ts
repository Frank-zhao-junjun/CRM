// 健康度评分 API
// V4.5 客户健康度评分系统

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const action = searchParams.get('action');

    if (action === 'stats') {
      // 获取健康度统计
      const stats = await db.getHealthStats();
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    }

    if (customerId) {
      // 获取单个客户健康度详情
      const healthScore = await db.getCustomerHealthDetail(customerId);
      if (!healthScore) {
        return NextResponse.json({ error: '客户不存在' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: healthScore,
      });
    }

    // 获取所有客户健康度评分
    const scores = await db.getCustomerHealthScores();
    return NextResponse.json({
      success: true,
      data: scores,
      count: scores.length,
    });

  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    }, { status: 500 });
  }
}
