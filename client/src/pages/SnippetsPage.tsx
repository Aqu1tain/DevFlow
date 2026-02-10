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

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Snippets</h1>
        <Link
          to="/snippets/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
        >
          New Snippet
        </Link>
      </div>

      {snippets.length === 0 ? (
        <p className="text-gray-400">No snippets yet. Create one!</p>
      ) : (
        <div className="space-y-3">
          {snippets.map((s) => (
            <Link
              key={s._id}
              to={`/snippets/${s._id}`}
              className="block bg-gray-800 border border-gray-700 rounded p-4 hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                  {s.language}
                </span>
              </div>
              {s.description && (
                <p className="text-gray-400 text-sm mt-1">{s.description}</p>
              )}
              {s.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {s.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
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
