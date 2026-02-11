import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminSnippet } from "../services/api";
import { visibilityStyle } from "../lib/visibility";
import Button from "../components/Button";

function SnippetRow({ snippet, onDelete }: { snippet: AdminSnippet; onDelete: (id: string) => void }) {
  const vis = visibilityStyle[snippet.visibility];
  return (
    <div className="flex items-center justify-between px-4 py-3.5 -mx-4 rounded-lg hover:bg-white/[0.03] transition-colors group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <Link
            to={`/snippets/${snippet._id}`}
            className="text-sm font-mono font-medium text-gray-200 group-hover:text-white transition-colors truncate"
          >
            {snippet.title}
          </Link>
          <span className="text-[11px] font-mono text-gray-500 shrink-0">{snippet.language}</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 shrink-0 ${vis.color} ${vis.bg}`}>
            {snippet.visibility}
          </span>
        </div>
        <p className="text-[11px] font-mono text-gray-600 mt-0.5">{snippet.userId.username}</p>
      </div>
      <Button
        variant="danger"
        onClick={() => onDelete(snippet._id)}
        className="px-3 py-1.5 ml-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        delete
      </Button>
    </div>
  );
}

export default function AdminPage() {
  const [snippets, setSnippets] = useState<AdminSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getSnippets()
      .then(setSnippets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const deleteSnippet = async (id: string) => {
    await adminApi.deleteSnippet(id);
    setSnippets((prev) => prev.filter((s) => s._id !== id));
  };

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-lg font-mono font-medium">admin</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">{snippets.length} snippets total</p>
      </div>

      {snippets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-20">No snippets</p>
      ) : (
        <div className="space-y-px">
          {snippets.map((s) => (
            <SnippetRow key={s._id} snippet={s} onDelete={deleteSnippet} />
          ))}
        </div>
      )}
    </div>
  );
}
