"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  DollarSign,
  TrendingUp,
  ClipboardList,
  Sparkles,
  Building2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import { Skeleton } from "@/components/ui/skeleton";
import { PERMS, type Perm } from "@lab/shared";
import { useAuth } from "@/app/hooks/useAuth";
import SidebarUserFooter from "./SideBaruserFooter";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  permission: Perm;
};

const navigation = {
  home: [
    { title: "Home", href: "/", icon: Home, permission: PERMS.ACCESS_HOME },
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMS.VIEW_DASHBOARD },
  ] satisfies NavItem[],

  operations: [
    { title: "Inventory", href: "/inventory", icon: Package, permission: PERMS.READ_INVENTORY },
    { title: "Products", href: "/products", icon: ShoppingCart, permission: PERMS.READ_PRODUCTS },
    { title: "Stock Requests", href: "/stock-requests", icon: ClipboardList, permission: PERMS.READ_STOCK_SHEET },
    { title: "Pending Products", href: "/pending-promotions", icon: Sparkles, permission: PERMS.READ_PRODUCT_DRAFT },
  ] satisfies NavItem[],

  finance: [
    { title: "Purchases", href: "/purchases", icon: FileText, permission: PERMS.READ_PURCHASE_ORDERS },
    { title: "Expenses", href: "/expenses", icon: DollarSign, permission: PERMS.READ_EXPENSES },
    { title: "Sales", href: "/sales", icon: TrendingUp, permission: PERMS.READ_SALES },
  ] satisfies NavItem[],

  settings: [
    { title: "Suppliers", href: "/suppliers", icon: Building2, permission: PERMS.READ_SUPPLIERS },
    { title: "Users", href: "/users", icon: Users, permission: PERMS.READ_USERS },
    { title: "Settings", href: "/settings", icon: Settings, permission: PERMS.VIEW_SETTINGS },
  ] satisfies NavItem[],
};

function LoadingSection({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {Array.from({ length: rows }).map((_, i) => (
            <SidebarMenuItem key={`${label}-${i}`}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  // ✅ IMPORTANT: we need `can()` here so we can filter sections BEFORE rendering
  const { user, role, isLoading, can } = useAuth();

  const isActive = React.useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === href || pathname === "/";
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname]
  );

  // ✅ Filter each section upfront so empty groups NEVER render.
  const visible = React.useMemo(() => {
    const filter = (items: NavItem[]) => items.filter((i) => can(i.permission));
    return {
      home: filter(navigation.home),
      operations: filter(navigation.operations),
      finance: filter(navigation.finance),
      settings: filter(navigation.settings),
    };
  }, [can]);

  const hasHome = visible.home.length > 0;
  const hasOps = visible.operations.length > 0;
  const hasFinance = visible.finance.length > 0;
  const hasSettings = visible.settings.length > 0;

  return (
    <Sidebar collapsible="icon">
      {/* Header (exact styling version) */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm group-data-[collapsible=icon]:hidden">
                  <Image
                    src="/logo.png"
                    alt="LSCL Logo"
                    width={48}
                    height={48}
                    priority
                    className="h-11 w-11 object-contain"
                  />
                </div>

                <div className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm group-data-[collapsible=icon]:flex">
                  <Image
                    src="/logo.png"
                    alt="LSCL Logo"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>

                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold">LCS Stock</span>
                  <span className="text-xs text-muted-foreground">Inventory System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <>
            <LoadingSection label="Home" rows={2} />
            <SidebarSeparator />
            <LoadingSection label="Operations" rows={4} />
            <SidebarSeparator />
            <LoadingSection label="Finance" rows={3} />
            <SidebarSeparator />
            <LoadingSection label="People & Settings" rows={3} />
          </>
        ) : (
          <>
            {hasHome && <NavSection label="Home" items={visible.home} isActive={isActive} />}

            {hasHome && hasOps && <SidebarSeparator />}

            {hasOps && <NavSection label="Operations" items={visible.operations} isActive={isActive} />}

            {hasOps && hasFinance && <SidebarSeparator />}

            {hasFinance && <NavSection label="Finance" items={visible.finance} isActive={isActive} />}

            {/* Dev notice sticks near bottom, but doesn't create empty Finance space */}
            <SidebarGroup className="mt-auto">
              <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20 group-data-[collapsible=icon]:hidden">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  • In development
                </span>
                <p className="mt-2 text-xs text-muted-foreground">
                  Some features are still being built. You&apos;ll see them light up here soon.
                </p>
              </div>
            </SidebarGroup>

            {hasSettings && <SidebarSeparator />}

            {hasSettings && (
              <NavSection label="People & Settings" items={visible.settings} isActive={isActive} />
            )}
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        {/* ✅ Remove meta prop if your component doesn't support it */}
        <SidebarUserFooter
          user={{
            name: user?.name || "User",
            email: (user as any)?.email || "user@example.com",
            imageUrl: (user as any)?.imageUrl || "/placeholder-avatar.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
