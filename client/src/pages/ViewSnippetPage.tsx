import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { snippetsApi, type Comment } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSnippet from "../hooks/useSnippet";
import useComments from "../hooks/useComments";
import { parseCitations } from "../components/CommentBody";
import CodeViewer, { type EditorInstance, type LineComment } from "../components/CodeViewer";
import Comments from "../components/Comments";
import Button, { buttonClass } from "../components/Button";
import SnapshotPanel from "../components/SnapshotPanel";
import useSnapshots from "../hooks/useSnapshots";
import useExecution, { canRun } from "../hooks/useExecution";
import OutputPanel from "../components/OutputPanel";
import useAI from "../hooks/useAI";
import AIPanel from "../components/AIPanel";
import { visibilityStyle } from "../lib/visibility";

function buildLineComments(comments: Comment[], totalLines: number) {
  const map = new Map<number, LineComment[]>();

  for (const c of comments) {
    const entry: LineComment = { commentId: c._id, username: c.userId.username, body: c.body };
    for (const seg of parseCitations(c.body)) {
      if (seg.type !== "cite") continue;
      for (let line = seg.startLine; line <= seg.endLine; line++) {
        if (line < 1 || line > totalLines) continue;
        const existing = map.get(line) || [];
        if (!existing.some(e => e.commentId === c._id)) map.set(line, [...existing, entry]);
      }
    }
  }

  return map;
}

function flashElement(el: HTMLElement) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("comment-flash");
  el.addEventListener("animationend", () => el.classList.remove("comment-flash"), { once: true });
}

export default function ViewSnippetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { snippet, setSnippet, loading, error } = useSnippet(id);
  const { comments, loading: commentsLoading, error: commentsError, addComment, deleteComment } = useComments(id);
  const { snapshots, error: snapshotsError, createSnapshot, deleteSnapshot, restoreSnapshot } = useSnapshots(id);
  const { output, running, duration, run, clear } = useExecution();
  const ai = useAI();
  const [showHistory, setShowHistory] = useState(false);
  const citeRef = useRef<((citation: string) => void) | null>(null);
  const editorInstanceRef = useRef<EditorInstance | null>(null);

  const lineComments = useMemo(() => {
    if (!snippet) return new Map<number, LineComment[]>();
    return buildLineComments(comments, snippet.code.split("\n").length);
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
    if (el) flashElement(el);
  };

  const handleRestore = async (snapshotId: string) => {
    const updated = await restoreSnapshot(snapshotId);
    if (updated) setSnippet(updated);
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
              <Button variant="ghost" onClick={() => setShowHistory(!showHistory)} className="px-3 py-1.5">
                History
              </Button>
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

      {snapshotsError && (
        <p className="text-xs text-red-400 mb-4">{snapshotsError}</p>
      )}

      {showHistory && (
        <SnapshotPanel
          snapshots={snapshots}
          currentCode={snippet.code}
          currentLanguage={snippet.language}
          onCreate={createSnapshot}
          onRestore={handleRestore}
          onDelete={deleteSnapshot}
        />
      )}

      <CodeViewer
        code={snippet.code}
        language={snippet.language}
        onCite={(c) => citeRef.current?.(c)}
        lineComments={lineComments}
        editorInstanceRef={editorInstanceRef}
        onCommentClick={scrollToComment}
      />

      {user && (
        <div className="flex gap-2 py-2">
          {canRun(snippet.language) && (
            <Button
              variant="accent"
              className="px-3 py-1.5"
              onClick={() => run(snippet.code, snippet.language)}
              disabled={running}
            >
              {running ? "Running..." : "Run"}
            </Button>
          )}
          {user.userType === "pro" && (
            <>
              <Button
                variant="ghost"
                className="px-3 py-1.5"
                onClick={() => ai.ask(snippet.code, snippet.language, "explain")}
                disabled={ai.loading}
              >
                Explain
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-1.5"
                onClick={() => ai.ask(snippet.code, snippet.language, "correct")}
                disabled={ai.loading}
              >
                Correct
              </Button>
            </>
          )}
        </div>
      )}

      {output && <OutputPanel output={output} duration={duration} onClear={clear} />}

      {ai.action && (
        <AIPanel
          content={ai.content}
          action={ai.action}
          loading={ai.loading}
          error={ai.error}
          onClear={ai.clear}
        />
      )}

      <Comments
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
