import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Footer from "./Footer";
import { useSidebar } from "../Context/SidebarContext";

export default function DashboardLayout({ children }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Layout */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${collapsed ? "ml-20" : "ml-64"}
        `}
      >
        <Topbar />

        <main className="flex-1 p-8 animate-fadeIn">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
