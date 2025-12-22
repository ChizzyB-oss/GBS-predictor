import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../Components/DashboardLayout";
import {
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  PlusCircle,
  History,
} from "lucide-react";

import { clinicianApi } from "../../api/client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ClinicianDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [subtypeData, setSubtypeData] = useState([]);
  const [predictionsPerDay, setPredictionsPerDay] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const COLORS = ["#2563EB", "#059669", "#D97706", "#D946EF"];

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const token = localStorage.getItem("gbs_token");

      const stats = await clinicianApi.getStats(token);

      setMetrics({
        totalPredictions: stats.total_predictions,
        predictionsToday: stats.predictions_today,
        mostCommonSubtype: stats.most_common_subtype,
        avgConfidence: (stats.avg_confidence * 100).toFixed(1) + "%",
      });

      setSubtypeData(
        Object.entries(stats.subtype_distribution).map(([key, value]) => ({
          name: key,
          value,
        }))
      );

      setPredictionsPerDay(
        Object.entries(stats.predictions_over_time).map(([date, count]) => ({
          day: date,
          count,
        }))
      );

      setRecentActivity(stats.recent_predictions);

      setLoading(false);
    } catch (err) {
      console.error("Clinician dashboard failed:", err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            Loading analytics…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto animate-fadeIn space-y-10">

        {/* HEADER */}
        <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Clinician Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of your GBS subtype prediction activity and recent cases.
          </p>
        </header>

           {/* CLINICAL DISCLAIMER */}
        <div className="rounded-lg border border-amber-200 dark:border-amber-800
                        bg-amber-50 dark:bg-amber-900/20
                        p-4 text-sm text-amber-800 dark:text-amber-200">
          ⚠️ This system supports clinical decision-making but does not replace
          professional judgement. Final diagnosis remains the responsibility of
          the clinician.
        </div>

        {/* METRIC CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Total Predictions"
            value={metrics.totalPredictions}
            icon={Activity}
            accent="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          />
          <MetricCard
            title="Today"
            value={metrics.predictionsToday}
            icon={Clock}
            accent="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          />
          <MetricCard
            title="Most Common Subtype"
            value={metrics.mostCommonSubtype}
            icon={BarChart3}
            accent="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          />
          <MetricCard
            title="Avg Confidence"
            value={metrics.avgConfidence}
            icon={TrendingUp}
            accent="bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
          />
        </section>

        {/* CHARTS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Subtype Pie */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Subtype Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribution of predicted GBS subtypes across your cases.
            </p>

            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={subtypeData}
                    dataKey="value"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {subtypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictions Over Time */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Predictions Over Time
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Number of predictions made per day.
            </p>

            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={predictionsPerDay}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    className="dark:stroke-slate-700"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563EB"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Most recent predictions with subtype and confidence.
          </p>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
              No recent predictions found.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className="
                            px-2.5 py-0.5 rounded-full text-xs font-semibold 
                            bg-blue-100 text-blue-700 
                            dark:bg-blue-900/40 dark:text-blue-300
                          "
                        >
                          {item.subtype}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Confidence: {(item.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {new Date(item.created_at).toLocaleString("en-GB")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* QUICK ACTIONS */}
        <section className="flex flex-wrap gap-4 pt-2">
          <QuickAction
            label="Make New Prediction"
            icon={PlusCircle}
            to="/clinician/predict"
            variant="primary"
          />
          <QuickAction
            label="View History"
            icon={History}
            to="/clinician/history"
            variant="outline"
          />
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ----- UI Components ----- */

function MetricCard({ title, value, icon: Icon, accent }) {
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

function QuickAction({ label, icon: Icon, to, variant = "primary" }) {
  const base =
    "inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition";

  const styles =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <Link to={to} className={`${base} ${styles}`}>
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
