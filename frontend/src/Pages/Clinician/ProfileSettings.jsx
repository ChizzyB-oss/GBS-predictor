import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../Components/DashboardLayout";
import { User, ShieldCheck, Shield, KeyRound, QrCode, ShieldOff } from "lucide-react";
import { profileApi, API_BASE_URL } from "../../api/client";

export default function ProfileSettings() {
  const token = localStorage.getItem("gbs_token");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    hospital: "",
    specialty: "",
    mfa_enabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // MFA
  const [qrImage, setQrImage] = useState(null);
  const [otp, setOtp] = useState("");
  const [mfaMessage, setMfaMessage] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  // LocalStorage key (per user)
  const mfaStorageKey = useMemo(() => {
    const email = form.email || localStorage.getItem("gbs_user_email") || "";
    return email ? `gbs_mfa_enabled:${email}` : null;
  }, [form.email]);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const data = await profileApi.getProfile(token);

      // Keep a copy of email for MFA fallback keying (in case profile schema changes)
      if (data?.email) localStorage.setItem("gbs_user_email", data.email);

      // If API doesn't return mfa_enabled, fall back to localStorage (so UI doesn't lie)
      const fallbackMfa =
        (data?.email && localStorage.getItem(`gbs_mfa_enabled:${data.email}`) === "true") ||
        false;

      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        hospital: data.hospital || "",
        specialty: data.specialty || "",
        // IMPORTANT: do NOT force false if backend omits it
        mfa_enabled: typeof data.mfa_enabled === "boolean" ? data.mfa_enabled : fallbackMfa,
      });
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await profileApi.updateProfile(
        {
          full_name: form.full_name,
          hospital: form.hospital,
          specialty: form.specialty,
        },
        token
      );
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Profile update failed:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function persistMfaEnabled(enabled) {
    if (!form.email) return;
    localStorage.setItem(`gbs_mfa_enabled:${form.email}`, enabled ? "true" : "false");
  }

  // ============================
  // MFA ACTIONS
  // ============================
  async function enableMfa() {
    setMfaMessage("");
    setMfaBusy(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/enable-mfa`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // If already enabled, flip UI state (your backend is right, your UI was stale)
      if (!res.ok) {
        let detail = "";
        try {
          const j = await res.json();
          detail = j?.detail || "";
        } catch {
          // ignore
        }

        if (res.status === 400 && String(detail).toLowerCase().includes("already enabled")) {
          setForm((prev) => ({ ...prev, mfa_enabled: true }));
          persistMfaEnabled(true);
          setQrImage(null);
          setOtp("");
          setMfaMessage("MFA is already enabled on this account.");
          return;
        }

        throw new Error(detail || "Failed to enable MFA");
      }

      const blob = await res.blob();
      setQrImage(URL.createObjectURL(blob));
      setMfaMessage("Scan the QR code using Google Authenticator, then enter the 6-digit code.");
    } catch (err) {
      console.error(err);
      setMfaMessage(err.message || "Failed to enable MFA");
    } finally {
      setMfaBusy(false);
    }
  }

  async function confirmMfa() {
    setMfaMessage("");
    setMfaBusy(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/confirm-mfa`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "MFA confirmation failed");

      setForm((prev) => ({ ...prev, mfa_enabled: true }));
      persistMfaEnabled(true);

      setQrImage(null);
      setOtp("");
      setMfaMessage("MFA successfully enabled ✔");
    } catch (err) {
      console.error(err);
      setMfaMessage(err.message || "MFA confirmation failed");
    } finally {
      setMfaBusy(false);
    }
  }

  async function disableMfa() {
    setMfaMessage("");
    setMfaBusy(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/disable-mfa`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to disable MFA");

      setForm((prev) => ({ ...prev, mfa_enabled: false }));
      persistMfaEnabled(false);

      // clean up any setup UI
      setQrImage(null);
      setOtp("");
      setMfaMessage("MFA disabled successfully.");
    } catch (err) {
      console.error(err);
      setMfaMessage(err.message || "Failed to disable MFA");
    } finally {
      setMfaBusy(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          Loading profile…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto w-full space-y-10 animate-fadeIn">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
            <User className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Profile Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your personal and security settings.
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Field
              label="Full Name"
              value={form.full_name}
              onChange={(v) => updateField("full_name", v)}
            />
            <Field label="Email" value={form.email} disabled />
            <Field
              label="Hospital / Trust"
              value={form.hospital}
              onChange={(v) => updateField("hospital", v)}
            />
            <Field
              label="Role / Specialty"
              value={form.specialty}
              onChange={(v) => updateField("specialty", v)}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4" />
              Securely stored
            </div>

            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* MFA CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Multi-Factor Authentication
              </h2>
            </div>

            {/* SHOW DISABLE BUTTON WHEN ENABLED */}
            {form.mfa_enabled && (
              <button
                onClick={disableMfa}
                disabled={mfaBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-60"
                title="Disable MFA"
              >
                <ShieldOff className="w-4 h-4" />
                {mfaBusy ? "Disabling…" : "Disable MFA"}
              </button>
            )}
          </div>

          {/* ENABLE FLOW */}
          {!form.mfa_enabled && (
            <>
              {!qrImage && (
                <button
                  onClick={enableMfa}
                  disabled={mfaBusy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-60"
                >
                  <QrCode className="w-4 h-4" />
                  {mfaBusy ? "Preparing…" : "Enable MFA"}
                </button>
              )}

              {qrImage && (
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="flex justify-center">
                    <img
                      src={qrImage}
                      alt="MFA QR"
                      className="w-48 h-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2"
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Scan the QR code using Google Authenticator, then enter the 6-digit code below.
                    </p>

                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="
                        w-full rounded-lg border px-3 py-2 text-center
                        tracking-[0.4em] text-lg font-semibold
                        bg-white dark:bg-slate-800
                        border-slate-300 dark:border-slate-700
                        text-slate-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                      "
                      placeholder="••••••"
                    />

                    <button
                      onClick={confirmMfa}
                      disabled={mfaBusy || otp.length !== 6}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60"
                    >
                      {mfaBusy ? "Confirming…" : "Confirm MFA"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ENABLED STATE */}
          {form.mfa_enabled && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
              <KeyRound className="w-5 h-5" />
              MFA is enabled on this account
            </div>
          )}

          {mfaMessage && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{mfaMessage}</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="
          w-full rounded-lg border px-3 py-2 text-sm
          bg-white dark:bg-slate-800
          border-slate-300 dark:border-slate-700
          text-slate-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-slate-100 dark:disabled:bg-slate-700
        "
      />
    </div>
  );
}
