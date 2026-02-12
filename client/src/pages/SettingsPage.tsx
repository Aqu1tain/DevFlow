import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { authApi, billingApi, profileApi } from "../services/api";
import { isPro as checkPro, isStripeUrl } from "../lib/user";
import Button from "../components/Button";
import { inputClass } from "../components/AuthLayout";

const FONT_SIZE_KEY = "devflow_editor_font_size";

type TotpStep = "idle" | "setup";

function TotpSection() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<TotpStep>("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const totpEnabled = user!.totpEnabled;

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const startSetup = () => run(async () => {
    const res = await authApi.setupTotp();
    setSecret(res.secret);
    setUri(res.uri);
    setStep("setup");
  });

  const enable = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await authApi.enableTotp(secret, code);
      await refreshUser();
      setSuccess("2FA enabled. Use your authenticator app for future logins.");
      setStep("idle");
      setCode("");
    });
  };

  const disable = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await authApi.disableTotp(code);
      await refreshUser();
      setSuccess("2FA disabled.");
      setCode("");
    });
  };

  const codeInput = (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      required
      autoFocus
      value={code}
      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className={inputClass}
      placeholder="000000"
    />
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-mono font-medium text-gray-300">two-factor authentication</p>
        <p className="text-xs text-gray-600 mt-0.5 font-mono">
          {totpEnabled ? "enabled" : "not enabled"}
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 font-mono">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 font-mono">{success}</p>
      )}

      {!totpEnabled && step === "idle" && (
        <Button onClick={startSetup} disabled={loading} className="px-4 py-2.5">
          {loading ? "loading..." : "set up 2FA"}
        </Button>
      )}

      {step === "setup" && (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-mono text-gray-400">
              scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="bg-white p-3 inline-block">
              <QRCodeSVG value={uri} size={160} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-mono text-gray-600">or enter the secret manually:</p>
              <code className="text-xs font-mono text-emerald-400 break-all">{secret}</code>
            </div>
          </div>

          <form onSubmit={enable} className="space-y-4 max-w-xs">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">enter the 6-digit code to confirm</label>
              {codeInput}
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading || code.length !== 6} className="px-4 py-2.5">
                {loading ? "enabling..." : "enable 2FA"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setStep("idle"); setCode(""); setError(""); }}
                className="px-4 py-2.5"
              >
                cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {totpEnabled && (
        <form onSubmit={disable} className="space-y-4 max-w-xs">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">enter your current code to disable 2FA</label>
            {codeInput}
          </div>
          <Button type="submit" variant="danger" disabled={loading || code.length !== 6} className="px-4 py-2.5">
            {loading ? "disabling..." : "disable 2FA"}
          </Button>
        </form>
      )}
    </div>
  );
}

function BillingSection() {
  const { user, refreshUser } = useAuth();
  const isPro = checkPro(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const upgrade = () => run(async () => {
    const { url } = await billingApi.checkout();
    if (!isStripeUrl(url)) throw new Error("Invalid redirect URL");
    window.location.href = url;
  });

  const manage = () => run(async () => {
    const { url } = await billingApi.portal();
    if (!isStripeUrl(url)) throw new Error("Invalid redirect URL");
    window.location.href = url;
  });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("upgraded") === "true") {
      refreshUser();
    }
  }, [refreshUser]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-mono font-medium text-gray-300">plan</p>
        <p className="text-xs text-gray-600 mt-0.5 font-mono">{isPro ? "pro" : "free"}</p>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 font-mono">{error}</p>
      )}

      {isPro ? (
        <Button onClick={manage} disabled={loading} variant="ghost" className="px-4 py-2.5">
          {loading ? "loading..." : "manage subscription"}
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-mono text-gray-500">upgrade to Pro to unlock private snippets</p>
          <Button onClick={upgrade} disabled={loading} variant="accent" className="px-4 py-2.5">
            {loading ? "loading..." : "upgrade to Pro"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState(user!.username);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await profileApi.update({ username });
      await refreshUser();
      setSuccess("Username updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-mono font-medium text-gray-300">username</p>
        <p className="text-xs text-gray-600 mt-0.5 font-mono">2-30 characters, letters, numbers, _ or -</p>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 font-mono">{error}</p>
      )}
      {success && (
        <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 font-mono">{success}</p>
      )}

      <form onSubmit={save} className="flex gap-3 items-start max-w-xs">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
        <Button type="submit" disabled={loading || username === user!.username} className="px-4 py-2.5 shrink-0">
          {loading ? "saving..." : "save"}
        </Button>
      </form>
    </div>
  );
}

function EditorSection() {
  const [fontSize, setFontSize] = useState(() =>
    parseInt(localStorage.getItem(FONT_SIZE_KEY) || "14"),
  );

  const handleChange = (value: number) => {
    setFontSize(value);
    localStorage.setItem(FONT_SIZE_KEY, String(value));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-mono font-medium text-gray-300">editor font size</p>
        <p className="text-xs text-gray-600 mt-0.5 font-mono">{fontSize}px</p>
      </div>

      <input
        type="range"
        min={12}
        max={24}
        value={fontSize}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        className="w-full max-w-xs accent-emerald-500"
      />

      <div
        className="border border-white/[0.06] bg-white/[0.02] px-4 py-3 font-mono text-gray-300 overflow-x-auto"
        style={{ fontSize: `${fontSize}px` }}
      >
        const greeting = "hello, world";
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  if (user?.isGuest) return <Navigate to="/snippets" replace />;

  return (
    <div className="max-w-lg space-y-10">
      <h1 className="text-lg font-mono font-medium">settings</h1>

      <section className="space-y-6">
        <div className="border-b border-white/[0.06] pb-2">
          <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest">profile</h2>
        </div>
        <ProfileSection />
      </section>

      <section className="space-y-6">
        <div className="border-b border-white/[0.06] pb-2">
          <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest">billing</h2>
        </div>
        <BillingSection />
      </section>

      <section className="space-y-6">
        <div className="border-b border-white/[0.06] pb-2">
          <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest">security</h2>
        </div>
        <TotpSection />
      </section>

      <section className="space-y-6">
        <div className="border-b border-white/[0.06] pb-2">
          <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest">editor</h2>
        </div>
        <EditorSection />
      </section>
    </div>
  );
}
