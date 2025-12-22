import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

export default function LoginMFA() {
  const navigate = useNavigate();
  const { tempMfaToken, verifyOtp } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!tempMfaToken) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        No MFA session found. Please log in again.
      </div>
    );
  }

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await verifyOtp(otp);

      // role preserved correctly
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/clinician/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid verification code");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-white text-center">
          Multi-Factor Authentication
        </h1>

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="w-full text-center text-lg tracking-widest bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
        />

        <button
          onClick={handleVerify}
          disabled={otp.length !== 6 || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
        >
          {loading ? "Verifying…" : "Verify Code"}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
