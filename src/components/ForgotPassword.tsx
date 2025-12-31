import React from "react";
import { apiCall } from "@/auth";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await apiCall("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(res.message || "Reset link sent.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border p-6 shadow">
        <h2 className="text-lg font-bold mb-2">Forgot Password</h2>
        <p className="text-sm text-slate-600 mb-4">
          Enter your email to receive a reset link.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email address"
            className="w-full rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {message && <div className="text-green-600 text-sm">{message}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2 rounded-lg"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-xs text-center">
          <Link to="/" className="text-sky-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
