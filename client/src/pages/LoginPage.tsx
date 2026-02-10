import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (action: () => Promise<string | null>) => {
    setLoading(true);
    setError("");
    const err = await action();
    if (err) { setError(err); setLoading(false); return; }
    navigate("/snippets");
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.06] rounded-none px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-semibold tracking-tight">
            dev<span className="text-emerald-400">flow</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-mono">sign in</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
          )}

          <form onSubmit={(e) => { e.preventDefault(); submit(() => login(email, password)); }} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full text-xs font-mono bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-none transition-colors disabled:opacity-50"
            >
              {loading ? "signing in..." : "sign in"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a0a0f] px-3 text-[11px] text-gray-600 font-mono">or</span>
            </div>
          </div>

          <button
            onClick={() => submit(loginAsGuest)}
            disabled={loading}
            className="cursor-pointer w-full text-xs font-mono text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-4 py-2.5 rounded-none transition-colors disabled:opacity-50"
          >
            continue as guest
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          no account?{" "}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-mono">
            register
          </Link>
        </p>

        <p className="text-center text-[11px] text-gray-700 font-mono">
          guest sessions expire after 24h
        </p>
      </div>
    </div>
  );
}
