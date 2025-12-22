import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../Context/AuthContext";
import { Stethoscope, KeyRound } from "lucide-react";

import loginPreview from "../assets/images/login-preview.png";

export default function LoginPage() {
  const { login, verifyOtp } = useAuth(); // 🔥 SINGLE LOGIN
  const navigate = useNavigate();

  const [step, setStep] = useState("login"); // login | mfa
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // =====================================================
  // STEP 1 — PASSWORD LOGIN
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await login(form);

      if (result?.mfa_required) {
        setStep("mfa");
        setLoading(false);
        return;
      }

      // 🔥 Role comes from backend
      navigate(
        result.role === "admin"
          ? "/admin/dashboard"
          : "/clinician/dashboard"
      );
    } catch (err) {
      setErrorMsg(err.message || "Invalid credentials");
    }

    setLoading(false);
  };

  // =====================================================
  // STEP 2 — MFA VERIFICATION
  // =====================================================
  const submitOtp = async () => {
  setLoading(true);
  setErrorMsg("");

  try {
    const user = await verifyOtp(otp);

    navigate(
      user.role === "admin"
        ? "/admin/dashboard"
        : "/clinician/dashboard"
    );
  } catch (err) {
    setErrorMsg(err.message || "Invalid verification code");
  }

  setLoading(false);
          console.log("Submitting OTP:", otp);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          w-full max-w-5xl grid grid-cols-1 md:grid-cols-2
          bg-white dark:bg-slate-900
          rounded-2xl
          border border-slate-200 dark:border-slate-700
          shadow-2xl dark:shadow-black/50
          overflow-hidden
        "
      >
        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-center p-8 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
          <div className="mb-6">
            <Stethoscope className="w-9 h-9 text-blue-600 mb-2" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              GBS DSS
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Secure clinical access
            </p>
          </div>

          <img
            src={loginPreview}
            alt="Preview"
            className="rounded-xl border border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="p-8 sm:p-10">
          {step === "login" && (
            <>
              <h1 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
                Sign in
              </h1>

              {errorMsg && (
                <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                />

                <button
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                <p className="text-sm text-center text-slate-600 dark:text-slate-300">
                  Don’t have an account?
                  <Link to="/register" className="ml-1 text-blue-600 hover:underline">
                    Register
                  </Link>
                </p>
              </form>
            </>
          )}

{step === "mfa" && (
  <>
    <h1 className="text-2xl font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
      <KeyRound className="w-6 h-6 text-purple-600" />
      Two-Factor Authentication
    </h1>

    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitOtp();
      }}
      className="space-y-5"
    >
      <Input
        label="Verification code"
        value={otp}
        maxLength={6}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="••••••"
      />

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify Code"}
      </button>
    </form>
  </>
)}
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        {...props}
        required
        className="
          w-full px-4 py-3 rounded-xl
          border border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />
    </div>
  );
}
