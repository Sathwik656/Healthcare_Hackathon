import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Activity, ShieldCheck } from "lucide-react";
import api from "@/src/services/api";
import { useAuthStore } from "@/src/store/useAuthStore";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await api.post("/auth/verify-otp", { email, otp });

      const user = res.data?.data?.user;

      if (!user) {
        throw new Error("Invalid server response");
      }

      const role = user.roles?.[0];

      setUser({
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: role,
      });

      if (role === "patient") navigate("/patient/dashboard");
      else if (role === "doctor") navigate("/doctor/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
      else navigate("/");
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    setError("");
    try {
      setResending(true);
      await api.post("/auth/resend-otp", { email });
      setResent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  // Guard — if someone navigates here directly without an email
  if (!email) {
    navigate("/register");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center">
        <Activity className="h-6 w-6 text-green-600 mr-2" />
        <span className="text-xl font-bold tracking-tight text-slate-900">
          HealthCare
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-slate-100 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-800">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {resent && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg">
              A new code has been sent to your email.
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-2xl font-bold tracking-widest px-4 py-4 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-green-600 hover:text-green-500 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </p>

          <p className="text-center text-sm text-slate-500">
            Wrong email?{" "}
            <Link
              to="/register"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Go back
            </Link>
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} HealthCare Platform
      </footer>
    </div>
  );
};

export default VerifyOtp;
