import { useEffect, useState } from "react";
import { commentsApi, type Comment } from "../services/api";

export default function useComments(snippetId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!snippetId) return;
    commentsApi
      .getAll(snippetId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [snippetId]);

  const addComment = async (body: string) => {
    if (!snippetId) return;
    const comment = await commentsApi.create(snippetId, body);
    setComments((prev) => [comment, ...prev]);
  };

  const deleteComment = async (commentId: string) => {
    if (!snippetId) return;
    await commentsApi.delete(snippetId, commentId);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  return { comments, loading, addComment, deleteComment };
}
