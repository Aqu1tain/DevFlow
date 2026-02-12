import { useEffect, useState } from "react";
import { commentsApi, type Comment } from "../services/api";

export default function useComments(snippetId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!snippetId) return;
    commentsApi
      .getAll(snippetId)
      .then(setComments)
      .catch(() => setError("Failed to load comments"))
      .finally(() => setLoading(false));
  }, [snippetId]);

  const addComment = async (body: string) => {
    if (!snippetId) return false;
    try {
      const comment = await commentsApi.create(snippetId, body);
      setComments((prev) => [comment, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!snippetId) return;
    try {
      await commentsApi.delete(snippetId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  return { comments, loading, error, addComment, deleteComment };
}
