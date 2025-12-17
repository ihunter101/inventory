"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/app/state";
import {
  Layout,
  Archive,
  Clipboard,
  ClipboardList,
  CircleDollarSign,
  BarChart3,
  User,
  SlidersHorizontal,
  Menu,
  LifeBuoy,
} from "lucide-react";

/* ------------------------- */
/* Single link               */
/* ------------------------- */
interface SidebarLinkProps {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  isCollapsed: boolean;
}

const SidebarLinks = ({ href, icon: Icon, label, isCollapsed }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    pathname === `${href}/` ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  const basePadding = isCollapsed ? "py-2.5" : "py-2.5 pl-3 pr-2";

  return (
    <Link href={href} className="block">
      <div
        className={[
          "relative flex items-center gap-3 rounded-md transition-colors",
          basePadding,
          isActive
            ? "bg-primary/10 text-primary"
            : "text-foreground/80 hover:bg-ink-50 dark:hover:bg-ink-900",
        ].join(" ")}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded bg-primary" />
        )}

        <Icon
          className={[
            "h-5 w-5",
            isActive ? "text-primary" : "text-foreground/60",
          ].join(" ")}
        />

        {!isCollapsed && (
          <span
            className={[
              "truncate text-sm font-medium",
              isActive ? "text-primary" : "",
            ].join(" ")}
          >
            {label}
          </span>
        )}
      </div>
    </Link>
  );
};

/* ------------------------- */
/* Section header            */
/* ------------------------- */
function SectionHeader({ title, collapsed }: { title: string; collapsed: boolean }) {
  if (collapsed) return null;

  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-1">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">
        {title}
      </div>
    </div>
  );
}

const Divider = () => <div className="mx-4 my-3 h-px bg-border" />;

/* ------------------------- */
/* Sidebar root              */
/* ------------------------- */
export default function Sidebar() {
  const dispatch = useAppDispatch();
  const isCollapsed = useAppSelector((s) => s.global.isSideBarCollapsed);
  const toggle = () => dispatch(setIsSidebarCollapsed(!isCollapsed));

  const wrapper =
    "fixed z-40 flex h-full flex-col shadow-md transition-all duration-300 " +
    "bg-background border-r border-border " +
    (isCollapsed ? "w-0 md:w-16" : "w-72 md:w-64") +
    " overflow-hidden";

  return (
    <aside className={wrapper} aria-label="Sidebar">
      {/* Header / Brand */}
      <div
        className={[
          "flex items-center justify-between pt-6",
          isCollapsed ? "px-4" : "px-5",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
            Logo
          </div>
          {!isCollapsed && (
            <h1 className="text-xl font-extrabold text-foreground">LCS Stock</h1>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="ml-2 rounded-full bg-ink-50 p-2 text-foreground hover:bg-ink-100 dark:bg-ink-900 dark:hover:bg-ink-800 md:hidden"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* NAV CONTENT */}
      <nav className="mt-4 flex-1">
        {/* HOME */}
        <SectionHeader title="Home" collapsed={isCollapsed} />
        <div className="px-2">
          <SidebarLinks
            href="/dashboard"
            icon={Layout}
            label="Dashboard"
            isCollapsed={isCollapsed}
          />
        </div>

        <Divider />

        {/* OPERATIONS */}
        <SectionHeader title="Operations" collapsed={isCollapsed} />
        <div className="px-2">
          <SidebarLinks
            href="/inventory"
            icon={Archive}
            label="Inventory"
            isCollapsed={isCollapsed}
          />
          <SidebarLinks
            href="/products"
            icon={Clipboard}
            label="Products"
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Spacer like the mock */}
        <div className="h-8" />

        {/* FINANCE */}
        <SectionHeader title="Finance" collapsed={isCollapsed} />
        <div className="px-2">
          <SidebarLinks
            href="/purchases"
            icon={ClipboardList}
            label="Purchases"
            isCollapsed={isCollapsed}
          />
          <SidebarLinks
            href="/expenses"
            icon={CircleDollarSign}
            label="Expenses"
            isCollapsed={isCollapsed}
          />
          <SidebarLinks
            href="/sales"
            icon={BarChart3}
            label="Sales"
            isCollapsed={isCollapsed}
          />
        </div>

        {/* “In development” card */}
        {!isCollapsed && (
          <div className="mx-4 mt-6 rounded-lg border border-border bg-ink-50 dark:bg-ink-900/40 p-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              • In development
            </span>
            <p className="mt-2 text-xs text-foreground/70">
              Some features are still being built. You’ll see them light up here soon.
            </p>
          </div>
        )}

        {/* Push bottom groups down */}
        <div className="flex-1" />

        {/* PEOPLE & SETTINGS */}
        <Divider />
        <SectionHeader title="People & Settings" collapsed={isCollapsed} />
        <div className="px-2">
          <SidebarLinks
            href="/users"
            icon={User}
            label="Users"
            isCollapsed={isCollapsed}
          />
          <SidebarLinks
            href="/settings"
            icon={SlidersHorizontal}
            label="Settings"
            isCollapsed={isCollapsed}
          />
        </div>

        {/* HELP CENTER */}
        {!isCollapsed && <div className="h-2" />}
        <div className="mb-4 px-2">
          <Link href="/help" className="block">
            <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground/80 hover:bg-ink-50 dark:hover:bg-ink-900">
              <LifeBuoy className="h-5 w-5 text-foreground/60" />
              {!isCollapsed && <span className="font-medium">Help Center</span>}
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="mb-6 px-5">
          <p className="text-center text-[11px] text-foreground/50">
            &copy; {new Date().getFullYear()} LCS Stock
          </p>
        </div>
      )}
    </aside>
  );
}
