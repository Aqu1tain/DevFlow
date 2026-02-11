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

export default function CodeViewer({ code, language, onCite, lineComments, editorInstanceRef, onCommentClick }: Props) {
  const editorRef = useRef<EditorInstance | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const lineCommentsRef = useRef(lineComments);
  lineCommentsRef.current = lineComments;
  const [popoverLine, setPopoverLine] = useState<number | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    if (editorInstanceRef) editorInstanceRef.current = editor;

    editor.onMouseDown((e) => {
      if (e.target.type !== monaco.editor.MouseTargetType.GLYPH_MARGIN) return;
      const line = e.target.position?.lineNumber;
      if (!line || !lineCommentsRef.current?.has(line)) return;
      setPopoverLine((prev) => (prev === line ? null : line));
    });

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

    const decorations = [...lineComments.entries()].map(([line, comments]) => ({
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: "cited-line-highlight",
        glyphMarginClassName: "cited-line-glyph",
        glyphMarginHoverMessage: { value: `**${comments.length}** comment${comments.length > 1 ? "s" : ""} — click to view` },
      },
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

  const popoverComments = popoverLine !== null ? lineComments?.get(popoverLine) : null;
  const popoverTop = popoverLine !== null ? 1 + PADDING_TOP + (popoverLine - 1) * LINE_HEIGHT : 0;
  const hasGlyph = lineComments && lineComments.size > 0;

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
      {popoverLine !== null && popoverComments && (
        <div
          className="line-comments-popover absolute z-10 left-10 w-72 border border-white/[0.1] bg-[#1e1e1e] shadow-xl"
          style={{ top: popoverTop }}
        >
          <div className="px-3 py-1.5 border-b border-white/[0.08] text-[10px] font-mono text-gray-500">
            {popoverComments.length} comment{popoverComments.length > 1 ? "s" : ""} on line {popoverLine}
          </div>
          {popoverComments.map((c) => (
            <button
              key={c.commentId}
              onClick={() => {
                setPopoverLine(null);
                onCommentClick?.(c.commentId);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0 cursor-pointer"
            >
              <span className="text-xs font-mono text-emerald-400">{c.username}</span>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {c.body.replace(/@L\d+(-\d+)?/g, "").trim() || "Line citation"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { baseOptions };
