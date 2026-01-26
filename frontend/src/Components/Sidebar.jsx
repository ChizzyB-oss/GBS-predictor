import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useSidebar } from "../Context/SidebarContext";
import { useEffect, useState } from "react";
import { reviewApi } from "../api/client";

import {
  LayoutDashboard,
  Activity,
  FileClock,
  UserCog,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  Inbox
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();

  const clinicianLinks = [
    { name: "Dashboard", to: "/clinician/dashboard", icon: LayoutDashboard },
    { name: "Make Prediction", to: "/clinician/predict", icon: Activity },
    { name: "Prediction History", to: "/clinician/history", icon: FileClock },
    { name: "Profile Settings", to: "/clinician/profile", icon: UserCog },
    { name: "Review Inbox", to: "/clinician/reviews", icon: Inbox }
  ];

  const adminLinks = [
    { name: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Manage Users", to: "/admin/users", icon: Users },
    { name: "All Predictions", to: "/admin/predictions", icon: BarChart3 },
    { name: "System Monitoring", to: "/admin/monitoring", icon: Activity },
    { name: "System Settings", to: "/admin/settings", icon: Settings },
  ];

  const links = user?.role === "admin" ? adminLinks : clinicianLinks;

  const [pendingReviews, setPendingReviews] = useState(0);

useEffect(() => {
  // only clinicians need it
  if (!user || user.role === "admin") return;

  let alive = true;

  async function loadCount() {
    try {
      const token = localStorage.getItem("gbs_token");
      if (!token) return;

      const data = await reviewApi.inboxCount(token);
      if (!alive) return;

      setPendingReviews(Number(data?.pending || 0));
    } catch (e) {
      // fail silently (don’t break sidebar)
      console.error("Failed to load inbox count:", e);
    }
  }

  loadCount();

  // optional: refresh every 20s for demo “live” feel
  const t = setInterval(loadCount, 20000);

  return () => {
    alive = false;
    clearInterval(t);
  };
}, [user]);

  return (
    <aside
      className={`
        h-screen fixed left-0 top-0 flex flex-col
        border-r border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div
        className="
          h-16 flex items-center justify-between 
          px-4 border-b border-slate-200 dark:border-slate-800
        "
      >
        {!collapsed && (
          <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 tracking-wide">
            {user?.role === "admin" ? "Admin Console" : "Clinician Workspace"}
          </h2>
        )}

        {/* Toggle */}
        <button
          onClick={toggleSidebar}
          className="
            p-2 rounded-md transition 
            hover:bg-slate-100 dark:hover:bg-slate-800
          "
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {links.map(({ name, to, icon: Icon }) => {
          const active = location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`
                group relative flex items-center gap-3 px-3 py-2 text-sm
                rounded-md transition-all
                ${
                  active
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-800/50"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }
              `}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="
                  absolute left-0 top-0 h-full w-[3px] 
                  bg-blue-600 dark:bg-blue-400 rounded-r-md
                " />
              )}

              <Icon
                className={`w-5 h-5 ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              />

              {/* Badge (pending reviews) */}
{name === "Review Inbox" && pendingReviews > 0 && (
  <span
    className={`
      ml-auto
      inline-flex items-center justify-center
      min-w-5 h-5 px-1.5
      text-[11px] font-bold
      rounded-full
      bg-red-600 text-white
      ${collapsed ? "absolute right-2 top-2" : ""}
    `}
    title={`${pendingReviews} pending review request(s)`}
  >
    {pendingReviews > 99 ? "99+" : pendingReviews}
  </span>
)}

              {!collapsed && <span className="ml-1">{name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={logout}
          className="
            flex items-center gap-3 w-full px-3 py-2
            text-sm text-slate-700 dark:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800
            rounded-md transition
          "
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
