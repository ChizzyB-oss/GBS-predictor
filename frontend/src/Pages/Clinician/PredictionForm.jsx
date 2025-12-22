import { useState } from "react";
import {
  HeartPulse,
  Activity,
  Stethoscope,
  Brain,
  Thermometer,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../Components/DashboardLayout";
import { useAuth } from "../../Context/AuthContext";

export default function PredictionForm() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    csf_protein: "",
    muscle_weakness: false,
    paralysis: false,
    sensory_loss: false,
    reflex_loss: false,
    respiratory_involvement: false,
    cranial_nerve_involvement: false,
    motor_velocity: "",
    sensory_velocity: "",
    amplitude: "",
    f_wave_latency: "",
    conduction_block: false,
    previous_infection: "",
    onset_speed: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // ---------------------------
  // Change handler
  // ---------------------------
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Clinical pill style (UNCHANGED)
  const symptomPillClasses = (active) =>
    [
      "flex items-center justify-between gap-2 px-4 py-2 rounded-md text-sm font-medium",
      "border transition-colors",
      active
        ? "bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-700 dark:text-blue-300"
        : "bg-white dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
    ].join(" ");

  // UNIVERSAL input/select style (UNCHANGED)
  const inputBase =
    "w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 " +
    "text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 " +
    "focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none";

  // ---------------------------
  // Submit handler
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!token) {
        alert("Not authenticated. Please log in again.");
        setIsLoading(false);
        return;
      }

      const payload = {
        ...formData,
        muscle_weakness: formData.muscle_weakness ? 1 : 0,
        paralysis: formData.paralysis ? 1 : 0,
        sensory_loss: formData.sensory_loss ? 1 : 0,
        reflex_loss: formData.reflex_loss ? 1 : 0,
        respiratory_involvement: formData.respiratory_involvement ? 1 : 0,
        cranial_nerve_involvement: formData.cranial_nerve_involvement ? 1 : 0,
        conduction_block: formData.conduction_block ? 1 : 0,
      };

      const res = await fetch(
        "http://127.0.0.1:8000/api/predictions/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("Prediction error:", err);
        alert("Prediction failed");
        setIsLoading(false);
        return;
      }

      const result = await res.json();

      navigate(`/prediction-result/${result.id}`, {
  state: { result },
});

    } catch (error) {
      console.error("Network error:", error);
      alert("Unable to connect to server");
    }

    setIsLoading(false);
  };

  // ---------------------------
  // Reset form
  // ---------------------------
  const resetForm = () => {
    setFormData({
      age: "",
      gender: "",
      csf_protein: "",
      muscle_weakness: false,
      paralysis: false,
      sensory_loss: false,
      reflex_loss: false,
      respiratory_involvement: false,
      cranial_nerve_involvement: false,
      motor_velocity: "",
      sensory_velocity: "",
      amplitude: "",
      f_wave_latency: "",
      conduction_block: false,
      previous_infection: "",
      onset_speed: "",
    });
    setPrediction(null);
  };

  return (
    <DashboardLayout>
      <div className="w-full flex justify-center animate-fadeIn">
        <div className="w-full max-w-5xl space-y-8">
          {/* PAGE HEADER */}
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-7 h-7 text-blue-600" />
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  New GBS Subtype Prediction
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Structured clinical intake for Guillain–Barré Syndrome subtype prediction.
                </p>
              </div>
            </div>
          </header>

          {/* FORM START */}
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ======================= PATIENT INFO ======================= */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">
                
                {/* Left Panel */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Patient Information
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Basic demographics required for baseline risk estimation.
                  </p>
                </div>

                {/* Right Panel */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="e.g. 45"
                        className={inputBase}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                  </div>
                </div>

              </div>
            </section>

            {/* ======================= CSF SECTION ======================= */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">

                {/* Left */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Cerebrospinal Fluid
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    CSF protein elevation supports albuminocytologic dissociation.
                  </p>
                </div>

                {/* Right */}
                <div className="p-6">
                  <div className="max-w-sm">
                    <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                      CSF Protein (mg/dL) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      name="csf_protein"
                      value={formData.csf_protein}
                      onChange={handleChange}
                      placeholder="e.g. 85.6"
                      className={inputBase}
                    />
                  </div>
                </div>

              </div>
            </section>

            {/* ================== NEUROLOGICAL SYMPTOMS ================== */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">
                
                {/* Left */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Neurological Symptoms
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Core clinical features that drive subtype differentiation.
                  </p>
                </div>

                {/* Right */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ["muscle_weakness", "Muscle Weakness"],
                      ["paralysis", "Paralysis"],
                      ["sensory_loss", "Sensory Loss"],
                      ["reflex_loss", "Reflex Loss"],
                      ["respiratory_involvement", "Respiratory Involvement"],
                      ["cranial_nerve_involvement", "Cranial Nerve Involvement"],
                      ["conduction_block", "Conduction Block"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className={symptomPillClasses(formData[key])}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full border ${
                              formData[key]
                                ? "bg-blue-600 border-blue-600"
                                : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500"
                            }`}
                          ></span>
                          {label}
                        </span>
                        <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {formData[key] ? "Present" : "Absent"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* ================== ELECTROPHYSIOLOGY ================== */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">

                {/* Left */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Electrophysiological Findings
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nerve conduction parameters help differentiate subtypes.
                  </p>
                </div>

                {/* Right */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      ["motor_velocity", "Motor Nerve Velocity (m/s)"],
                      ["sensory_velocity", "Sensory Nerve Velocity (m/s)"],
                      ["amplitude", "Amplitude (mV)"],
                      ["f_wave_latency", "F-wave Latency (ms)"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                          {label}
                        </label>
                        <input
                          type="number"
                          name={key}
                          value={formData[key]}
                          onChange={handleChange}
                          className={inputBase}
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>

            {/* ================== CLINICAL BACKGROUND ================== */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[260px,1fr]">

                {/* Left */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Clinical Background
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Context including infection and onset profile.
                  </p>
                </div>

                {/* Right */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                        Previous Infection
                      </label>
                      <select
                        name="previous_infection"
                        value={formData.previous_infection}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option value="">Select…</option>
                        <option value="respiratory">Respiratory</option>
                        <option value="gi">Gastrointestinal</option>
                        <option value="none">None</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                        Onset Speed
                      </label>
                      <select
                        name="onset_speed"
                        value={formData.onset_speed}
                        onChange={handleChange}
                        className={inputBase}
                      >
                        <option value="">Select…</option>
                        <option value="acute">Acute (&lt; 1 week)</option>
                        <option value="subacute">Subacute (1–4 weeks)</option>
                        <option value="chronic">Chronic (&gt; 4 weeks)</option>
                      </select>
                    </div>

                  </div>
                </div>

              </div>
            </section>

{/* ================== ACTION BUTTONS ================== */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="
                  px-5 py-2.5 rounded-md border border-slate-300 
                  dark:border-slate-700 text-sm font-medium 
                  text-slate-700 dark:text-slate-300 
                  bg-white dark:bg-slate-900 
                  hover:bg-slate-50 dark:hover:bg-slate-800
                "
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="
                  inline-flex items-center gap-2 px-6 py-2.5 rounded-md 
                  bg-blue-600 text-white text-sm font-medium 
                  hover:bg-blue-700 transition-colors 
                  disabled:opacity-50
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  "Predict Subtype"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
