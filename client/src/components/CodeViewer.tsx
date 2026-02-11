import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

const LINE_HEIGHT = 20;
const PADDING = 24;
const PADDING_TOP = 12;

const baseOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: LINE_HEIGHT,
  scrollBeyondLastLine: false,
  padding: { top: PADDING_TOP, bottom: 12 },
  renderLineHighlight: "none" as const,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  scrollbar: { vertical: "hidden" as const, horizontal: "auto" as const },
};

export function editorHeight(code: string, minLines = 1) {
  const lines = Math.max(code.split("\n").length, minLines);
  return lines * LINE_HEIGHT + PADDING;
}

export type EditorInstance = Parameters<OnMount>[0];

export type LineComment = {
  commentId: string;
  username: string;
  body: string;
};

interface Props {
  code: string;
  language: string;
  onCite?: (citation: string) => void;
  lineComments?: Map<number, LineComment[]>;
  editorInstanceRef?: React.MutableRefObject<EditorInstance | null>;
  onCommentClick?: (commentId: string) => void;
}

const CommentBubble = ({ count }: { count: number }) => (
  <span className="relative inline-flex items-center justify-center w-5 h-5">
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
      <path fill="rgba(16,185,129,0.5)" d="M1 2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6l-4 3.5V11H2a1 1 0 0 1-1-1V2z" />
    </svg>
    {count > 1 && (
      <span className="absolute -top-1 -right-1 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/20 rounded-full w-3.5 h-3.5 flex items-center justify-center">
        {count}
      </span>
    )}
  </span>
);

export default function CodeViewer({ code, language, onCite, lineComments, editorInstanceRef, onCommentClick }: Props) {
  const editorRef = useRef<EditorInstance | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [popoverLine, setPopoverLine] = useState<number | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    if (editorInstanceRef) editorInstanceRef.current = editor;

    if (!onCite) return;
    editor.addAction({
      id: "cite-in-comment",
      label: "Cite in comment",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1,
      run: (ed) => {
        const sel = ed.getSelection();
        if (!sel) return;
        const startLine = sel.startLineNumber;
        const endLine = sel.endLineNumber;
        const citation = startLine === endLine ? `@L${startLine}` : `@L${startLine}-${endLine}`;
        onCite(citation);
      },
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!lineComments || lineComments.size === 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const decorations = [...lineComments.keys()].map((line) => ({
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: { isWholeLine: true, className: "cited-line-highlight" },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, [lineComments]);

  useEffect(() => {
    if (popoverLine === null) return;
    const handle = (e: MouseEvent) => {
      const el = document.querySelector(".line-comments-popover");
      if (el && el.contains(e.target as Node)) return;
      setPopoverLine(null);
    };
    requestAnimationFrame(() => document.addEventListener("mousedown", handle));
    return () => document.removeEventListener("mousedown", handle);
  }, [popoverLine]);

  const hasGlyph = lineComments && lineComments.size > 0;
  const popoverComments = popoverLine !== null ? lineComments?.get(popoverLine) : null;
  const popoverTop = popoverLine !== null ? PADDING_TOP + (popoverLine - 1) * LINE_HEIGHT : 0;

  return (
    <div className="relative">
      <div className="rounded-lg overflow-hidden border border-white/[0.06]">
        <Editor
          height={`${editorHeight(code)}px`}
          language={language}
          theme="vs-dark"
          value={code}
          options={{ ...baseOptions, readOnly: true, glyphMargin: !!hasGlyph }}
          onMount={handleMount}
        />
      </div>

      {hasGlyph && (
        <div className="absolute left-0 top-0 z-[5] pointer-events-none" style={{ paddingTop: 1 + PADDING_TOP }}>
          {[...lineComments!.entries()].map(([line, comments]) => (
            <button
              key={line}
              className="absolute left-1.5 pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
              style={{ top: (line - 1) * LINE_HEIGHT }}
              onClick={() => setPopoverLine((prev) => (prev === line ? null : line))}
              title={`${comments.length} comment${comments.length > 1 ? "s" : ""}`}
            >
              <CommentBubble count={comments.length} />
            </button>
          ))}
        </div>
      )}

      {popoverLine !== null && popoverComments && (
        <div
          className="line-comments-popover absolute z-10 w-72 border border-white/[0.08] bg-[#0a0a0f] shadow-2xl"
          style={{ top: 1 + popoverTop, left: 44 }}
        >
          <div className="px-3 py-1.5 border-b border-white/[0.06] text-[10px] font-mono text-gray-500 lowercase">
            {popoverComments.length} comment{popoverComments.length > 1 ? "s" : ""} on line {popoverLine}
          </div>
          {popoverComments.map((c) => (
            <button
              key={c.commentId}
              onClick={() => {
                setPopoverLine(null);
                onCommentClick?.(c.commentId);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors"
            >
              <span className="text-[11px] font-mono text-emerald-400">{c.username}</span>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {c.body.replace(/@L\d+(-\d+)?/g, "").trim() || "line citation"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { baseOptions };
