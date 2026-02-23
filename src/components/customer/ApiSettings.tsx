// src/components/customer/ApiSettings.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Settings as SettingsIcon, KeyRound, Plug } from "lucide-react";

type Settings = {
  openai_api_key?: string | null;
  blotato_api_key?: string | null;
  //dumplingai_api_key?: string | null;

  blotato_twitter_id?: string | null;
  blotato_linkeidin_id?: string | null; // keep current backend key
  blotato_facebook_id?: string | null;
  blotato_tiktok_id?: string | null;
  blotato_instagram_id?: string | null;
  blotato_threads_id?: string | null;
  blotato_pinterest_id?: string | null;
  blotato_bluesky_id?: string | null;
  blotato_youtube_id?: string | null;

  blotato_facebook_page_ids?: string[] | null;
  blotato_linkeidin_page_ids?: string[] | null; // keep current backend key

  // NEW: LinkedIn on/off for frontend usage
  blotato_linkeidin_active?: boolean | null;
};

type CustomerMeta = {
  id: number;
  customer_id?: number; // from /customers/me sometimes
  customer_number?: string | null;
  business_name?: string | null;
  user?: { name?: string | null } | null;
};

/* =========================
   API helper (Bearer only)
   ========================= */
const API_BASE = `${import.meta.env.VITE_API_BASE}/api`;
const TOKEN_KEY = "toma_token";

