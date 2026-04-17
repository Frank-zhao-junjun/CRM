'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase,
  Contact2, 
  Settings,
  Settings2,
  ChevronLeft,
  Menu,
  Zap,
  Lightbulb,
  FileText,
  Package,
  Package2,
  Clock,
  Calendar as CalendarIcon,
  BarChart3,
  Receipt,
  Activity as ActivityIcon,
  CheckSquare,
  Heart,
  AlertTriangle,
  Cpu,
  Ticket,
  GitBranch,
  BellRing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useMobileNav } from './mobile-nav-context';

interface SubMenuItem {
  name: string;
  href: string;
}

interface NavItemType {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badge?: string;
  isSection?: boolean;
  subMenu?: SubMenuItem[];
}

const navigation: NavItemType[] = [
  // 核心业务
  { 
    name: '仪表盘', 
    href: '/', 
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-cyan-500',
  },
  { 
    name: '销售驾驶舱', 
    href: '/dashboard/analytics', 
    icon: BarChart3,
    gradient: 'from-blue-500 to-indigo-500',
    badge: 'PRO',
  },
  { 
    name: '客户管理', 
    href: '/customers', 
    icon: Users,
    gradient: 'from-violet-500 to-purple-500',
  },
  { 
    name: '销售线索', 
    href: '/leads', 
    icon: Lightbulb,
    gradient: 'from-amber-500 to-orange-500',
  },
  { 
    name: '商机',
    href: '/opportunities', 
    icon: Briefcase,
    gradient: 'from-orange-500 to-red-500',
  },
  { 
    name: '联系人', 
    href: '/contacts', 
    icon: Contact2,
    gradient: 'from-teal-500 to-cyan-500',
  },
  // 交易管理
  { 
    name: '报价单', 
    href: '/quotes', 
    icon: FileText,
    gradient: 'from-indigo-500 to-blue-500',
  },
  { 
    name: '合同', 
    href: '/contracts', 
    icon: BarChart3,
    gradient: 'from-fuchsia-500 to-pink-500',
  },
  { 
    name: '订单', 
    href: '/orders', 
    icon: Package,
    gradient: 'from-emerald-500 to-green-500',
  },
  { 
    name: '发票', 
    href: '/invoices', 
    icon: Receipt,
    gradient: 'from-sky-500 to-blue-500',
  },
  { 
    name: '产品管理', 
    href: '/products', 
    icon: Package2,
    gradient: 'from-cyan-500 to-teal-500',
  },
  // 效率工具
  { 
    name: '跟进记录', 
    href: '/follow-ups', 
    icon: Clock,
    gradient: 'from-rose-500 to-pink-500',
  },
  { 
    name: '任务管理', 
    href: '/tasks', 
    icon: CheckSquare,
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'NEW',
  },
  { 
    name: '日历视图', 
    href: '/calendar', 
    icon: CalendarIcon,
    gradient: 'from-pink-500 to-rose-500',
  },
  { 
    name: '智能提醒', 
    href: '/reminders', 
    icon: BellRing,
    gradient: 'from-orange-500 to-red-500',
    badge: 'V5.1',
  },
  { 
    name: '活动追踪', 
    href: '/activities', 
    icon: ActivityIcon,
    gradient: 'from-blue-500 to-indigo-500',
  },
  // 数据分析
  { 
    name: '报表中心', 
    href: '/reports', 
    icon: BarChart3,
    gradient: 'from-violet-500 to-purple-500',
    isSection: true,
    subMenu: [
      { name: '销售漏斗', href: '/reports/funnel' },
      { name: '团队排名', href: '/reports/team-ranking' },
      { name: '收入预测', href: '/reports/forecast' },
      { name: '转化分析', href: '/reports/conversion' },
    ],
  },
  { 
    name: '客户健康度', 
    href: '/health', 
    icon: Heart,
    gradient: 'from-green-500 to-emerald-500',
  },
  { 
    name: '流失预警', 
    href: '/churn', 
    icon: AlertTriangle,
    gradient: 'from-red-500 to-orange-500',
    badge: 'AI',
  },
  // 智能自动化
  { 
    name: '服务工单', 
    href: '/tickets', 
    icon: Ticket,
    gradient: 'from-teal-500 to-cyan-500',
    badge: 'V5.2',
  },
  { 
    name: '工作流自动化', 
    href: '/workflows', 
    icon: GitBranch,
    gradient: 'from-purple-500 to-violet-500',
    badge: 'NEW',
  },
  { 
    name: '流程自动化', 
    href: '/automation', 
    icon: Zap,
    gradient: 'from-yellow-500 to-orange-500',
    badge: 'NEW',
  },
  // 设置子菜单
  { 
    name: '系统设置', 
    href: '/settings', 
    icon: Settings2,
    gradient: 'from-gray-500 to-slate-500',
    isSection: true,
    subMenu: [
      { name: '常规设置', href: '/settings' },
      { name: '用户管理', href: '/settings/users' },
      { name: '角色权限', href: '/settings/roles' },
      { name: '邮件模板', href: '/settings/email' },
      { name: '标签管理', href: '/settings/tags' },
      { name: '规则模板', href: '/settings/templates' },
      { name: '自动化规则', href: '/settings/automation' },
    ],
  },
];

