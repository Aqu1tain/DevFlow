import { Link, useNavigate, useParams } from "react-router-dom";
import { snippetsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSnippet from "../hooks/useSnippet";
import CodeViewer from "../components/CodeViewer";
import Button, { buttonClass } from "../components/Button";
import { visibilityStyle } from "../lib/visibility";

export default function ViewSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { snippet, loading, error } = useSnippet(id);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!snippet) return <p className="text-sm text-red-400">Snippet not found</p>;

  const isOwner = !!user && user.id === snippet.userId;
  const canEdit = snippet.visibility === "public" || isOwner;

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
          <div className="flex gap-2 shrink-0 ml-4">
            {canEdit && (
              <Link to={`/snippets/${id}/edit`} className={buttonClass("ghost", "px-3 py-1.5")}>
                Edit
              </Link>
            )}
            {isOwner && (
              <Button variant="danger" onClick={handleDelete} className="px-3 py-1.5">
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className={`text-[11px] font-mono px-2 py-0.5 ${visibilityStyle[snippet.visibility].color} ${visibilityStyle[snippet.visibility].bg}`}>
            {snippet.visibility}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5">
            {snippet.language}
          </span>
          {snippet.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5">
              {tag}
            </span>
          ))}
          {!canEdit && (
            <span className="text-[10px] font-mono text-gray-500 italic">read-only</span>
          )}
        </div>
      </div>

      <CodeViewer code={snippet.code} language={snippet.language} />
    </div>
  );
}
