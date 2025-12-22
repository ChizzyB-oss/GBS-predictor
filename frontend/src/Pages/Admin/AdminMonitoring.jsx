import { useMemo } from "react";
import DashboardLayout from "../../Components/DashboardLayout";
import {
  Server,
  Activity,
  AlertTriangle,
  Database,
  Clock,
  Cpu,
  BarChart3,
  AlertCircle,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function AdminMonitoring() {
  // --------------------------
  // MOCK METRICS (STATIC DATA)
  // --------------------------
  const metrics = useMemo(
    () => ({
      status: "Online",
      uptime: "23h 41m",
      apiLatencyAvg: 128, // ms
      apiLatencyP95: 210, // ms
      errorRate: 0.8, // %
      requestsLastHour: 146,
      dbStatus: "Healthy",
      dbSizeMb: 132,
      dbUsersCount: 17,
      dbPredictionsCount: 342,
      modelVersion: "v1.0.0",
      modelDeployedAt: "2025-11-01T10:00:00Z",
    }),
    []
  );

  const latencySeries = useMemo(
    () => [
      { time: "09:10", latency: 110 },
      { time: "09:20", latency: 120 },
      { time: "09:30", latency: 130 },
      { time: "09:40", latency: 180 },
      { time: "09:50", latency: 140 },
      { time: "10:00", latency: 125 },
    ],
    []
  );

  const requestsSeries = useMemo(
    () => [
      { time: "09:10", count: 5 },
      { time: "09:20", count: 8 },
      { time: "09:30", count: 12 },
      { time: "09:40", count: 9 },
      { time: "09:50", count: 15 },
      { time: "10:00", count: 11 },
    ],
    []
  );

  const recentEvents = useMemo(
    () => [
      {
        type: "prediction",
        message: "Prediction created by clinician #14 (AIDP, 92.4% confidence).",
        time: "10:02",
      },
      {
        type: "system",
        message: "Nightly database backup completed successfully.",
        time: "02:10",
      },
      {
        type: "warning",
        message: "Short latency spike detected (p95 = 260ms).",
        time: "09:42",
      },
      {
        type: "prediction",
        message: "Prediction created by clinician #7 (AMAN, 78.9% confidence).",
        time: "09:38",
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Server className="w-7 h-7 text-blue-600 dark:text-blue-300" />
              System Monitoring
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Operational health and performance of the GBS Decision Support System.
            </p>
          </div>
        </header>

        {/* TOP METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Activity className="w-5 h-5 text-emerald-600" />}
            label="System Status"
            value={metrics.status}
            pillClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          />
          <MetricCard
            icon={<Clock className="w-5 h-5 text-blue-600" />}
            label="Uptime"
            value={metrics.uptime}
          />
          <MetricCard
            icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
            label="Avg API Latency"
            value={`${metrics.apiLatencyAvg} ms`}
            sub={`p95: ${metrics.apiLatencyP95} ms`}
          />
          <MetricCard
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            label="Error Rate"
            value={`${metrics.errorRate.toFixed(2)}%`}
            sub={`${metrics.requestsLastHour} requests / hr`}
          />
        </section>

        {/* CHARTS ROW */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LATENCY CHART */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                API Latency (ms)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last ~1 hour
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={latencySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="latency" stroke="#2563EB" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* REQUESTS CHART */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Requests Over Time
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last ~1 hour
              </span>
            </div>

            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={requestsSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" stroke="#7C3AED" fill="#7C3AED" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* DB + MODEL INFO */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DATABASE HEALTH */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card p-6">
            <h2 className="card-title flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-emerald-600" />
              Database Health
            </h2>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p>
                Status:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {metrics.dbStatus}
                </span>
              </p>
              <p>
                Size: <span className="font-semibold">{metrics.dbSizeMb} MB</span>
              </p>
              <p>
                Predictions Stored:{" "}
                <span className="font-semibold">{metrics.dbPredictionsCount}</span>
              </p>
              <p>
                Registered Users:{" "}
                <span className="font-semibold">{metrics.dbUsersCount}</span>
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Storage utilisation (mock)
              </p>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: "45%" }}
                />
              </div>
            </div>
          </div>

          {/* MODEL STATUS */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card p-6">
            <h2 className="card-title flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-indigo-600" />
              Model Status
            </h2>

            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <p>
                Active Model Version:{" "}
                <span className="font-semibold">{metrics.modelVersion}</span>
              </p>
              <p>
                Deployed At:{" "}
                <span className="font-semibold">
                  {new Date(metrics.modelDeployedAt).toLocaleString("en-GB")}
                </span>
              </p>
              <p>
                SHAP Explainability:{" "}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Enabled
                </span>
              </p>
              <p>
                Last Drift Check:{" "}
                <span className="font-semibold">No drift detected (mock)</span>
              </p>
            </div>
          </div>
        </section>

        {/* RECENT EVENTS / LOG FEED */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card p-6">
          <h2 className="card-title flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Recent Events
          </h2>

          <div className="space-y-3 text-sm">
            {recentEvents.map((evt, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 h-2 w-2 rounded-full ${
                      evt.type === "warning"
                        ? "bg-amber-500"
                        : evt.type === "system"
                        ? "bg-slate-400"
                        : "bg-blue-500"
                    }`}
                  />
                  <p className="text-slate-700 dark:text-slate-200">
                    {evt.message}
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {evt.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

/* ----------------- SMALL METRIC CARD COMPONENT ----------------- */
function MetricCard({ icon, label, value, sub, pillClass }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        {pillClass ? (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${pillClass}`}
          >
            {value}
          </span>
        ) : (
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        )}
      </div>
      {sub && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {sub}
        </p>
      )}
    </div>
  );
}
