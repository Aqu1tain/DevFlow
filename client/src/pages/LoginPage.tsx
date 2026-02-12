import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import AuthLayout, { Divider, GitHubButton, inputClass } from "../components/AuthLayout";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/snippets";

  const submit = async (action: () => Promise<string | null>) => {
    setLoading(true);
    setError("");
    const err = await action();
    if (err) { setError(err); setLoading(false); return; }
    navigate(from, { replace: true });
  };

  return (
    <AuthLayout
      subtitle="sign in"
      footer={
        <>
          <p className="text-center text-xs text-gray-600">
            no account?{" "}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-mono">
              register
            </Link>
          </p>
          <p className="text-center text-[11px] text-gray-700 font-mono">
            guest sessions expire after 24h
          </p>
        </>
      }
    >
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submit(() => login(email, password)); }} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={loading} className="w-full px-4 py-2.5">
          {loading ? "signing in..." : "sign in"}
        </Button>
      </form>

      <Divider />

      <div className="space-y-2.5">
        <GitHubButton redirectTo={from} />
        <Button variant="ghost" onClick={() => submit(loginAsGuest)} disabled={loading} className="w-full px-4 py-2.5">
          continue as guest
        </Button>
      </div>
    </AuthLayout>
  );
}
