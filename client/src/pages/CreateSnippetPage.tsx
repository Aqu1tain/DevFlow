import { useNavigate } from "react-router-dom";
import { snippetsApi, type SnippetInput } from "../services/api";
import SnippetForm from "../components/SnippetForm";

export default function CreateSnippetPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: SnippetInput) => {
    const snippet = await snippetsApi.create(data);
    navigate(`/snippets/${snippet._id}`);
  };

  const handleSave = async (data: SnippetInput) => {
    const snippet = await snippetsApi.create(data);
    navigate(`/snippets/${snippet._id}/edit`, { replace: true });
  };

  return (
    <div>
      <h1 className="text-lg font-mono font-medium mb-6">new snippet</h1>
      <SnippetForm onSubmit={handleSubmit} onSave={handleSave} submitLabel="Create" />
    </div>
  );
}
