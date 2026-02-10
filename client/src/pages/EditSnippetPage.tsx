import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { snippetsApi, type Snippet, type SnippetInput } from "../services/api";
import SnippetForm from "../components/SnippetForm";

export default function EditSnippetPage() {
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

  const handleSubmit = async (data: SnippetInput) => {
    if (!id) return;
    await snippetsApi.update(id, data);
    navigate(`/snippets/${id}`);
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (error) return <p className="text-red-400">{error}</p>;
  if (!snippet) return <p className="text-red-400">Snippet not found</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Snippet</h1>
      <SnippetForm
        initial={snippet}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}
