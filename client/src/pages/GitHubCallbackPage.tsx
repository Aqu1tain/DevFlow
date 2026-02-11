import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token || params.get("error")) {
      navigate("/login?error=github_auth_failed");
      return;
    }

    loginWithToken(token).then((err) => navigate(err ? "/login" : "/snippets"));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-sm font-mono text-gray-500">authenticating...</p>
    </div>
  );
}
