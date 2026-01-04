import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../Context/AuthContext";
import { UserPlus, Stethoscope } from "lucide-react";
import PasswordInput from "../Components/PasswordInput";

import registerPreview from "../assets/images/register-preview.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerClinician, login } = useAuth();

  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const passwordsMatch =
    form.password &&
    form.confirmPassword &&
    form.password === form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await registerClinician(form);
      await login(form);
      navigate("/clinician/dashboard");
    } catch (err) {
      setErrorMsg(err.message || "Registration failed");
    }

    setLoading(false);
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
        {/* IMAGE PANEL */}
        <div className="
          hidden md:flex flex-col justify-center p-8
          bg-slate-50
          dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800
          border-r border-slate-200 dark:border-slate-700
        ">
          <div className="mb-6">
            <Stethoscope className="w-9 h-9 text-blue-600 mb-2" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Join GBS DSS
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Explainable AI for clinical support
            </p>
          </div>

          <div className="
            relative rounded-xl overflow-hidden
            border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-900
            shadow-lg
          ">
            <img
              src={registerPreview}
              alt="GBS DSS system preview"
              className="w-full object-cover dark:opacity-90 dark:brightness-90"
            />
          </div>
        </div>

        {/* FORM PANEL */}
        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Create an account
            </h1>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Secure clinician registration.
          </p>

          {errorMsg && (
            <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <PasswordInput
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />

            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            {form.confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-500">
                Passwords do not match
              </p>
            )}

            <button
              disabled={loading || !passwordsMatch}
              className="
                w-full py-3 rounded-xl
                bg-blue-600 hover:bg-blue-700
                text-white font-semibold
                shadow-md hover:shadow-lg
                transition
                disabled:opacity-50
              "
            >
              {loading ? "Creating account…" : "Register"}
            </button>

            <p className="text-sm text-center text-slate-600 dark:text-slate-300">
              Already registered?
              <Link to="/login" className="ml-1 text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, onChange, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        {...props}
        onChange={onChange}
        required
        className="
          w-full px-4 py-3 rounded-xl
          border border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100
          placeholder-slate-400 dark:placeholder-slate-500
          shadow-sm dark:shadow-inner
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
      />
    </div>
  );
}
