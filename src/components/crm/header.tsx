'use client';

import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './notification-bell';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/customers': '客户管理',
  '/customers/new': '新建客户',
  '/opportunities': '销售机会',
  '/opportunities/new': '新建机会',
  '/contacts': '联系人',
  '/contacts/new': '新建联系人',
  '/settings': '系统设置',
  '/leads': '销售线索',
  '/leads/new': '新建线索',
};

export function Header() {
  const pathname = usePathname();
  
  const title = pageTitles[pathname] || 'CRM系统';
  
  // 提取动态路由的标题
  const getDynamicTitle = () => {
    if (pathname.match(/^\/customers\/[^/]+$/)) return '客户详情';
    if (pathname.match(/^\/customers\/[^/]+\/edit$/)) return '编辑客户';
    if (pathname.match(/^\/opportunities\/[^/]+$/)) return '机会详情';
    if (pathname.match(/^\/opportunities\/[^/]+\/edit$/)) return '编辑机会';
    if (pathname.match(/^\/contacts\/[^/]+$/)) return '联系人详情';
    if (pathname.match(/^\/contacts\/[^/]+\/edit$/)) return '编辑联系人';
    if (pathname.match(/^\/leads\/[^/]+$/)) return '线索详情';
    return title;
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{getDynamicTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex relative">
            <Input
              type="search"
              placeholder="搜索..."
              className="w-64 pl-9"
            />
          </div>
          
          <NotificationBell />
          
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
