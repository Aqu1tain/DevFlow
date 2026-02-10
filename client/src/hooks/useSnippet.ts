import { useEffect, useState } from "react";
import { snippetsApi, type Snippet } from "../services/api";

export default function useSnippet(id: string | undefined) {
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

  return { snippet, loading, error };
}
