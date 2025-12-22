import { useEffect, useState } from "react";
import DashboardLayout from "../../Components/DashboardLayout";
import { Settings, Server, Shield } from "lucide-react";
import { adminSettingsApi } from "../../api/client";

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("gbs_token");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await adminSettingsApi.getSettings(token);
      setSettings(data);
    } catch (err) {
      console.error("Settings load failed:", err);
    }
    setLoading(false);
  }

  async function updateField(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    setSaving(true);
    try {
      await adminSettingsApi.updateSettings(updated, token);
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">

        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-blue-600 dark:text-blue-300" />
            System Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Admin-level configuration for the Decision Support System.
          </p>
        </header>

        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 space-y-6">

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            Platform Controls
          </h2>

          <SettingToggle
            label="Maintenance Mode"
            description="Temporarily disable system access for all clinicians."
            value={settings.maintenance_mode}
            onChange={(v) => updateField("maintenance_mode", v)}
          />

          <SettingToggle
            label="Allow Clinician Registration"
            description="Enable or disable new clinician account creation."
            value={settings.allow_registration}
            onChange={(v) => updateField("allow_registration", v)}
          />

          {saving && (
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Saving changes…
            </p>
          )}
        </div>

        {/* System Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            System Information
          </h2>

          <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <p>
              Model Version: <strong>{settings.model_version}</strong>
            </p>
            <p>
              Last Updated: <strong>{settings.last_updated || "N/A"}</strong>
            </p>
            <p>
              Backend Status: <strong className="text-emerald-600 dark:text-emerald-400">Online</strong>
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

function SettingToggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      {/* Modern Toggle Switch */}
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition 
          ${value ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition 
            ${value ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
