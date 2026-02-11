import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GitHubCallbackPage from "./pages/GitHubCallbackPage";
import SnippetsPage from "./pages/SnippetsPage";
import CreateSnippetPage from "./pages/CreateSnippetPage";
import EditSnippetPage from "./pages/EditSnippetPage";
import ViewSnippetPage from "./pages/ViewSnippetPage";
import LivePage from "./pages/LivePage";
import AdminPage from "./pages/AdminPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";

function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-sans">
      <nav className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/snippets" className="text-base font-mono font-semibold tracking-tight">
            dev<span className="text-emerald-400">flow</span>
          </Link>
          {user && (
            <div className="flex items-center gap-4">
              {user.role === "admin" && (
                <>
                  <Link to="/admin" className="text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors">
                    moderation
                  </Link>
                  <Link to="/admin/analytics" className="text-xs font-mono text-rose-400 hover:text-rose-300 transition-colors">
                    analytics
                  </Link>
                </>
              )}
              <span className="text-xs font-mono text-gray-500">
                {user.isGuest ? "guest" : user.username}
              </span>
              <button
                onClick={logout}
                className="cursor-pointer text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors"
              >
                logout
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-5 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/snippets" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<GitHubCallbackPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/snippets" element={<SnippetsPage />} />
            <Route path="/snippets/new" element={<CreateSnippetPage />} />
            <Route path="/snippets/:id" element={<ViewSnippetPage />} />
            <Route path="/snippets/:id/edit" element={<EditSnippetPage />} />
            <Route path="/snippets/:id/live" element={<LivePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
