import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

const LINE_HEIGHT = 20;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 12;
const PADDING = PADDING_TOP + PADDING_BOTTOM;

const FONT_SIZE_KEY = "devflow_editor_font_size";
const DEFAULT_FONT_SIZE = 14;

export function getEditorFontSize() {
  return parseInt(localStorage.getItem(FONT_SIZE_KEY) || String(DEFAULT_FONT_SIZE));
}

function baseOptions() {
  return {
    minimap: { enabled: false },
    fontSize: getEditorFontSize(),
    lineHeight: LINE_HEIGHT,
    scrollBeyondLastLine: false,
    padding: { top: PADDING_TOP, bottom: PADDING_BOTTOM },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: { vertical: "hidden" as const, horizontal: "auto" as const },
  };
}

export function editorHeight(code: string, minLines = 1) {
  return Math.max(code.split("\n").length, minLines) * LINE_HEIGHT + PADDING;
}

function lineTop(line: number) {
  return 1 + PADDING_TOP + (line - 1) * LINE_HEIGHT;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

function stripCitations(text: string) {
  return text.replace(/@L\d+(-\d+)?/g, "").trim() || "line citation";
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

function CommentBubble({ count }: { count: number }) {
  return (
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
}

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
        const { startLineNumber: start, endLineNumber: end } = sel;
        onCite(start === end ? `@L${start}` : `@L${start}-${end}`);
      },
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!lineComments?.size) {
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
    const close = (e: MouseEvent) => {
      const popover = document.querySelector(".line-comments-popover");
      if (popover?.contains(e.target as Node)) return;
      setPopoverLine(null);
    };
    requestAnimationFrame(() => document.addEventListener("mousedown", close));
    return () => document.removeEventListener("mousedown", close);
  }, [popoverLine]);

  const hasComments = lineComments && lineComments.size > 0;
  const popoverComments = popoverLine !== null ? lineComments?.get(popoverLine) : null;

  return (
    <div className="relative overflow-visible">
      <div className="rounded-lg overflow-hidden border border-white/[0.06]">
        <Editor
          height={`${editorHeight(code)}px`}
          language={language}
          theme="vs-dark"
          value={code}
          options={{ ...baseOptions(), readOnly: true, glyphMargin: !!hasComments }}
          onMount={handleMount}
        />
      </div>

      {hasComments && (
        <div className="absolute left-0 top-0 z-[5] pointer-events-none">
          {[...lineComments!.entries()].map(([line, comments]) => (
            <button
              key={line}
              className="absolute left-1.5 pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
              style={{ top: lineTop(line) }}
              onClick={() => setPopoverLine(prev => prev === line ? null : line)}
              title={plural(comments.length, "comment")}
            >
              <CommentBubble count={comments.length} />
            </button>
          ))}
        </div>
      )}

      {popoverLine !== null && popoverComments && (
        <div
          className="line-comments-popover absolute z-10 w-72 border border-white/[0.08] bg-[#0a0a0f] shadow-2xl"
          style={{ top: lineTop(popoverLine), left: 44 }}
        >
          <div className="px-3 py-1.5 border-b border-white/[0.06] text-[10px] font-mono text-gray-500 lowercase">
            {plural(popoverComments.length, "comment")} on line {popoverLine}
          </div>
          {popoverComments.map((c) => (
            <button
              key={c.commentId}
              onClick={() => { setPopoverLine(null); onCommentClick?.(c.commentId); }}
              className="w-full text-left px-3 py-2 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors"
            >
              <span className="text-[11px] font-mono text-emerald-400">{c.username}</span>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{stripCitations(c.body)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { baseOptions, FONT_SIZE_KEY };
