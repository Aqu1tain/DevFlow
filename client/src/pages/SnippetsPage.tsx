import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { snippetsApi, type Snippet } from "../services/api";

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    snippetsApi
      .getAll()
      .then(setSnippets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-mono font-medium">snippets</h1>
        <Link
          to="/snippets/new"
          className="text-xs font-mono text-emerald-400 hover:text-black hover:bg-emerald-400 border border-emerald-400/30 px-3 py-1.5 transition-colors"
        >
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
                <span className="text-[11px] text-gray-500 font-mono">
                  {s.language}
                </span>
              </div>
              {s.description && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {s.description}
                </p>
              )}
              {s.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
