import Button from "./Button";

interface Props {
  onUpgrade: () => void;
  onClose: () => void;
  loading: boolean;
  error?: string;
}

export default function UpgradeModal({ onUpgrade, onClose, loading, error }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f17] border border-white/[0.08] p-8 max-w-sm w-full mx-4 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-mono font-medium text-gray-200">upgrade to Pro</p>
          <p className="text-xs text-gray-500 mt-1 font-mono">unlock private snippets</p>
        </div>

        <ul className="space-y-2">
          <li className="text-xs font-mono text-gray-400">
            <span className="text-emerald-400 mr-2">+</span>
            private snippets — visible only to you
          </li>
          <li className="text-xs font-mono text-gray-400">
            <span className="text-emerald-400 mr-2">+</span>
            AI code explanation and correction
          </li>
        </ul>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 font-mono">{error}</p>
        )}

        <div className="flex gap-3">
          <Button onClick={onUpgrade} disabled={loading} className="px-4 py-2.5 flex-1">
            {loading ? "loading..." : "upgrade now"}
          </Button>
          <Button onClick={onClose} variant="ghost" className="px-4 py-2.5">
            cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
