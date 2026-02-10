import { Link, useNavigate, useParams } from "react-router-dom";
import { snippetsApi } from "../services/api";
import useSnippet from "../hooks/useSnippet";
import CodeViewer from "../components/CodeViewer";

export default function ViewSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { snippet, loading, error } = useSnippet(id);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!snippet) return <p className="text-sm text-red-400">Snippet not found</p>;

  const handleDelete = async () => {
    if (!id) return;
    await snippetsApi.delete(id);
    navigate("/snippets");
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-mono font-medium">{snippet.title}</h1>
            {snippet.description && (
              <p className="text-sm text-gray-500 mt-1">{snippet.description}</p>
            )}
          </div>
          <div className="flex gap-2 text-xs shrink-0 ml-4">
            <Link
              to={`/snippets/${id}/edit`}
              className="text-gray-400 hover:text-white px-3 py-1.5 rounded-none border border-white/[0.08] hover:border-white/20 transition-colors font-mono"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="cursor-pointer text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-none border border-white/[0.08] hover:border-red-500/30 transition-colors font-mono"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5">
            {snippet.language}
          </span>
          {snippet.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <CodeViewer code={snippet.code} language={snippet.language} />
    </div>
  );
}
