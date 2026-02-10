import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

const LINE_HEIGHT = 20;
const PADDING = 24;

const baseOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: LINE_HEIGHT,
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: 12 },
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

interface Props {
  code: string;
  language: string;
  onCite?: (citation: string) => void;
  citedLines?: Set<number>;
  editorInstanceRef?: React.MutableRefObject<EditorInstance | null>;
}

export default function CodeViewer({ code, language, onCite, citedLines, editorInstanceRef }: Props) {
  const editorRef = useRef<EditorInstance | null>(null);
  const decorationsRef = useRef<string[]>([]);

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
    if (!editor || !citedLines) return;

    const decorations = [...citedLines].map((line) => ({
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: {
        isWholeLine: true,
        className: "cited-line-highlight",
        glyphMarginClassName: "cited-line-glyph",
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decorations);
  }, [citedLines]);

  return (
    <div className="rounded-lg overflow-hidden border border-white/[0.06]">
      <Editor
        height={`${editorHeight(code)}px`}
        language={language}
        theme="vs-dark"
        value={code}
        options={{ ...baseOptions, readOnly: true, glyphMargin: !!citedLines?.size }}
        onMount={handleMount}
      />
    </div>
  );
}

export { baseOptions };
