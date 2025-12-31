import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { apiCall } from "@/auth";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const q = useQuery();
  const nav = useNavigate();

  const token = q.get("token") || "";
  const email = q.get("email") || "";

  const [password, setPassword] = React.useState("");
  const [password2, setPassword2] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!token || !email) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiCall("/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: password2,
        }),
      });

      setOk(res?.message || "Password reset successful. Redirecting to login...");
      setTimeout(() => nav("/", { replace: true }), 1200);
    } catch (err: any) {
      setError(err?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow">
        <h2 className="text-lg font-bold mb-1">Reset Password</h2>
        <p className="text-sm text-slate-600 mb-4">
          Resetting for <span className="font-medium">{email || "unknown email"}</span>
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Confirm new password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />

          {error && <div className="text-sm text-red-600">{error}</div>}
          {ok && <div className="text-sm text-green-700">{ok}</div>}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs">
          <Link to="/" className="text-sky-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
