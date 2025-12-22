import { useEffect, useState } from "react";
import DashboardLayout from "../../Components/DashboardLayout";
import {
  Users,
  Activity,
  Clock,
  Database,
} from "lucide-react";

import { adminApi } from "../../api/client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [subtypeData, setSubtypeData] = useState([]);

  const COLORS = ["#2563EB", "#059669", "#D97706", "#D946EF"];

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  async function loadAdminDashboard() {
    try {
      const token = localStorage.getItem("gbs_token");
      const statResponse = await adminApi.getStats(token);

      const subtypeFormatted = Object.entries(
        statResponse.subtype_distribution || {}
      ).map(([name, value]) => ({
        name,
        value,
      }));

      setSubtypeData(subtypeFormatted);
      setStats(statResponse);
    } catch (err) {
      console.error("Admin dashboard failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            Loading admin analytics…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">

        {/* HEADER */}
        <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System-wide activity, operational metrics, and subtype analytics.
          </p>
        </header>

        {/* METRIC CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AdminMetricCard
            title="Registered Users"
            value={stats.total_users}
            icon={Users}
            accent="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          />

          <AdminMetricCard
            title="Total Predictions"
            value={stats.total_predictions}
            icon={Activity}
            accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          />

          <AdminMetricCard
            title="Predictions Today"
            value={stats.predictions_today}
            icon={Clock}
            accent="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          />

          <AdminMetricCard
            title="Server Uptime"
            value={stats.server_uptime}
            icon={Database}
            accent="bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
          />
        </section>

        {/* SUBTYPE DISTRIBUTION */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Subtype Distribution (All Clinicians)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Overview of GBS subtype predictions across the entire system.
          </p>

          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={subtypeData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={4}
                >
                  {subtypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* -------------------- UI COMPONENT -------------------- */

function AdminMetricCard({ title, value, icon: Icon, accent }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div
        className={`
          w-11 h-11 rounded-full flex items-center justify-center text-base
          ${accent}
        `}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {title}
        </p>
        <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {value ?? "-"}
        </h3>
      </div>
    </div>
  );
}