interface NavItemProps {
  href: string;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  gradient: string;
  badge?: string;
  onClick?: () => void;
}

function NavItem({ href, isActive, icon: Icon, label, collapsed, gradient, badge, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-primary to-purple-500 shadow-[0_0_8px_oklch(0.55_0.22_260/0.4)]" />
      )}
      
      {/* Icon container */}
      <div className={cn(
        "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
        isActive 
          ? "bg-gradient-to-br shadow-md" 
          : "bg-transparent group-hover:bg-accent",
        isActive && gradient
      )}>
        <Icon className={cn(
          "h-4 w-4 transition-transform duration-300",
          isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
        )} />
      </div>
      
      {!collapsed && (
        <span className="relative flex-1 text-[13px]">{label}</span>
      )}
      
      {/* Badge */}
      {!collapsed && badge && (
        <span className={cn(
          "relative text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide",
          isActive 
            ? "bg-primary/20 text-primary" 
            : "bg-accent text-muted-foreground"
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen, close } = useMobileNav();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button 
            variant="outline" 
            size="icon"
            className="glass shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 glass">
          <SheetTitle className="sr-only">导航菜单</SheetTitle>
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="relative h-20 flex items-center px-6 border-b/50 overflow-hidden">

              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-primary/10 rounded-full blur-2xl" />
              
              <div className="relative flex items-center gap-3">

                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">简易CRM</h1>
                  <p className="text-xs text-muted-foreground">客户关系管理</p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => (
                item.isSection && item.subMenu ? (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.name}
                    </div>
                    {item.subMenu.map((subItem) => (
                      <NavItem
                        key={subItem.href}
                        href={subItem.href}
                        icon={item.icon}
                        label={subItem.name}
                        isActive={isActive(subItem.href)}
                        collapsed={false}
                        gradient={item.gradient}
                        onClick={close}
                      />
                    ))}
                  </div>
                ) : (
                  <NavItem
                    key={item.name}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    badge={item.badge}
                    isActive={isActive(item.href)}
                    collapsed={false}
                    gradient={item.gradient}
                    onClick={close}
                  />
                )
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t/50">
              {/* Version info */}
              <div className="mt-4 px-3 text-xs text-muted-foreground/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>系统运行正常</span>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r h-screen sticky top-0 transition-all duration-300 ease-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn(
            "relative h-16 flex items-center border-b transition-all duration-300",
            collapsed ? "justify-center px-2" : "px-5"
          )}>
            <div className={cn(
              "relative flex items-center gap-3 transition-all duration-300",
              collapsed && "flex-col"
            )}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-md">
                <Zap className="h-4 w-4 text-white" />
              </div>
              {!collapsed && (
                <div className="animate-in slide-in-from-left-2 duration-300">
                  <h1 className="text-sm font-bold gradient-text">简易CRM</h1>
                  <p className="text-[10px] text-muted-foreground/60">Customer Relationship</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">

            {navigation.map((item) => (
              item.isSection && item.subMenu ? (
                <div key={item.name} className="space-y-0.5 pt-3">
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest",
                    collapsed && "justify-center px-2"
                  )}>
                    {!collapsed && item.name}
                  </div>
                  {item.subMenu.map((subItem) => (
                    <NavItem
                      key={subItem.href}
                      href={subItem.href}
                      icon={item.icon}
                      label={subItem.name}
                      isActive={isActive(subItem.href)}
                      collapsed={collapsed}
                      gradient={item.gradient}
                    />
                  ))}
                </div>
              ) : (
                <NavItem
                  key={item.name}
                  href={item.href}
                  icon={item.icon}
                  label={item.name}
                  badge={item.badge}
                  isActive={isActive(item.href)}
                  collapsed={collapsed}
                  gradient={item.gradient}
                />
              )
            ))}
          </nav>

          {/* Footer */}
          <div className="px-2 py-3 border-t">
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full justify-center gap-2 text-muted-foreground/60 hover:text-foreground transition-all duration-300 h-8",
                !collapsed && "justify-between px-3"
              )}
            >
              {!collapsed && <span className="text-[11px]">收起侧边栏</span>}
              <ChevronLeft className={cn(
                "h-3.5 w-3.5 transition-transform duration-300 shrink-0",
                collapsed && "rotate-180"
              )} />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
