export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="
        w-full mt-12 py-8
        border-t border-slate-200 dark:border-slate-800
        bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950
      "
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-2 text-center">

        {/* SYSTEM NAME */}
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          GBS Subtype Decision Support System
        </p>

        {/* VERSION + STATUS */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span
            className="
              px-2 py-0.5 rounded-md
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              font-medium
            "
          >
            v1.0.0 · Research Prototype
          </span>

          <span className="hidden sm:inline text-slate-400">•</span>

          <span className="hidden sm:inline">
            Explainable AI enabled
          </span>
        </div>

        {/* DECISION SUPPORT DISCLAIMER (VERY SUBTLE) */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-3xl">
          This system is intended to support clinical decision-making and does not
          replace professional judgement.
        </p>

        {/* DEVELOPER CREDIT */}
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
          © {new Date().getFullYear()} · Developed by Chigozie Vivian Umeoka, MSc Software Engineering
        </p>
      </div>
    </footer>
  );
}
