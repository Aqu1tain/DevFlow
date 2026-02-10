import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { snippetsApi, type Snippet } from "../services/api";

export default function ViewSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    snippetsApi
      .getById(id)
      .then(setSnippet)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    await snippetsApi.delete(id);
    navigate("/snippets");
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!snippet) return <p className="text-red-400">Snippet not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{snippet.title}</h1>
        <div className="flex gap-2">
          <Link
            to={`/snippets/${id}/edit`}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <span className="text-sm bg-gray-700 px-2 py-1 rounded">
            {snippet.language}
          </span>
          {snippet.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        {snippet.description && (
          <p className="text-gray-400">{snippet.description}</p>
        )}

        <div className="border border-gray-700 rounded overflow-hidden">
          <Editor
            height="400px"
            language={snippet.language}
            theme="vs-dark"
            value={snippet.code}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
