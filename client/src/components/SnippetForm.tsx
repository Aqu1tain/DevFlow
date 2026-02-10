import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { SnippetInput } from "../services/api";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "json",
  "markdown",
];

const MIN_EDITOR_LINES = 12;

interface Props {
  initial?: Partial<SnippetInput>;
  onSubmit: (data: SnippetInput) => void;
  submitLabel: string;
}

export default function SnippetForm({ initial, onSubmit, submitLabel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "javascript");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [tagsInput, setTagsInput] = useState(
    initial?.tags?.join(", ") ?? ""
  );
  const editorRef = useRef<HTMLDivElement>(null);

  const handleEditorMount: OnMount = (editor) => {
    editor.onDidChangeModelContent(() => {
      const pos = editor.getPosition();
      if (pos) {
        requestAnimationFrame(() => {
          editorRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ title, language, description, code, tags });
  };

  const lineCount = Math.max(code.split("\n").length, MIN_EDITOR_LINES);
  const editorHeight = lineCount * 20 + 24;

  const inputClass =
    "bg-transparent border-none text-sm text-gray-200 placeholder-gray-600 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Metadata bar */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2">
          <input
            className={`${inputClass} flex-1 font-mono font-medium`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled snippet"
            required
          />
          <select
            className="bg-transparent text-xs font-mono text-amber-400 focus:outline-none cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="px-3 py-2">
          <input
            className={`${inputClass} w-full text-xs`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
        </div>
      </div>

      {/* Code editor — the main character */}
      <div ref={editorRef} className="rounded-lg overflow-hidden border border-white/[0.06]">
        <Editor
          height={`${editorHeight}px`}
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: "hidden", horizontal: "hidden" },
          }}
        />
      </div>

      {/* Footer: tags + submit */}
      <div className="flex items-center justify-between gap-4">
        <input
          className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-none px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors font-mono"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="tags: comma-separated"
        />
        <button
          type="submit"
          className="cursor-pointer text-xs font-mono bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 rounded-none transition-colors shrink-0"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
