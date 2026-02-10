import { Link, useNavigate, useParams } from "react-router-dom";
import { snippetsApi, type SnippetInput } from "../services/api";
import useSnippet from "../hooks/useSnippet";
import SnippetForm from "../components/SnippetForm";
import { buttonClass } from "../components/Button";

export default function EditSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { snippet, loading, error } = useSnippet(id);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!snippet) return <p className="text-sm text-red-400">Snippet not found</p>;

  const save = async (data: SnippetInput) => {
    if (!id) return;
    await snippetsApi.update(id, data);
  };

  const handleSubmit = async (data: SnippetInput) => {
    await save(data);
    navigate(`/snippets/${id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-mono font-medium">edit snippet</h1>
        <Link to={`/snippets/${id}/live`} className={buttonClass("accent", "px-3 py-1.5")}>
          Go Live
        </Link>
      </div>
      <SnippetForm initial={snippet} onSubmit={handleSubmit} onSave={save} submitLabel="Save" />
    </div>
  );
}
