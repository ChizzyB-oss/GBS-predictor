import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Activity,
  BarChart3,
  Stethoscope,
  Lock,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  FileText,
} from "lucide-react";
import dashboardPreview from "../assets/images/dashboard-preview.png";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-slate-900 dark:text-dark-text">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-nhs-lightBlue/20 blur-3xl dark:bg-nhs-lightBlue/10" />
        <div className="absolute bottom-[-160px] right-[-160px] h-[520px] w-[520px] rounded-full bg-nhs-aqua/20 blur-3xl dark:bg-nhs-aqua/10" />
      </div>

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/75 dark:bg-dark-bg/75 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-nhs-blue/10 dark:bg-nhs-blue/15 flex items-center justify-center border border-nhs-blue/15">
              <Brain className="w-6 h-6 text-nhs-blue" />
            </div>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">GBS DSS</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Decision support prototype
              </p>
            </div>
            <span className="hidden md:inline-flex ml-3 items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-dark-card/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Secure • Explainable • Research-ready
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-nhs-blue transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-nhs-blue text-white text-sm font-semibold shadow hover:bg-nhs-darkBlue transition"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-16 lg:pt-24 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-dark-card/40 text-sm">
              <Sparkles className="w-4 h-4 text-nhs-blue" />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Explainable AI for early GBS subtype assessment
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Clinical support for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nhs-blue to-nhs-aqua">
                GBS subtype identification
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl">
              A clinician-focused prototype combining structured patient inputs,
              electrophysiology features, and SHAP-based explainability to support
              transparent subtype prediction.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-nhs-blue text-white font-semibold shadow-lg hover:bg-nhs-darkBlue transition"
              >
                Launch Platform <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center px-7 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 font-semibold bg-white/60 dark:bg-dark-card/40 hover:bg-white dark:hover:bg-dark-card/60 transition"
              >
                Create Account
              </Link>
            </div>

            {/* concise value bullets (no repetition) */}
            <div className="pt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Confidence scoring
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                SHAP explainability
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Secure access control
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="relative"
          >
            <div className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-dark-card/40 shadow-2xl shadow-slate-900/10 p-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-dark-bg">
                <img
                  src={dashboardPreview}
                  alt="Clinical dashboard preview"
                  className="h-80 md:h-[420px] w-full object-cover"
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard preview</span>
                </div>
                <span className="text-xs px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-dark-card/50 text-slate-600 dark:text-slate-400">
                  Prototype UI
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= HOW IT WORKS TIMELINE ================= */}
      <section className="py-20 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm font-semibold text-nhs-blue">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
              A simple workflow clinicians can follow
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-4">
              The platform guides you from patient input to explainable results and reporting.
            </p>
          </div>

          <div className="relative">
            {/* line */}
            <div className="hidden md:block absolute left-6 top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Step
                number="01"
                icon={<ClipboardList className="w-5 h-5" />}
                title="Capture structured inputs"
                text="Enter demographic, clinical, CSF, and electrophysiological indicators using validated forms."
              />
              <Step
                number="02"
                icon={<Activity className="w-5 h-5" />}
                title="Run subtype prediction"
                text="The model returns the predicted subtype and a confidence score to support decision-making."
              />
              <Step
                number="03"
                icon={<Stethoscope className="w-5 h-5" />}
                title="Review SHAP explanations"
                text="Inspect feature attributions to understand which inputs drove the prediction."
              />
              <Step
                number="04"
                icon={<FileText className="w-5 h-5" />}
                title="Save & export results"
                text="Store prediction history and generate report-ready outputs for audit and documentation."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-20 border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <p className="text-sm font-semibold text-nhs-blue">Capabilities</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
              Designed for clinical and academic use
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mt-4">
              Built to support—never replace—clinical judgment, with secure foundations and transparent outputs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature icon={<Activity className="w-6 h-6" />} title="Structured patient inputs" text="Capture clinically meaningful indicators through consistent input schemas." />
            <Feature icon={<BarChart3 className="w-6 h-6" />} title="ML inference + confidence" text="Subtype prediction with confidence scoring to support interpretation." />
            <Feature icon={<Stethoscope className="w-6 h-6" />} title="Explainable outputs" text="SHAP-based explanations improve transparency and accountability." />
            <Feature icon={<Lock className="w-6 h-6" />} title="Security & access control" text="JWT authentication and role-based access for safe workflows." />
            <Feature icon={<ShieldCheck className="w-6 h-6" />} title="Ethical AI design" text="Designed to support clinical reasoning—not replace clinician judgment." />
            <Feature icon={<Brain className="w-6 h-6" />} title="Research-ready architecture" text="Modular services and reproducible ML pipeline for evaluation and iteration." />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-nhs-darkBlue to-nhs-blue p-10 md:p-14 text-white shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Ready to explore the system?
                </h2>
                <p className="mt-3 text-white/85 max-w-2xl">
                  Sign in to run predictions, review explainability, and manage clinician-focused workflows.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-white text-nhs-darkBlue font-semibold hover:opacity-95 transition"
                >
                  Sign In <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-7 py-3 rounded-2xl border border-white/25 bg-white/10 font-semibold hover:bg-white/15 transition"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* disclaimer (optional but professional) */}
          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Disclaimer: This system is a research prototype intended to support clinical reasoning and does not replace professional medical judgement.
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 border-t border-slate-200/70 dark:border-slate-800/70 text-center text-sm text-slate-600 dark:text-slate-400">
        © {new Date().getFullYear()} GBS Subtype Decision Support System · Developed by Chigozie Vivian Umeoka (MSc Software Engineering)
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="group bg-white/70 dark:bg-dark-card/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
      <div className="w-12 h-12 rounded-2xl bg-nhs-blue/10 text-nhs-blue flex items-center justify-center border border-nhs-blue/15 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg tracking-tight mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function Step({ number, icon, title, text }) {
  return (
    <div className="relative bg-white/70 dark:bg-dark-card/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div className="h-12 w-12 rounded-2xl bg-nhs-blue text-white flex items-center justify-center shadow">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {number}
            </span>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
