import { useState, useRef, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import DarkModeToggle from "./DarkModeToggle";
import { Bell, ChevronDown, User, LogOut } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header
      className="
        h-16 w-full
        bg-white dark:bg-slate-900
        border-b border-slate-200 dark:border-slate-800
        flex items-center justify-between
        px-6 md:px-10
        shadow-sm
      "
    >
      {/* LEFT — CONTEXT */}
      <div className="flex flex-col">
        <h1 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
          {user?.role === "admin"
            ? "Administration Panel"
            : "Clinician Workspace"}
        </h1>
        <span className="text-xs text-slate-500 dark:text-slate-400 tracking-wide">
          Clinical Decision Support System
        </span>
      </div>

      {/* RIGHT — CONTROLS */}
      <div className="flex items-center gap-5">

        {/* Notifications (future-ready) */}
        <button
          className="
            relative p-2 rounded-md
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition
          "
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        {/* Dark mode */}
        <DarkModeToggle />

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="
              flex items-center gap-2 px-3 py-1.5
              rounded-md border border-slate-300 dark:border-slate-700
              bg-white dark:bg-slate-800
              hover:bg-slate-100 dark:hover:bg-slate-700
              text-sm transition
            "
          >
            {/* Avatar */}
            <div
              className="
                w-8 h-8 rounded-full
                bg-slate-200 dark:bg-slate-700
                flex items-center justify-center
                text-slate-700 dark:text-slate-200
                font-medium text-sm
              "
            >
              {user?.full_name?.[0]?.toUpperCase() ||
                user?.role?.[0]?.toUpperCase()}
            </div>

            <span className="hidden md:block text-slate-700 dark:text-slate-200 capitalize">
              {user?.full_name || user?.role}
            </span>

            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Dropdown */}
          {open && (
            <div
              role="menu"
              className="
                absolute right-0 mt-2 w-48 origin-top-right
                bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-800
                rounded-md shadow-lg py-2 z-50
              "
            >
              <div className="px-4 py-1 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Account
              </div>

              <button
                role="menuitem"
                className="
                  flex items-center gap-2 w-full text-left px-4 py-2
                  text-sm text-slate-700 dark:text-slate-300
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  transition
                "
              >
                <User className="w-4 h-4" />
                Profile Settings
              </button>

              <button
                role="menuitem"
                onClick={logout}
                className="
                  flex items-center gap-2 w-full text-left px-4 py-2
                  text-sm text-red-600 dark:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-900/30
                  transition
                "
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
