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
  // ChevronDown,
  // ChevronRight,
} from "lucide-react";

/* ------------------------- */
/* Single link (soft active) */
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

  const pad = isCollapsed ? "py-2.5" : "py-2.5 pl-3 pr-2";

  return (
    <Link href={href} className="block">
      <div
        className={[
          "relative flex items-center gap-3 rounded-md transition-colors",
          pad,
          isActive
            ? "bg-blue-50 text-blue-800 dark:bg-blue-900/15 dark:text-blue-200"
            : "hover:bg-gray-100 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",
        ].join(" ")}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded bg-blue-500 dark:bg-blue-400" />
        )}
        <Icon className={["h-5 w-5", isActive ? "text-blue-600 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"].join(" ")} />
        {!isCollapsed && (
          <span className={["font-medium truncate", isActive ? "text-blue-800 dark:text-blue-100" : ""].join(" ")}>
            {label}
          </span>
        )}
      </div>
    </Link>
  );
};

/* ------------------------- */
/* Section header + chevrons */
/* ------------------------- */
function SectionHeader({
  title,
  collapsed,
  // open,
  // onToggle,
}: {
  title: string;
  collapsed: boolean;
  // open: boolean;
  // onToggle: () => void;
}) {
  if (collapsed) return null;
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </div>
      {/* ▼▼▼ enable per-section toggle later ▼▼▼ */}
      {/*
      <button
        onClick={onToggle}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label={`Toggle ${title}`}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
      */}
      {/* ▲▲▲ enable per-section toggle later ▲▲▲ */}
    </div>
  );
}

const Divider = () => <div className="mx-4 my-3 h-px bg-gray-200 dark:bg-gray-800" />;

/* ------------------------- */
/* Sidebar                  */
/* ------------------------- */
export default function Sidebar() {
  const dispatch = useAppDispatch();
  const isCollapsed = useAppSelector((s) => s.global.isSideBarCollapsed);
  const toggle = () => dispatch(setIsSidebarCollapsed(!isCollapsed));

  const wrapper =
    `fixed flex flex-col h-full z-40 shadow-md transition-all duration-300 ` +
    `bg-white dark:bg-gray-900 ` +
    (isCollapsed ? "w-0 md:w-16" : "w-72 md:w-64") +
    ` overflow-hidden`;

  // Uncomment for per-section state later:
  // const [openHome, setOpenHome] = React.useState(true);
  // const [openOps, setOpenOps] = React.useState(true);
  // const [openFin, setOpenFin] = React.useState(true);
  // const [openPeople, setOpenPeople] = React.useState(true);

  return (
    <aside className={wrapper} aria-label="Sidebar">
      {/* Header / Brand */}
      <div className={`flex items-center justify-between md:justify-normal pt-6 ${isCollapsed ? "px-4" : "px-5"}`}>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-blue-600 text-white font-semibold px-2 py-1">Logo</div>
          {!isCollapsed && <h1 className="font-extrabold text-xl text-gray-900 dark:text-gray-100">LCS Stock</h1>}
        </div>
        <button
          className="md:hidden ml-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900"
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* CONTENT */}
      <nav className="flex-1 mt-4">
        {/* HOME (top) */}
        <SectionHeader
          title="Home"
          collapsed={isCollapsed}
          // open={openHome}
          // onToggle={() => setOpenHome((v) => !v)}
        />
        <div className="px-2">
          {/* {(isCollapsed || openHome) && ( */}
          <SidebarLinks href="/dashboard" icon={Layout} label="Dashboard" isCollapsed={isCollapsed} />
          {/* )} */}
        </div>

        <Divider />

        {/* OPERATIONS (Inventory + Products) */}
        <SectionHeader
          title="Operations"
          collapsed={isCollapsed}
          // open={openOps}
          // onToggle={() => setOpenOps((v) => !v)}
        />
        <div className="px-2">
          {/* {(isCollapsed || openOps) && ( */}
          <SidebarLinks href="/inventory" icon={Archive} label="Inventory" isCollapsed={isCollapsed} />
          <SidebarLinks href="/products" icon={Clipboard} label="Products" isCollapsed={isCollapsed} />
          {/* )} */}
        </div>

        {/* BIG spacer like the mock */}
        <div className="h-8" />

        {/* FINANCE (Purchases, Expenses, Sales) */}
        <SectionHeader
          title="Finance"
          collapsed={isCollapsed}
          // open={openFin}
          // onToggle={() => setOpenFin((v) => !v)}
        />
        <div className="px-2">
          {/* {(isCollapsed || openFin) && ( */}
          <SidebarLinks href="/purchases" icon={ClipboardList} label="Purchases" isCollapsed={isCollapsed} />
          <SidebarLinks href="/expenses" icon={CircleDollarSign} label="Expenses" isCollapsed={isCollapsed} />
          <SidebarLinks href="/sales" icon={BarChart3} label="Sales" isCollapsed={isCollapsed} />
          {/* )} */}
        </div>

        {/* “In development” card */}
        {!isCollapsed && (
          <div className="mx-4 mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5">
              • In development
            </span>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              Some features are still being built. You’ll see them light up here soon.
            </p>
          </div>
        )}

        {/* EXTRA space to push bottom groups down */}
        <div className="flex-1" />

        {/* PEOPLE & SETTINGS (near bottom) */}
        <Divider />
        <SectionHeader
          title="People & Settings"
          collapsed={isCollapsed}
          // open={openPeople}
          // onToggle={() => setOpenPeople((v) => !v)}
        />
        <div className="px-2">
          {/* {(isCollapsed || openPeople) && ( */}
          <SidebarLinks href="/users" icon={User} label="Users" isCollapsed={isCollapsed} />
          <SidebarLinks href="/settings" icon={SlidersHorizontal} label="Settings" isCollapsed={isCollapsed} />
          {/* )} */}
        </div>

        {/* HELP CENTER (very bottom) */}
        {!isCollapsed && <div className="h-2" />}
        <div className="px-2 mb-4">
          <Link href="/help" className="block">
            <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
              <LifeBuoy className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {!isCollapsed && <span className="font-medium">Help Center</span>}
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="mb-6 px-5">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} LCS Stock
          </p>
        </div>
      )}
    </aside>
  );
}
