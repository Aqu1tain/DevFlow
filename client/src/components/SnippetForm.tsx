import { useState } from "react";
import Editor from "@monaco-editor/react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ title, language, description, code, tags });
  };

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <div>
          <label className="block text-xs font-mono text-gray-500 mb-1.5">Title</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled snippet"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-gray-500 mb-1.5">Language</label>
          <select
            className={inputClass}
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
      </div>

      <div>
        <label className="block text-xs font-mono text-gray-500 mb-1.5">
          Description
        </label>
        <input
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this snippet do?"
        />
      </div>

      <div>
        <label className="block text-xs font-mono text-gray-500 mb-1.5">Code</label>
        <div className="rounded-lg overflow-hidden border border-white/[0.06]">
          <Editor
            height="280px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? "")}
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
      </div>

      <div>
        <label className="block text-xs font-mono text-gray-500 mb-1.5">Tags</label>
        <input
          className={inputClass}
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="comma-separated, e.g. utility, react"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="text-sm bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-lg transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