function norm(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`.replace(/([^:]\/)\/+/g, "$1");
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(norm(path), {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = text || res.statusText || "Request failed";
    try {
      const j = JSON.parse(text);
      msg = j?.message || msg;
    } catch {}
    const err = new Error(`HTTP ${res.status}: ${msg}`) as any;
    err.status = res.status;
    throw err;
  }

  const ct = res.headers.get("content-type") || "";
  return (ct.includes("application/json") ? await res.json() : (undefined as any)) as T;
}

/* =========================
   Helpers
   ========================= */
function textToIdArray(txt: string): string[] {
  return txt
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function arrayToText(arr?: string[] | null): string {
  return (arr ?? []).join(", ");
}
function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["1", "true", "yes", "on"].includes(v.toLowerCase());
  return false;
}

/** ✅ Same idea as NewBlogContents.tsx: get customer_id from /customers/me */
async function getCustomerIdFromAuth(): Promise<number> {
  const res = await api<any>("/customers/me");
  const data = res?.data ?? res;
  const id = Number(data?.customer_id ?? data?.id ?? 0);
  if (!id || Number.isNaN(id)) throw new Error("Failed to resolve customer_id from /customers/me");
  return id;
}

/* =========================
   Component
   ========================= */
export default function ApiSettings() {
  const nav = useNavigate();
  const location = useLocation();

  const [customerId, setCustomerId] = React.useState<number | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [authIssue, setAuthIssue] = React.useState<null | { code: number; text: string }>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [showKey, setShowKey] = React.useState<Record<string, boolean>>({});
  const [form, setForm] = React.useState<Settings>({});

  const [fbPagesText, setFbPagesText] = React.useState("");
  const [liPagesText, setLiPagesText] = React.useState("");

  const [customer, setCustomer] = React.useState<CustomerMeta | null>(null);

  // ✅ Resolve customer id for /customer/Settings route (no params)
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = await getCustomerIdFromAuth();
        if (!alive) return;
        setCustomerId(id);
      } catch (e: any) {
        if (!alive) return;
        const msg = e?.message || "Failed to fetch customer id";
        setError(msg);
        toast.error(msg);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load settings + customer meta (after customerId exists)
  React.useEffect(() => {
    if (!customerId) return;

    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      setAuthIssue(null);
      try {
        const [settingsRes, customerRes] = await Promise.allSettled([
          api<any>(`/settings?customer_id=${customerId}`),
          api<any>(`/customers/${customerId}`),
        ]);

        if (!alive) return;

        if (settingsRes.status === "fulfilled") {
          const raw: Settings = settingsRes.value?.data ?? settingsRes.value ?? {};
          const data: Settings = {
            ...raw,
            blotato_linkeidin_active: toBool(raw.blotato_linkeidin_active),
          };
          setForm(data);
          setFbPagesText(arrayToText(data.blotato_facebook_page_ids));
          setLiPagesText(arrayToText(data.blotato_linkeidin_page_ids));
        } else {
          const e: any = settingsRes.reason;
          if (e?.status === 401 || e?.status === 419) {
            setAuthIssue({ code: e.status, text: "Unauthenticated. Please sign in again." });
            toast.warn("Session expired. Please sign in again.");
          } else if (e?.status === 403) {
            setAuthIssue({ code: e.status, text: "Forbidden. You lack permission to view settings." });
            toast.error("You don’t have permission to view these settings.");
          } else {
            const m = e?.message || "Failed to load settings.";
            setError(m);
            toast.error(m);
          }
        }

        if (customerRes.status === "fulfilled") {
          const c: CustomerMeta = customerRes.value?.data ?? customerRes.value ?? null;
          if (c) setCustomer(c);
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [customerId]);

  const onChange =
    (key: keyof Settings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const toggleShow = (key: string) => setShowKey((s) => ({ ...s, [key]: !s[key] }));

  const save = async () => {
    if (!customerId) return;

    setSaving(true);
    setError(null);
    setAuthIssue(null);

    const payload: Settings = {
      ...form,
      blotato_facebook_page_ids: textToIdArray(fbPagesText),
      blotato_linkeidin_page_ids: textToIdArray(liPagesText),
      blotato_linkeidin_active: !!form.blotato_linkeidin_active,
    };

    try {
      await api<any>(`/settings?customer_id=${customerId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.success("Settings saved.");
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 419) {
        setAuthIssue({ code: e.status, text: "Unauthenticated. Please sign in again." });
        toast.warn("Session expired. Please sign in again.");
      } else if (e?.status === 403) {
        setAuthIssue({ code: e.status, text: "Forbidden. You lack permission to modify settings." });
        toast.error("You don’t have permission to modify these settings.");
      } else {
        const m = e?.message || "Save failed";
        setError(m);
        toast.error(m);
      }
    } finally {
      setSaving(false);
    }
  };

  if (authIssue) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon size={20} />
          <h1 className="text-xl font-semibold">Integration Settings</h1>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 mb-4">
          {authIssue.text}
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg bg-black text-white px-4 py-2" onClick={() => nav("/", { replace: true })}>
            Go to Login
          </button>
          <button className="rounded-lg border px-4 py-2" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-6">Loading settings…</div>;

  const maskedInput = (label: string, field: keyof Settings) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={showKey[field as string] ? "text" : "password"}
          className="w-full rounded-md border px-3 py-2"
          value={(form[field] as string) || ""}
          onChange={onChange(field)}
          placeholder={`Enter ${label}`}
          autoComplete="off"
        />
        <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => toggleShow(field as string)}>
          {showKey[field as string] ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  const textInput = (label: string, field: keyof Settings, placeholder?: string) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        className="w-full rounded-md border px-3 py-2"
        value={(form[field] as string) || ""}
        onChange={onChange(field)}
        placeholder={placeholder}
      />
    </div>
  );

  const displayNumber = customer?.customer_number ?? (customerId ? `${customerId}` : "—");
  const displayName = customer?.business_name || customer?.user?.name || "—";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon size={22} />
            <h1 className="text-2xl font-semibold">Integration Settings</h1>
          </div>
          <p className="text-sm text-slate-500">
            Customer #{displayNumber} • {displayName}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Debug: <span className="font-mono">{location.pathname}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={18} />
            <h2 className="font-medium">API Keys</h2>
          </div>
          {maskedInput("OpenAI API Key", "openai_api_key")}
          {maskedInput("Blotato API Key", "blotato_api_key")}
          {/*{maskedInput("DumplingAI API Key", "dumplingai_api_key")}*/}
        </section>

        <section className="rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plug size={18} />
            <h2 className="font-medium">Blotato Account IDs</h2>
          </div>

          {textInput("Twitter ID", "blotato_twitter_id")}

          <div className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium mb-1">LinkedIn ID</label>

              <button
                type="button"
                role="switch"
                aria-checked={!!form.blotato_linkeidin_active}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    blotato_linkeidin_active: !toBool(f.blotato_linkeidin_active),
                  }))
                }
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                  !!form.blotato_linkeidin_active ? "bg-emerald-500" : "bg-slate-300",
                ].join(" ")}
                title={!!form.blotato_linkeidin_active ? "LinkedIn: Active" : "LinkedIn: Inactive"}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                    !!form.blotato_linkeidin_active ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            <input
              type="text"
              className="mt-2 w-full rounded-md border px-3 py-2"
              value={form.blotato_linkeidin_id || ""}
              onChange={onChange("blotato_linkeidin_id")}
              placeholder="urn:li:person:..., or account ID"
            />

            <p className="mt-1 text-xs text-slate-500">
              Status:{" "}
              {form.blotato_linkeidin_active
                ? "Active (shown/used on frontend)"
                : "Inactive (hidden/ignored on frontend)"}
            </p>
          </div>

          {textInput("Facebook ID", "blotato_facebook_id")}
          {textInput("TikTok ID", "blotato_tiktok_id")}
          {textInput("Instagram ID", "blotato_instagram_id")}
          {textInput("Threads ID", "blotato_threads_id")}
          {textInput("Pinterest ID", "blotato_pinterest_id")}
          {textInput("Bluesky ID", "blotato_bluesky_id")}
          {textInput("YouTube ID", "blotato_youtube_id")}
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-medium mb-3">Page IDs (Multiple)</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Facebook Page IDs (comma separated — e.g., 9927653170252, 9927653170252)
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-2 min-h-[80px]"
              value={fbPagesText}
              onChange={(e) => setFbPagesText(e.target.value)}
              placeholder="123, 456, 789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              LinkedIn Page IDs (comma separated — e.g., urn:li:organization:123, urn:li:organization:456)
            </label>
            <textarea
              className="w-full rounded-md border px-3 py-2 min-h-[80px]"
              value={liPagesText}
              onChange={(e) => setLiPagesText(e.target.value)}
              placeholder="urn:li:organization:123, urn:li:organization:456"
            />
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">{error}</div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
