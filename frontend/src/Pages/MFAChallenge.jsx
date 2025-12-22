import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { ShieldCheck, LockKeyhole } from "lucide-react";

export default function MFAChallenge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithMfa } = useAuth();

  const { email, password } = location.state || {};

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!email || !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <p>No MFA login session found.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const user = await loginWithMfa({ email, password, otp });

      navigate(
        user.role === "admin"
          ? "/admin/dashboard"
          : "/clinician/dashboard"
      );
    } catch (err) {
      setErrorMsg(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 px-4 py-10">

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 space-y-6 animate-fadeIn">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Multi-Factor Authentication
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            Enter the 6-digit verification code from your authenticator app to continue.
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="text-sm text-red-600 dark:text-red-400 text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Verification Code
            </label>

            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                required
                className="
                  w-full pl-10 pr-3 py-3 rounded-lg border
                  border-slate-300 dark:border-slate-700
                  bg-white dark:bg-slate-800
                  text-slate-900 dark:text-slate-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  text-center tracking-[0.35em] text-lg font-semibold
                "
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="
              w-full py-3 rounded-lg
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold
              disabled:opacity-60 disabled:cursor-not-allowed
              transition
            "
          >
            {loading ? "Verifying…" : "Verify Code"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          This additional security step helps protect sensitive clinical data.
        </p>
      </div>
    </div>
  );
}
