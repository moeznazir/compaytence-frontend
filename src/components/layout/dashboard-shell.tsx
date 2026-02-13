"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { hasPermission } from "@/lib/rbac";
import {
  LayoutDashboard,
  FileText,
  Shield,
  FileCheck,
  Building2,
  User,
  Bell,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useThemeStore } from "@/store/theme-store";
import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/format";
import { getNotifications } from "@/lib/api/notifications";
import type { ModuleType } from "@/lib/types";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/risk-assessments", label: "Risk Assessments", icon: Shield },
  { href: "/psps", label: "PSPs", icon: FileCheck },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { items: notifications, setNotifications, markAsRead, unreadCount } =
    useNotificationsStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    getNotifications().then(setNotifications).catch(() => {});
  }, [user, setNotifications]);

  const canView = (href: string) => {
    if (!mounted || !user) return false;
    if (href === "/companies") return hasPermission(user.role, "view_companies");
    if (href === "/documents") return hasPermission(user.role, "view_documents");
    if (href === "/risk-assessments")
      return hasPermission(user.role, "view_risk_assessments");
    if (href === "/psps") return hasPermission(user.role, "view_psps");
    if (href === "/dashboard") return hasPermission(user.role, "view_dashboard");
    if (href === "/profile") return hasPermission(user.role, "view_profile");
    return true;
  };

  const handleNotificationClick = (n: (typeof notifications)[0]) => {
    markAsRead(n.id);
    setNotifOpen(false);
    const base = n.entityType === "risk_assessment" ? "/risk-assessments" : "/psps";
    router.push(base + "?id=" + n.entityId + (n.status === "rejected" ? "&tab=rejected" : ""));
  };

  return (
    <div className="min-h-screen bg-theme-bg-muted">
      <header className="sticky top-0 z-40 border-b border-theme-border bg-theme-surface">
        <div className="flex h-14 items-center justify-between px-4 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-theme-text shrink-0">
            <span className="relative block h-8 w-[160px]">
              <Image
                src={theme === "dark" ? "/images/compaytence-logo-dark.png" : "/images/compaytence-logo-light.png"}
                alt="Compaytence"
                fill
                className="object-contain object-left"
                sizes="160px"
                priority
              />
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.filter((n) => canView(n.href)).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-theme-surface-elevated text-theme-text"
                      : "text-theme-text-muted hover:bg-theme-surface-elevated/80 hover:text-theme-text"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 min-w-[120px] justify-end">
            {!mounted ? (
              <span className="text-sm text-theme-text-muted">...</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-theme-text-muted hover:bg-theme-surface-elevated hover:text-theme-text transition-colors"
                  title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-lg text-theme-text-muted hover:bg-theme-surface-elevated"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </button>
                  {notifOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setNotifOpen(false)}
                      />
                      <div className="absolute right-0 mt-1 w-80 rounded-lg border border-theme-border bg-theme-surface shadow-lg z-20 max-h-96 overflow-y-auto">
                        <div className="p-2 border-b border-theme-border-muted flex justify-between items-center">
                          <span className="text-sm font-medium text-theme-text">Notifications</span>
                          {notifications.length === 0 && (
                            <span className="text-xs text-theme-text-muted">No notifications</span>
                          )}
                        </div>
                        {notifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              "w-full text-left px-4 py-3 text-sm hover:bg-theme-surface-elevated border-b border-theme-border-muted last:border-0 text-theme-text",
                              !n.read && "bg-theme-accent/10"
                            )}
                          >
                            <div className="font-medium text-theme-text">{n.title}</div>
                            <div className="text-xs text-theme-text-muted mt-0.5">
                              {formatRelativeTime(n.createdAt)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-theme-surface-elevated text-theme-text">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {user?.name ?? "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-theme-text-muted" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-1 w-56 origin-top-right rounded-lg border border-theme-border bg-theme-surface shadow-lg focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={cn(
                                "block px-4 py-2 text-sm text-theme-text",
                                active && "bg-theme-surface-elevated"
                              )}
                            >
                              Profile
                            </Link>
                          )}
                        </Menu.Item>
                        {user && hasPermission(user.role, "view_companies") && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/companies"
                                className={cn(
                                  "block px-4 py-2 text-sm text-theme-text",
                                  active && "bg-theme-surface-elevated"
                                )}
                              >
                                Company
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              type="button"
                              onClick={() => {
                                logout();
                                router.replace("/login");
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 px-4 py-2 text-sm text-left text-theme-text",
                                active && "bg-theme-surface-elevated"
                              )}
                            >
                              <LogOut className="h-4 w-4" />
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="p-4 lg:p-8">{children}</main>
    </div>
  );
}
