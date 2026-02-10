import { useNavigate, useParams } from "react-router-dom";
import { snippetsApi, type SnippetInput } from "../services/api";
import useSnippet from "../hooks/useSnippet";
import SnippetForm from "../components/SnippetForm";

export default function EditSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { snippet, loading, error } = useSnippet(id);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!snippet) return <p className="text-sm text-red-400">Snippet not found</p>;

  const handleSubmit = async (data: SnippetInput) => {
    if (!id) return;
    await snippetsApi.update(id, data);
    navigate(`/snippets/${id}`);
  };

  return (
    <div>
      <h1 className="text-lg font-mono font-medium mb-6">edit snippet</h1>
      <SnippetForm initial={snippet} onSubmit={handleSubmit} submitLabel="Save" />
    </div>
  );
}
