import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Stethoscope,
  ShieldCheck,
  Activity,
  BarChart3,
  Lock,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-7 h-7 text-blue-600" />
            <span className="font-semibold tracking-tight">GBS DSS</span>
          </div>

          <nav className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-medium hover:text-blue-600">
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium dark:bg-blue-900/40 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4" /> Clinician Decision Support
            </span>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight">
              Intelligent Support for <br />
              <span className="text-blue-600">GBS Subtype Identification</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              A professional AI‑assisted clinical decision support system that integrates
              structured patient data, electrophysiology features, and SHAP‑based
              explainability to aid early Guillain–Barré Syndrome subtype assessment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
              >
                Launch Platform <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Create Account
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Explainable AI</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Research‑oriented</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure by Design</span>
            </div>
          </motion.div>

          {/* Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 p-8">
              <div className="h-72 rounded-2xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-center text-slate-600 dark:text-slate-300 font-medium">
                Clinical Dashboard Preview<br />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Designed for Clinical & Academic Use</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Feature
              icon={<Activity className="w-6 h-6" />}
              title="Structured Patient Inputs"
              text="Demographic, clinical, and electrophysiological features captured using validated input forms."
            />
            <Feature
              icon={<BarChart3 className="w-6 h-6" />}
              title="Machine Learning Inference"
              text="Trained ML models provide subtype predictions with confidence scoring and auditability."
            />
            <Feature
              icon={<Stethoscope className="w-6 h-6" />}
              title="Explainable Outputs"
              text="SHAP‑based visual explanations support transparency and clinical reasoning."
            />
            <Feature
              icon={<Lock className="w-6 h-6" />}
              title="Security & Access Control"
              text="JWT authentication, role‑based access, and audit‑ready workflows."
            />
            <Feature
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Ethical AI Design"
              text="Built to support—not replace—clinical judgement, aligned with academic ethics guidance."
            />
            <Feature
              icon={<Brain className="w-6 h-6" />}
              title="Research‑Ready Architecture"
              text="Modular backend and reproducible ML pipeline suitable for MSc and PhD‑level research."
            />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Explore the System?</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Access the platform to explore predictions, interpretability outputs,
            and clinician‑focused workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
        © {new Date().getFullYear()} GBS Subtype Decision Support System · Developed by Chigozie Vivian Umeoka (MSc Software Engineering)
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition">
      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm">{text}</p>
    </div>
  );
}
