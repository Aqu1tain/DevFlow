import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import AuthLayout, { Divider, GitHubButton, inputClass } from "../components/AuthLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const from = (location.state as { from?: string; upgrade?: boolean } | null);
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
    navigate(from?.from ?? "/snippets", { state: { upgrade: from?.upgrade } });
  };

  return (
    <AuthLayout
      subtitle="create account"
      footer={
        <p className="text-center text-xs text-gray-600">
          already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-mono">
            sign in
          </Link>
        </p>
      }
    >
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">username</label>
          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="john_doe" />
        </div>
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">confirm password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={loading} className="w-full px-4 py-2.5">
          {loading ? "creating account..." : "create account"}
        </Button>
      </form>

      <Divider />
      <GitHubButton />
    </AuthLayout>
  );
}
