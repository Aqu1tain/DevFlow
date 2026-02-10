import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");
    if (username.length < 3) return setError("Username must be at least 3 characters");

    setLoading(true);
    const err = await register(email, password, username);
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
          <p className="text-sm text-gray-500 mt-2 font-mono">create account</p>
        </div>

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="john_doe"
              />
            </div>

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

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-1.5">confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full px-4 py-2.5">
              {loading ? "creating account..." : "create account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600">
          already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-mono">
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
