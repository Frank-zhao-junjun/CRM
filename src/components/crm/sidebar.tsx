'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase,
  Contact2, 
  Settings,
  ChevronLeft,
  Menu,
  Zap,
  Lightbulb,
  FileText,
  Package,
  Package2,
  Clock,
  FileBarGraph,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navigation = [
  { 
    name: '仪表盘', 
    href: '/', 
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-cyan-500',
  },
  { 
    name: '客户管理', 
    href: '/customers', 
    icon: Users,
    gradient: 'from-purple-500 to-pink-500',
  },
  { 
    name: '销售线索', 
    href: '/leads', 
    icon: Lightbulb,
    gradient: 'from-yellow-500 to-amber-500',
    badge: '线索',
  },
  { 
    name: '商机',
    href: '/opportunities', 
    icon: Briefcase,
    gradient: 'from-orange-500 to-amber-500',
  },
  { 
    name: '产品管理', 
    href: '/products', 
    icon: Package2,
    gradient: 'from-cyan-500 to-blue-500',
  },
  { 
    name: '报价单', 
    href: '/quotes', 
    icon: FileText,
    gradient: 'from-indigo-500 to-blue-500',
  },
  { 
    name: '合同', 
    href: '/contracts', 
    icon: FileBarGraph,
    gradient: 'from-violet-500 to-purple-500',
  },
  { 
    name: '订单', 
    href: '/orders', 
    icon: Package,
    gradient: 'from-emerald-500 to-green-500',
  },
  { 
    name: '联系人', 
    href: '/contacts', 
    icon: Contact2,
    gradient: 'from-green-500 to-emerald-500',
  },
  { 
    name: '跟进记录', 
    href: '/follow-ups', 
    icon: Clock,
    gradient: 'from-rose-500 to-pink-500',
  },
];

interface NavItemProps {
  href: string;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  gradient: string;
  onClick?: () => void;
}

function NavItem({ href, isActive, icon: Icon, label, collapsed, gradient, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className={cn(
          "absolute inset-0 rounded-xl bg-gradient-to-r opacity-20",
          gradient
        )} />
      )}
      
      {/* Icon container */}
      <div className={cn(
        "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
        isActive 
          ? "bg-white/20" 
          : "bg-accent group-hover:bg-primary/10"
      )}>
        <Icon className={cn(
          "h-5 w-5 transition-transform duration-300",
          !isActive && "group-hover:scale-110"
        )} />
      </div>
      
      {!collapsed && (
        <span className="relative flex-1">{label}</span>
      )}
      
      {/* Hover glow effect */}
      {!isActive && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
                <NavItem
                  key={item.name}
                  href={item.href}
                  icon={item.icon}
                  label={item.name}
                  isActive={isActive(item.href)}
                  collapsed={false}
                  gradient={item.gradient}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t/50">
              <NavItem
                href="/settings"
                icon={Settings}
                label="系统设置"
                isActive={pathname === '/settings'}
                collapsed={false}
                gradient="from-gray-500 to-slate-500"
                onClick={() => setMobileOpen(false)}
              />
              
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
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={cn(
            "relative h-20 flex items-center border-b/50 overflow-hidden transition-all duration-300",
            collapsed ? "justify-center px-2" : "px-6"
          )}>
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className={cn(
              "absolute transition-all duration-300",
              collapsed ? "right-0 top-0 w-12 h-12" : "right-0 top-0 w-24 h-24"
            )}>
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/5 rounded-full blur-2xl" />
            </div>
            
            <div className={cn(
              "relative flex items-center gap-3 transition-all duration-300",
              collapsed && "flex-col"
            )}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30 float">
                <Zap className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <div className="animate-in slide-in-from-left-2 duration-300">
                  <h1 className="text-lg font-bold gradient-text">简易CRM</h1>
                  <p className="text-xs text-muted-foreground">客户关系管理</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => (
              <NavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                label={item.name}
                isActive={isActive(item.href)}
                collapsed={collapsed}
                gradient={item.gradient}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t/50">
            <NavItem
              href="/settings"
              icon={Settings}
              label="系统设置"
              isActive={pathname === '/settings'}
              collapsed={collapsed}
              gradient="from-gray-500 to-slate-500"
            />
            
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full mt-2 justify-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300",
                !collapsed && "justify-between px-3"
              )}
            >
              {!collapsed && <span className="text-xs">收起侧边栏</span>}
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-300 shrink-0",
                collapsed && "rotate-180"
              )} />
            </Button>
            
            {/* Version info */}
            {!collapsed && (
              <div className="mt-4 px-3 text-xs text-muted-foreground/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>v3.2.0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
