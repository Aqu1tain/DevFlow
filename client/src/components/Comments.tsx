import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useComments from "../hooks/useComments";
import Button from "./Button";
import type { Visibility } from "../services/api";

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  snippetId: string;
  visibility: Visibility;
}

export default function Comments({ snippetId, visibility }: Props) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(snippetId);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (visibility === "private") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await addComment(body.trim());
      setBody("");
    } finally {
      setSubmitting(false);
    }
  };

  const canDelete = (authorId: string) =>
    user && (user.id === authorId || user.role === "admin");

  return (
    <div className="mt-8">
      <h2 className="text-sm font-mono lowercase text-gray-400 mb-4">
        comments {!loading && `(${comments.length})`}
      </h2>

      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="write a comment..."
            maxLength={2000}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-none px-3 py-2 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/40"
          />
          <div className="flex justify-end mt-2">
            <Button variant="primary" disabled={submitting || !body.trim()} className="px-3 py-1.5">
              {submitting ? "posting..." : "post"}
            </Button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-gray-500 animate-pulse">Loading comments...</p>}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment._id} className="border border-white/[0.08] bg-white/[0.02] p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400">{comment.userId.username}</span>
                <span className="text-[11px] text-gray-600">{timeAgo(comment.createdAt)}</span>
              </div>
              {canDelete(comment.userId._id) && (
                <button
                  onClick={() => deleteComment(comment._id)}
                  className="text-[11px] text-gray-600 hover:text-red-400 font-mono cursor-pointer"
                >
                  delete
                </button>
              )}
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
