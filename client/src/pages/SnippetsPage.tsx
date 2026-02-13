import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { snippetsApi, type Snippet } from "../services/api";
import { buttonClass } from "../components/Button";
import { visibilityStyle } from "../lib/visibility";
import { useAuth } from "../context/AuthContext";
import { isPro as checkPro } from "../lib/user";

const BANNER_KEY = "pro_banner_dismissed";

export default function SnippetsPage() {
  const { user } = useAuth();
  const isPro = checkPro(user);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem(BANNER_KEY) === "true"
  );

  const dismissBanner = () => {
    localStorage.setItem(BANNER_KEY, "true");
    setBannerDismissed(true);
  };

  const loadPage = (p: number) => {
    setLoading(true);
    snippetsApi
      .getAll(p)
      .then(({ data, total, pages }) => {
        setSnippets(data);
        setTotal(total);
        setPages(pages);
        setPage(p);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPage(1); }, []);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div>
      {!isPro && !user?.isGuest && !bannerDismissed && (
        <div className="flex items-center justify-between mb-6 px-4 py-3 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs font-mono text-gray-400">keep your code private with Pro</p>
          <div className="flex items-center gap-4">
            <Link to="/settings" className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors">
              upgrade
            </Link>
            <button onClick={dismissBanner} className="text-xs font-mono text-gray-600 hover:text-gray-400 transition-colors">
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-mono font-medium">snippets</h1>
        <Link to="/snippets/new" className={buttonClass("accent", "px-3 py-1.5")}>
          + new
        </Link>
      </div>

      {snippets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">No snippets yet</p>
          <Link
            to="/snippets/new"
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
          >
            Create your first snippet
          </Link>
        </div>
      ) : (
        <div className="space-y-px">
          {snippets.map((s) => (
            <Link
              key={s._id}
              to={`/snippets/${s._id}`}
              className="group block px-4 py-3.5 -mx-4 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-mono font-medium text-gray-200 group-hover:text-white transition-colors">
                  {s.title}
                </h2>
                <span className="text-[11px] text-gray-500 font-mono">{s.language}</span>
                {s.visibility !== "public" && (
                  <span className={`text-[10px] font-mono ${visibilityStyle(s.visibility).color}`}>
                    {s.visibility}
                  </span>
                )}
              </div>
              {s.description && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.description}</p>
              )}
              {s.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {s.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => loadPage(page - 1)}
            disabled={page <= 1}
            className="text-xs font-mono text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← prev
          </button>
          <span className="text-xs font-mono text-gray-600">
            {page} / {pages.toLocaleString()} — {total.toLocaleString()} snippets
          </span>
          <button
            onClick={() => loadPage(page + 1)}
            disabled={page >= pages}
            className="text-xs font-mono text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            next →
          </button>
        </div>
      )}
    </div>
  );
}
