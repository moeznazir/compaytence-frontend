"use client";

import { useAuthStore } from "@/store/auth-store";
import { hasPermission, type Permission } from "./permissions";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Always show same loading UI on server and first client render to avoid hydration mismatch
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({
  permission,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const user = useAuthStore((s) => s.user);
  if (!user || !hasPermission(user.role, permission)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface RequireRoleProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({
  roles,
  children,
  fallback = null,
}: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
