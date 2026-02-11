import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import CommentBody, { parseCitations, hasCitations } from "./CommentBody";
import type { Comment, Visibility } from "../services/api";

function HighlightedOverlay({ text }: { text: string }) {
  return (
    <div aria-hidden className="absolute inset-0 px-3 py-2 text-sm whitespace-pre-wrap break-words pointer-events-none">
      {parseCitations(text).map((seg, i) =>
        seg.type === "cite" ? (
          <mark key={i} className="bg-emerald-500/15 text-emerald-400 rounded-sm px-0.5">{seg.raw}</mark>
        ) : (
          <span key={i} className="text-gray-300">{seg.value}</span>
        ),
      )}
    </div>
  );
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface Props {
  visibility: Visibility;
  code: string;
  citeRef?: MutableRefObject<((citation: string) => void) | null>;
  comments: Comment[];
  commentsLoading: boolean;
  addComment: (body: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  onCiteClick?: (line: number) => void;
  snippetUpdatedAt: string;
}

export default function Comments({ visibility, code, citeRef, comments, commentsLoading, addComment, deleteComment, onCiteClick, snippetUpdatedAt }: Props) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!citeRef) return;
    citeRef.current = (citation: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const { selectionStart: start, selectionEnd: end } = ta;
      const before = body.slice(0, start);
      const after = body.slice(end);
      const pad = before.length > 0 && !before.endsWith(" ") ? " " : "";
      setBody(before + pad + citation + " " + after);
      requestAnimationFrame(() => {
        const pos = start + pad.length + citation.length + 1;
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    };
    return () => { citeRef.current = null; };
  }, [citeRef, body]);

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

  const isStale = (comment: Comment) =>
    hasCitations(comment.body) && new Date(snippetUpdatedAt) > new Date(comment.createdAt);

  return (
    <div className="mt-8">
      <h2 className="text-sm font-mono lowercase text-gray-400 mb-4">
        comments {!commentsLoading && `(${comments.length})`}
      </h2>

      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <HighlightedOverlay text={body} />
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="write a comment... (use @L5 or @L3-7 to cite lines)"
              maxLength={2000}
              rows={3}
              className="relative w-full bg-white/[0.03] border border-white/[0.08] rounded-none px-3 py-2 text-sm text-transparent caret-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button variant="primary" disabled={submitting || !body.trim()} className="px-3 py-1.5">
              {submitting ? "posting..." : "post"}
            </Button>
          </div>
        </form>
      )}

      {commentsLoading && <p className="text-sm text-gray-500 animate-pulse">Loading comments...</p>}

      <div className="space-y-3">
        {comments.map((comment) => {
          const stale = isStale(comment);
          return (
            <div
              key={comment._id}
              id={`comment-${comment._id}`}
              className={`border p-3 ${stale ? "border-amber-500/15 bg-amber-500/[0.02]" : "border-white/[0.08] bg-white/[0.02]"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400">{comment.userId.username}</span>
                  <span className="text-[11px] text-gray-600">{timeAgo(comment.createdAt)}</span>
                  {stale && (
                    <span className="text-[10px] font-mono text-amber-400/70" title="code was edited after this comment — line references may be outdated">
                      outdated
                    </span>
                  )}
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
              <CommentBody body={comment.body} code={code} onCiteClick={onCiteClick} stale={stale} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
