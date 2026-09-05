import { useState } from "react";
import {
  Microscope,
  LayoutDashboard,
  FileText,
  ScanLine,
  Activity,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  History,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  PanelRightClose,
} from "lucide-react";
import type { User } from "../types";
import { useTheme } from "./ThemeProvider";

export type NavSection =
  | "dashboard"
  | "intake"
  | "ingestion"
  | "record"
  | "summary"
  | "conflicts"
  | "questions"
  | "longitudinal"
  | "audit";

interface NavItem {
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & preset cases" },
  { id: "intake", label: "Patient Intake", icon: FileText, description: "Capture patient information" },
  { id: "ingestion", label: "Document Ingestion", icon: ScanLine, description: "Upload & parse lab reports" },
  { id: "record", label: "Medical Record", icon: Activity, description: "Structured lab results" },
  { id: "summary", label: "AI Summary", icon: HelpCircle, description: "Patient-friendly overview" },
  { id: "conflicts", label: "Conflicts", icon: AlertTriangle, description: "Inconsistency detection" },
  { id: "longitudinal", label: "Longitudinal", icon: TrendingUp, description: "Trend comparison" },
  { id: "audit", label: "Audit Log", icon: History, description: "Edit history timeline" },
];

interface Props {
  user: User;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onSignOut: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  auditCount: number;
  conflictCount: number;
}

export function Sidebar({
  user,
  activeSection,
  onNavigate,
  onSignOut,
  collapsed,
  onToggleCollapse,
  auditCount,
  conflictCount,
}: Props) {
  const { mode, toggle } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const dark = mode === "dark";

  return (
    <div
      className={`flex h-full flex-col border-r transition-all duration-300 ${
        dark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
      } ${collapsed ? "w-[68px]" : "w-[240px]"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-200/10 px-4 py-3.5 h-[57px]">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-lg shadow-brand-500/20">
          <Microscope className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight text-slate-800 dark:text-white">MedLens</h1>
            <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-tight">Clinical Portal</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;
          const Icon = item.icon;
          const showBadge = (item.id === "audit" && auditCount > 0) || (item.id === "conflicts" && conflictCount > 0);
          const badgeCount = item.id === "audit" ? auditCount : item.id === "conflicts" ? conflictCount : 0;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  active
                    ? dark
                      ? "bg-brand-500/15 text-brand-300 shadow-sm"
                      : "bg-brand-50 text-brand-700"
                    : dark
                    ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? (dark ? "text-brand-400" : "text-brand-600") : ""}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && showBadge && (
                  <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    item.id === "conflicts" ? "bg-rose-500/20 text-rose-400" : "bg-slate-600/30 text-slate-400"
                  }`}>
                    {badgeCount}
                  </span>
                )}
                {collapsed && showBadge && (
                  <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${
                    item.id === "conflicts" ? "bg-rose-500" : "bg-slate-500"
                  }`} />
                )}
              </button>

              {/* Flyout tooltip */}
              {collapsed && hoveredItem === item.id && (
                <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 animate-[fadeIn_0.15s_ease]">
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 shadow-xl whitespace-nowrap ${
                    dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  }`}>
                    <Icon className="h-3.5 w-3.5 text-brand-500" />
                    <div>
                      <p className={`text-xs font-semibold ${dark ? "text-slate-200" : "text-slate-800"}`}>{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.description}</p>
                    </div>
                    {showBadge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        item.id === "conflicts" ? "bg-rose-500/20 text-rose-400" : "bg-slate-600/30 text-slate-400"
                      }`}>
                        {badgeCount}
                      </span>
                    )}
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-200/10 p-2 space-y-1">
        {/* User profile pill */}
        <div className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${dark ? "bg-slate-900/50" : "bg-slate-100"}`}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-[10px] font-bold text-white">
            {user.avatar}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate ${dark ? "text-slate-200" : "text-slate-800"}`}>{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">
                {user.role === "clinician" ? "Clinician" : "Patient"} · {user.id}
              </p>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
            dark ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          } ${collapsed ? "justify-center" : ""}`}
          title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {mode === "dark" ? <Sun className="h-[18px] w-[18px] text-amber-400" /> : <Moon className="h-[18px] w-[18px] text-slate-600" />}
          {!collapsed && <span>{mode === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
            dark ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <PanelRightClose className={`h-[18px] w-[18px] transition-transform ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
            dark ? "text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-300" : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
