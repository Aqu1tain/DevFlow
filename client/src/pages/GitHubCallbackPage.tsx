import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    window.history.replaceState(null, "", "/auth/callback");

    if (!token || params.get("error")) {
      navigate("/login?error=github_auth_failed", { replace: true });
      return;
    }

    loginWithToken(token).then((err) => {
      const redirect = sessionStorage.getItem("auth_redirect") ?? "/snippets";
      sessionStorage.removeItem("auth_redirect");
      navigate(err ? "/login" : redirect, { replace: true });
    });
  }, [navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-sm font-mono text-gray-500 animate-pulse">authenticating...</p>
    </div>
  );
}
