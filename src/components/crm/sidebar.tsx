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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navigation = [
  { name: '仪表盘', href: '/', icon: LayoutDashboard },
  { name: '客户管理', href: '/customers', icon: Users },
  { name: '销售机会', href: '/opportunities', icon: Briefcase },
  { name: '联系人', href: '/contacts', icon: Contact2 },
];

interface NavItemProps {
  href: string;
  isActive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ href, isActive, icon: Icon, label, collapsed, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
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
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <h1 className="text-lg font-bold text-primary">简易CRM</h1>
            </div>
            
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <NavItem
                  key={item.name}
                  href={item.href}
                  icon={item.icon}
                  label={item.name}
                  isActive={isActive(item.href)}
                  collapsed={false}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>

            <div className="px-2 py-4 border-t">
              <NavItem
                href="/settings"
                icon={Settings}
                label="设置"
                isActive={pathname === '/settings'}
                collapsed={false}
                onClick={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-card border-r h-screen sticky top-0 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          <div className={cn(
            "flex items-center h-16 px-4 border-b",
            collapsed ? "justify-center" : "justify-between"
          )}>
            {!collapsed && (
              <h1 className="text-lg font-bold text-primary">简易CRM</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </Button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                label={item.name}
                isActive={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </nav>

          <div className="px-2 py-4 border-t">
            <NavItem
              href="/settings"
              icon={Settings}
              label="设置"
              isActive={pathname === '/settings'}
              collapsed={collapsed}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
