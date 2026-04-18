import { NextResponse } from 'next/server';

// GET - 获取系统健康数据
export async function GET() {
  // 模拟健康检查数据
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'online', latency: 45 },
      database: { status: 'online', latency: 12 },
      cache: { status: 'online', latency: 3 },
      storage: { status: 'online', latency: 85 },
      email: { status: 'online', latency: 230 },
    },
    metrics: {
      cpuUsage: Math.random() * 40 + 30, // 30-70%
      memoryUsage: Math.random() * 30 + 50, // 50-80%
      diskUsage: Math.random() * 20 + 30, // 30-50%
      latency: Math.random() * 50 + 10, // 10-60ms
      dbConnections: Math.floor(Math.random() * 40 + 10), // 10-50
      cacheHitRate: Math.random() * 5 + 92, // 92-97%
    },
    apiLatency: Math.floor(Math.random() * 30 + 30),
    dbLatency: Math.floor(Math.random() * 10 + 8),
    cacheLatency: Math.floor(Math.random() * 5 + 1),
    storageLatency: Math.floor(Math.random() * 50 + 60),
    emailLatency: Math.floor(Math.random() * 100 + 180),
  };

  return NextResponse.json(healthData);
}
