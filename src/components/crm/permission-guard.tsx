'use client';

import { useEffect, useState, ReactNode, ElementType } from 'react';
import { getUserPermissions, PermissionName } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * PermissionGuard - 权限守卫组件
 * 
 * 用于在 UI 中根据用户权限显示/隐藏内容
 * 
 * 使用方法：
 * 
 * // 基本用法 - 根据权限显示/隐藏按钮
 * <PermissionGuard permission="customers.create">
 *   <Button>创建客户</Button>
 * </PermissionGuard>
 * 
 * // 显示替代内容
 * <PermissionGuard 
 *   permission="customers.delete" 
 *   fallback={<span>您没有删除权限</span>}
 * >
 *   <Button>删除</Button>
 * </PermissionGuard>
 * 
 * // 多个权限（需要全部满足）
 * <PermissionGuard permissions={['customers.edit', 'customers.delete']}>
 *   <Button>批量操作</Button>
 * </PermissionGuard>
 * 
 * // 多个权限（只需满足任一）
 * <PermissionGuard 
 *   permissions={['customers.edit', 'admin']}
 *   mode="any"
 * >
 *   <Button>编辑</Button>
 * </PermissionGuard>
 */

interface PermissionGuardProps {
  // 要检查的权限
  permission?: PermissionName;
  // 要检查的多个权限
  permissions?: PermissionName[];
  // 权限检查模式：all - 全部满足，any - 任一满足
  mode?: 'all' | 'any';
  // 用户ID（可选，默认使用当前用户）
  userId?: string;
  // 是否在加载时显示内容
  showOnLoading?: boolean;
  // 权限不足时的替代内容
  fallback?: ReactNode;
  // 子元素
  children: ReactNode;
  // 包裹元素的标签
  as?: ElementType;
}

// PermissionGuard 组件
export function PermissionGuard({
  permission,
  permissions = [],
  mode = 'all',
  userId,
  showOnLoading = false,
  fallback = null,
  children,
  as: Component = 'div',
  ...props
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, [permission, permissions, mode, userId]);

  const checkPermissions = async () => {
    try {
      // 使用提供的 userId 或默认用户
      const currentUserId = userId || 'demo_user';
      
      // 如果没有指定权限，默认允许访问
      if (!permission && (!permissions || permissions.length === 0)) {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // 获取用户的所有权限
      const userPermissions = await getUserPermissions(currentUserId);
      
      // 检查权限
      let result = false;
      
      if (permission) {
        // 单个权限检查
        result = userPermissions.includes(permission);
      } else if (permissions && permissions.length > 0) {
        // 多个权限检查
        if (mode === 'all') {
          result = permissions.every(p => userPermissions.includes(p));
        } else {
          result = permissions.some(p => userPermissions.includes(p));
        }
      }
      
      setHasPermission(result);
    } catch (error) {
      console.error('权限检查失败:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  // 加载中状态
  if (loading) {
    if (showOnLoading) {
      return <>{children}</>;
    }
    return (
      <Component {...props}>
        <Skeleton className="h-10 w-20" />
      </Component>
    );
  }

  // 有权限，显示内容
  if (hasPermission) {
    return <Component {...props}>{children}</Component>;
  }

  // 无权限，显示替代内容
  return <>{fallback}</>;
}

/**
 * PermissionButton - 权限按钮组件
 * 
 * 根据权限自动启用/禁用按钮
 * 
 * 使用方法：
 * <PermissionButton permission="customers.create" onClick={handleCreate}>
 *   创建客户
 * </PermissionButton>
 */

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: PermissionName;
  userId?: string;
  // 权限不足时显示的提示
  disabledTooltip?: string;
}

/**
 * PermissionLink - 权限链接组件
 * 
 * 根据权限自动启用/禁用链接
 */

interface PermissionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  permission: PermissionName;
  userId?: string;
}

/**
 * PermissionPage - 权限页面组件
 * 
 * 用于保护整个页面的访问
 * 
 * 使用方法：
 * <PermissionPage permission="customers.view">
 *   <CustomerList />
 * </PermissionPage>
 */

interface PermissionPageProps {
  permission: PermissionName;
  userId?: string;
  children: ReactNode;
  // 权限不足时显示的内容
  unauthorizedContent?: ReactNode;
}

/**
 * PermissionBadge - 权限标签组件
 * 
 * 显示用户拥有的权限
 */

interface PermissionBadgeProps {
  permission: PermissionName;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// 导出所有权限相关组件
export const PermissionComponents = {
  Guard: PermissionGuard,
  // Button, Link, Page, Badge - TODO: implement as needed
};

export default PermissionGuard;
