import { useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import type { Snapshot } from "../services/api";
import { timeAgo } from "../lib/timeAgo";
import Button from "./Button";

interface Props {
  snapshots: Snapshot[];
  currentCode: string;
  currentLanguage: string;
  onCreate: (name: string) => Promise<boolean>;
  onRestore: (snapshotId: string) => Promise<void>;
  onDelete: (snapshotId: string) => Promise<void>;
}

export default function SnapshotPanel({ snapshots, currentCode, currentLanguage, onCreate, onRestore, onDelete }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "restore" | "delete"; id: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    if (await onCreate(name.trim())) setName("");
    setSaving(false);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    if (type === "restore") await onRestore(id);
    else await onDelete(id);
    setConfirmAction(null);
  };

  return (
    <div className="border border-white/[0.08] bg-white/[0.02] mb-6">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-mono lowercase text-gray-400 mb-3">snapshots</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="snapshot name..."
            maxLength={100}
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-none px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/40"
          />
          <Button variant="primary" disabled={saving || !name.trim()} className="px-3 py-1.5">
            {saving ? "saving..." : "save"}
          </Button>
        </form>
      </div>

      {snapshots.length === 0 && (
        <p className="px-4 py-3 text-xs text-gray-600">no snapshots yet</p>
      )}

      <div>
        {snapshots.map((snapshot) => {
          const isExpanded = expandedId === snapshot._id;
          return (
            <div key={snapshot._id} className="border-b border-white/[0.04] last:border-0">
              <button
                onClick={() => setExpandedId(isExpanded ? null : snapshot._id)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 font-mono">{snapshot.name}</span>
                  <span className="text-[11px] text-gray-600">{timeAgo(snapshot.createdAt)}</span>
                </div>
                <span className="text-[10px] text-gray-600 font-mono">{isExpanded ? "collapse" : "diff"}</span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="border border-white/[0.06] rounded-none overflow-hidden mb-2">
                    <DiffEditor
                      height="300px"
                      language={currentLanguage}
                      original={snapshot.code}
                      modified={currentCode}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 20,
                        scrollBeyondLastLine: false,
                        renderSideBySide: false,
                        renderOverviewRuler: false,
                        overviewRulerLanes: 0,
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setConfirmAction({ type: "restore", id: snapshot._id })} className="px-3 py-1">
                      restore
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmAction({ type: "delete", id: snapshot._id })} className="px-3 py-1">
                      delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0a0a0f] border border-white/[0.08] p-6 w-80">
            <p className="text-sm text-gray-300 mb-4">
              {confirmAction.type === "restore"
                ? "Restore this snapshot? The snippet will be overwritten."
                : "Delete this snapshot? This cannot be undone."}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setConfirmAction(null)} className="px-3 py-1.5">
                cancel
              </Button>
              <Button
                variant={confirmAction.type === "delete" ? "danger" : "primary"}
                onClick={handleConfirm}
                className="px-3 py-1.5"
              >
                {confirmAction.type}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
