'use client';

import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './notification-bell';
import { GlobalSearch } from './global-search';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/customers': '客户管理',
  '/customers/new': '新建客户',
  '/opportunities': '商机',
  '/opportunities/new': '新建商机',
  '/quotes': '报价单',
  '/quotes/new': '新建报价单',
  '/orders': '订单',
  '/orders/new': '新建订单',
  '/contacts': '联系人',
  '/contacts/new': '新建联系人',
  '/tasks': '任务管理',
  '/workflows': '工作流自动化',
  '/settings': '系统设置',
  '/leads': '销售线索',
  '/leads/new': '新建线索',
};

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const title = pageTitles[pathname] || 'CRM系统';

  const getDynamicTitle = () => {
    if (pathname.match(/^\/customers\/[^/]+$/)) return '客户详情';
    if (pathname.match(/^\/customers\/[^/]+\/edit$/)) return '编辑客户';
    if (pathname.match(/^\/opportunities\/[^/]+$/)) return '商机详情';
    if (pathname.match(/^\/opportunities\/[^/]+\/edit$/)) return '编辑商机';
    if (pathname.match(/^\/quotes\/[^/]+$/)) return '报价单详情';
    if (pathname.match(/^\/quotes\/[^/]+\/edit$/)) return '编辑报价单';
    if (pathname.match(/^\/orders\/[^/]+$/)) return '订单详情';
    if (pathname.match(/^\/orders\/[^/]+\/edit$/)) return '编辑订单';
    if (pathname.match(/^\/contacts\/[^/]+$/)) return '联系人详情';
    if (pathname.match(/^\/contacts\/[^/]+\/edit$/)) return '编辑联系人';
    if (pathname.match(/^\/leads\/[^/]+$/)) return '线索详情';
    return title;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{getDynamicTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch className="hidden md:block" />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings/users')}>
                用户管理
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/roles')}>
                角色权限
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
