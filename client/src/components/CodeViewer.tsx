import Editor from "@monaco-editor/react";

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

interface Props {
  code: string;
  language: string;
}

export default function CodeViewer({ code, language }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/[0.06]">
      <Editor
        height={`${editorHeight(code)}px`}
        language={language}
        theme="vs-dark"
        value={code}
        options={{ ...baseOptions, readOnly: true }}
      />
    </div>
  );
}

export { baseOptions };
