import { useMemo, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { snippetsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSnippet from "../hooks/useSnippet";
import useComments from "../hooks/useComments";
import { CITE_RE } from "../components/CommentBody";
import CodeViewer, { type EditorInstance, type LineComment } from "../components/CodeViewer";
import Comments from "../components/Comments";
import Button, { buttonClass } from "../components/Button";
import { visibilityStyle } from "../lib/visibility";

export default function ViewSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { snippet, loading, error } = useSnippet(id);
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(id);
  const citeRef = useRef<((citation: string) => void) | null>(null);
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  const lineComments = useMemo(() => {
    if (!snippet) return new Map<number, LineComment[]>();
    const totalLines = snippet.code.split("\n").length;
    const map = new Map<number, LineComment[]>();
    for (const c of comments) {
      for (const m of c.body.matchAll(new RegExp(CITE_RE.source, "g"))) {
        const start = parseInt(m[1]);
        const end = m[2] ? parseInt(m[2]) : start;
        const entry: LineComment = { commentId: c._id, username: c.userId.username, body: c.body };
        for (let i = start; i <= end; i++) {
          if (i < 1 || i > totalLines) continue;
          const existing = map.get(i) || [];
          if (!existing.some((e) => e.commentId === entry.commentId)) map.set(i, [...existing, entry]);
        }
      }
    }
    return map;
  }, [comments, snippet]);

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!snippet) return <p className="text-sm text-red-400">Snippet not found</p>;

  const isOwner = !!user && user.id === snippet.userId;
  const canEdit = snippet.visibility === "public" || isOwner;

  const handleCiteClick = (line: number) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  };

  const scrollToComment = (commentId: string) => {
    const el = document.getElementById(`comment-${commentId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("comment-flash");
    el.addEventListener("animationend", () => el.classList.remove("comment-flash"), { once: true });
  };

  const handleDelete = async () => {
    if (!id) return;
    await snippetsApi.delete(id);
    navigate("/snippets");
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-mono font-medium">{snippet.title}</h1>
            {snippet.description && (
              <p className="text-sm text-gray-500 mt-1">{snippet.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <Link to={`/snippets/${id}/live`} className={buttonClass("accent", "px-3 py-1.5")}>
              Go Live
            </Link>
            {canEdit && (
              <Link to={`/snippets/${id}/edit`} className={buttonClass("ghost", "px-3 py-1.5")}>
                Edit
              </Link>
            )}
            {isOwner && (
              <Button variant="danger" onClick={handleDelete} className="px-3 py-1.5">
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className={`text-[11px] font-mono px-2 py-0.5 ${visibilityStyle[snippet.visibility].color} ${visibilityStyle[snippet.visibility].bg}`}>
            {snippet.visibility}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5">
            {snippet.language}
          </span>
          {snippet.tags.map((tag) => (
            <span key={tag} className="text-[10px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5">
              {tag}
            </span>
          ))}
          {!canEdit && (
            <span className="text-[10px] font-mono text-gray-500 italic">read-only</span>
          )}
        </div>
      </div>

      <CodeViewer
        code={snippet.code}
        language={snippet.language}
        onCite={(c) => citeRef.current?.(c)}
        lineComments={lineComments}
        editorInstanceRef={editorInstanceRef}
        onCommentClick={scrollToComment}
      />

      <Comments
        snippetId={snippet._id}
        visibility={snippet.visibility}
        code={snippet.code}
        citeRef={citeRef}
        comments={comments}
        commentsLoading={commentsLoading}
        addComment={addComment}
        deleteComment={deleteComment}
        onCiteClick={handleCiteClick}
        snippetUpdatedAt={snippet.updatedAt}
      />
    </div>
  );
}
