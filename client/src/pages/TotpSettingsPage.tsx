import { useState } from "react";
import { Navigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import Button from "../components/Button";
import { inputClass } from "../components/AuthLayout";

type Step = "idle" | "setup";

export default function TotpSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (user?.isGuest) return <Navigate to="/snippets" replace />;

  const totpEnabled = user!.totpEnabled;

  const startSetup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.setupTotp();
      setSecret(res.secret);
      setUri(res.uri);
      setStep("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start setup");
    } finally {
      setLoading(false);
    }
  };

  const enable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.enableTotp(secret, code);
      await refreshUser();
      setSuccess("2FA enabled. Use your authenticator app for future logins.");
      setStep("idle");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const disable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.disableTotp(disableCode);
      await refreshUser();
      setSuccess("2FA disabled.");
      setDisableCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <h1 className="text-lg font-mono font-medium">two-factor authentication</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          {totpEnabled ? "2FA is enabled on your account" : "2FA is not enabled"}
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
              <QRCodeSVG value={uri} size={180} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-mono text-gray-600">or enter the secret manually:</p>
              <code className="text-xs font-mono text-emerald-400 break-all">{secret}</code>
            </div>
          </div>

          <form onSubmit={enable} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">enter the 6-digit code to confirm</label>
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
        <form onSubmit={disable} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">enter your current code to disable 2FA</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={inputClass}
              placeholder="000000"
            />
          </div>
          <Button type="submit" variant="danger" disabled={loading || disableCode.length !== 6} className="px-4 py-2.5">
            {loading ? "disabling..." : "disable 2FA"}
          </Button>
        </form>
      )}
    </div>
  );
}
