import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { SnippetInput, Visibility } from "../services/api";
import { baseOptions, editorHeight } from "./CodeViewer";
import { useAuth } from "../context/AuthContext";
import { isPro as checkPro } from "../lib/user";
import Button from "./Button";
import OutputPanel from "./OutputPanel";
import UpgradeModal from "./UpgradeModal";
import useExecution, { canRun } from "../hooks/useExecution";
import useUpgrade from "../hooks/useUpgrade";

const LANGUAGES = ["javascript", "typescript", "python", "html", "css", "json", "markdown"];
const MIN_LINES = 12;

interface Props {
  initial?: Partial<SnippetInput>;
  onSubmit: (data: SnippetInput) => void;
  onSave?: (data: SnippetInput) => void | Promise<void>;
  submitLabel: string;
}

function parseTags(input: string) {
  return input.split(",").map((t) => t.trim()).filter(Boolean);
}

const VISIBILITIES: Visibility[] = ["public", "unlisted", "private"];

export default function SnippetForm({ initial, onSubmit, onSave, submitLabel }: Props) {
  const { user } = useAuth();
  const isPro = checkPro(user);
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "javascript");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "public");
  const [tagsInput, setTagsInput] = useState(initial?.tags?.join(", ") ?? "");
  const { output, running, duration, run, clear } = useExecution();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const upgrade = useUpgrade((location.state as { upgrade?: boolean })?.upgrade ?? false);
  const editorRef = useRef<HTMLDivElement>(null);

  const getData = useCallback(
    () => ({ title, language, description, code, tags: parseTags(tagsInput), visibility }),
    [title, language, description, code, tagsInput, visibility],
  );

  const flashSaved = () => {
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  useEffect(() => {
    if (!onSave) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave(getData());
        flashSaved();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave, getData]);

  const scrollCursorIntoView = (editor: Parameters<OnMount>[0]) => {
    const pos = editor.getPosition();
    if (!pos || !editorRef.current) return;
    const lineTop = editorRef.current.getBoundingClientRect().top + pos.lineNumber * 20;
    const viewportBottom = window.innerHeight - 60;
    if (lineTop > viewportBottom) {
      window.scrollBy({ top: lineTop - viewportBottom + 40, behavior: "smooth" });
    }
  };

  const handleMount: OnMount = (editor) => {
    const scroll = () => requestAnimationFrame(() => scrollCursorIntoView(editor));
    editor.onDidChangeModelContent(scroll);
    editor.onDidChangeCursorPosition(scroll);

    const dom = editor.getDomNode();
    if (dom) {
      dom.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          window.scrollBy({ top: e.deltaY });
        }
      }, { passive: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(getData());
  };

  const transparent = "bg-transparent border-none text-sm text-gray-200 placeholder-gray-600 focus:outline-none";

  return (
    <>
    {upgrade.open && (
      <UpgradeModal
        onUpgrade={upgrade.checkout}
        onClose={() => upgrade.setOpen(false)}
        loading={upgrade.loading}
        error={upgrade.error}
      />
    )}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2">
          <input
            className={`${transparent} flex-1 font-mono font-medium`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled snippet"
            required
          />
          <select
            className="bg-transparent text-xs font-mono text-gray-400 focus:outline-none cursor-pointer"
            value={visibility}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "private" && !isPro) {
                if (user?.isGuest) return navigate("/register", { state: { from: location.pathname, upgrade: true } });
                return upgrade.setOpen(true);
              }
              setVisibility(v as Visibility);
            }}
          >
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {v === "private" && !isPro ? "private (pro)" : v}
              </option>
            ))}
          </select>
          <select
            className="bg-transparent text-xs font-mono text-emerald-400 focus:outline-none cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="px-3 py-2">
          <input
            className={`${transparent} w-full text-xs`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
        </div>
      </div>

      <div ref={editorRef} className="rounded-lg overflow-hidden border border-white/[0.06]">
        <Editor
          height={`${editorHeight(code, MIN_LINES)}px`}
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          onMount={handleMount}
          options={baseOptions()}
        />
      </div>

      {output && <OutputPanel output={output} duration={duration} onClear={clear} />}

      <div className="sticky bottom-0 bg-[#0a0a0f] border-t border-white/[0.06] -mx-5 px-5 py-3 flex items-center justify-between gap-4">
        <input
          className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-none px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="tags: comma-separated"
        />
        <div className="flex items-center gap-3 shrink-0">
          {saveStatus === "saved" && (
            <span className="text-[11px] font-mono text-emerald-400 animate-pulse">saved</span>
          )}
          {canRun(language) && (
            <Button
              type="button"
              variant="accent"
              className="px-4 py-2"
              onClick={() => run(code, language)}
              disabled={running}
            >
              {running ? "Running..." : "Run"}
            </Button>
          )}
          <Button type="submit" className="px-5 py-2">
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
    </>
  );
}
