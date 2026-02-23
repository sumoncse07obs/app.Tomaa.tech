// src/components/customer/layout/Sidebar.tsx
import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { logout, type User } from "@/auth";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  user: User | null;
  customerNumber?: string;
};

const navItems = [
  { to: "/customer/blog/list", label: "Blog Automation", icon: "📝" },
  { to: "/customer/youtube/list", label: "YouTube Automation", icon: "▶️" },
  { to: "/customer/topic/list", label: "Topic Automation", icon: "📚" },
  { to: "/customer/launch/list", label: "Launch Automation", icon: "🚀" },
  { to: "/customer/tips", label: "Tips & Tricks", icon: "💡" },
  { to: "/customer/training", label: "Training Videos", icon: "🎥" },
];

// All go to /customer/Settings (optionally with a section param so Settings page can jump later)
const settingsItems = [
  { to: "/customer/Settings", label: "API Settings" },
  //{ to: "/customer/Settings?section=blog", label: "Blog Prompt Settings" },
  //{ to: "/customer/Settings?section=launch", label: "Launch Prompt Settings" },
  //{ to: "/customer/Settings?section=topic", label: "Topic Prompt Settings" },
  //{ to: "/customer/Settings?section=youtube", label: "YouTube Prompt Settings" },
];

export default function Sidebar({
  open,
  setOpen,
  collapsed,
  setCollapsed,
  user,
  customerNumber,
}: Props) {
  const nav = useNavigate();
  const loc = useLocation();
  const [loggingOut, setLoggingOut] = React.useState(false);

  // 🔹 Pull business_name from localStorage (set by getCustomerNumber)
  const [businessName, setBusinessName] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const name = localStorage.getItem("business_name");
      if (name) setBusinessName(name);
    } catch {
      // ignore if localStorage not available
    }
  }, []);

  // Settings dropdown
  const isOnSettings = loc.pathname.toLowerCase().startsWith("/customer/settings");
  const [settingsOpen, setSettingsOpen] = React.useState<boolean>(isOnSettings);

  React.useEffect(() => {
    // Keep dropdown open when you're on settings routes
    if (isOnSettings) setSettingsOpen(true);
  }, [isOnSettings]);

  const display = user?.name || user?.email || "Guest";
  const initial = display?.[0]?.toUpperCase() || "?";
  const isCustomer = user?.role === "customer";

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200
        h-screen flex flex-col
        transform transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        ${collapsed ? "w-20" : "w-64"}
        lg:translate-x-0`}
      >
        {/* Brand + collapse */}
        <div className="h-16 flex items-center px-4 border-b justify-between">
          <NavLink
            to="/customer"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 overflow-hidden">
              <img
                src="/logo.svg"
                alt="TOMA Logo"
                className="h-9 w-9 rounded-xl object-contain"
              />
            </div>
            {!collapsed && <span className="font-semibold">TOMA</span>}
          </NavLink>

          <button
            className="hidden lg:inline-flex rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "➡️" : "⬅️"}
          </button>
          <button
            className="lg:hidden rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            ✖
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
              onClick={() => setOpen(false)}
            >
              <span className="text-base" aria-hidden>
                {it.icon}
              </span>
              {!collapsed && <span>{it.label}</span>}
            </NavLink>
          ))}

          {/* Settings dropdown */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                if (collapsed) {
                  setOpen(false);
                  nav("/customer/Settings", { replace: false });
                  return;
                }
                setSettingsOpen((v) => !v);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                isOnSettings
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              aria-expanded={collapsed ? undefined : settingsOpen}
              aria-controls={collapsed ? undefined : "sidebar-settings-subnav"}
            >
              <span className="text-base" aria-hidden>
                ⚙️
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Settings</span>
                  <span className="text-xs">{settingsOpen ? "▲" : "▼"}</span>
                </>
              )}
            </button>

            {!collapsed && settingsOpen && (
              <div id="sidebar-settings-subnav" className="mt-1 ml-8 space-y-1">
                {settingsItems.map((s) => (
                  <NavLink
                    key={s.label}
                    to={s.to}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded-lg text-sm ${
                        isActive || isOnSettings
                          ? "text-slate-900 bg-slate-100"
                          : "text-slate-600 hover:bg-slate-100"
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {s.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <div className="px-3 py-2 text-sm text-slate-700">
            {collapsed ? (
              <span className="font-medium">{initial}</span>
            ) : (
              <>
                <span className="text-xs text-slate-600 truncate">Name: {display}</span>

                {isCustomer && (
                  <>
                    {businessName && (
                      <div className="text-xs text-slate-600 truncate">
                        Company # {businessName}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 truncate">
                      Customer #{customerNumber ?? "—"}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <button
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              try {
                await logout();
              } finally {
                setLoggingOut(false);
                nav("/", { replace: true });
              }
            }}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            🔒 {!collapsed && (loggingOut ? "Logging out..." : "Logout")}
          </button>
        </div>
      </aside>
    </>
  );
}