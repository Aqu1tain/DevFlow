import { useNavigate } from "react-router-dom";
import { snippetsApi, type SnippetInput } from "../services/api";
import SnippetForm from "../components/SnippetForm";

export default function CreateSnippetPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: SnippetInput) => {
    const snippet = await snippetsApi.create(data);
    navigate(`/snippets/${snippet._id}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Snippet</h1>
      <SnippetForm onSubmit={handleSubmit} submitLabel="Create Snippet" />
    </div>
  );
}
