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
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!token || !email) return setError("Invalid reset link. Request a new one.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const res = await apiCall("/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: confirm,
        }),
      });
      setOk(res?.message || "Password reset successful. Redirecting…");
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
        <h1 className="text-lg font-bold">Reset Password</h1>
        <p className="text-sm text-slate-600 mt-1 mb-4">
          Account: <span className="font-medium">{email || "unknown"}</span>
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error && <div className="text-sm text-red-600">{error}</div>}
          {ok && <div className="text-sm text-green-700">{ok}</div>}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <Link to="/" className="text-sky-600 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
