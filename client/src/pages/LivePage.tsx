import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Editor, { type OnMount } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useLiveCoding } from "../hooks/useLiveCoding";
import useSnippet from "../hooks/useSnippet";
import { snippetsApi } from "../services/api";
import Button, { buttonClass } from "../components/Button";
import { baseOptions } from "../components/CodeViewer";

export default function LivePage() {
  const { id } = useParams<{ id: string }>();
  const { snippet, loading, error } = useSnippet(id);
  const { doc, provider, users, mode, isHost, setMode, isSynced } = useLiveCoding(id);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [editor, setEditor] = useState<Parameters<OnMount>[0] | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [copied, setCopied] = useState(false);

  const readOnly = mode === "visible" && !isHost;

  const handleMount: OnMount = (ed) => setEditor(ed);

  useEffect(() => {
    if (!editor || !doc || !provider || !isSynced) return;

    const model = editor.getModel();
    if (!model) return;

    bindingRef.current = new MonacoBinding(
      doc.getText("code"),
      model,
      new Set([editor]),
      provider.awareness,
    );

    const style = document.createElement("style");
    document.head.appendChild(style);

    const updateCursorStyles = () => {
      const rules: string[] = [];
      provider.awareness.getStates().forEach((state, clientID) => {
        if (clientID === doc.clientID || !state.user) return;
        const { color, name } = state.user;
        rules.push(`
          .yRemoteSelection-${clientID} {
            background-color: ${color}33;
          }
          .yRemoteSelectionHead-${clientID} {
            position: absolute;
            border-left: 2px solid ${color};
            border-top: 2px solid ${color};
            height: 100% !important;
          }
          .yRemoteSelectionHead-${clientID}::after {
            content: "${name}";
            position: absolute;
            top: -1.4em;
            left: -2px;
            font-size: 10px;
            font-family: "JetBrains Mono", monospace;
            background: ${color};
            color: #0a0a0f;
            padding: 1px 4px;
            white-space: nowrap;
            border-radius: 2px 2px 2px 0;
          }
        `);
      });
      style.textContent = rules.join("\n");
    };

    provider.awareness.on("change", updateCursorStyles);
    updateCursorStyles();

    return () => {
      provider.awareness.off("change", updateCursorStyles);
      style.remove();
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [editor, doc, provider, isSynced]);

  useEffect(() => {
    editor?.updateOptions({ readOnly });
  }, [editor, readOnly]);

  const handleSave = async () => {
    if (!id || !doc) return;
    setSaveStatus("saving");
    const code = doc.getText("code").toString();
    await snippetsApi.update(id, { code });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  if (loading) return <p className="text-sm text-gray-500 animate-pulse">Loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!snippet) return <p className="text-sm text-red-400">Snippet not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-medium">{snippet.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5">
              {snippet.language}
            </span>
            <span className="text-[11px] font-mono text-gray-500">
              {users.length} online
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 ${mode === "public" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
              {mode}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            className="px-3 py-1.5"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
          {isHost && (
            <Button
              variant="ghost"
              className="px-3 py-1.5"
              onClick={() => setMode(mode === "public" ? "visible" : "public")}
            >
              {mode === "public" ? "Lock editing" : "Unlock editing"}
            </Button>
          )}
          <Link to={`/snippets/${id}`} className={buttonClass("ghost", "px-3 py-1.5")}>
            Exit
          </Link>
        </div>
      </div>

      {!isSynced ? (
        <p className="text-sm text-gray-500 animate-pulse">Connecting...</p>
      ) : (
        <div className="rounded-lg overflow-hidden border border-white/[0.06]">
          <Editor
            height="70vh"
            language={snippet.language}
            theme="vs-dark"
            onMount={handleMount}
            options={{ ...baseOptions, readOnly, scrollbar: { vertical: "auto", horizontal: "auto" } }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {users.map((u) => (
            <span key={u.socketId} className="text-[11px] font-mono text-gray-400">
              {u.username}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && (
            <span className="text-[11px] font-mono text-emerald-400 animate-pulse">saved</span>
          )}
          <Button variant="accent" className="px-4 py-1.5" onClick={handleSave} disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
