import type { ExecutionResult } from "../services/api";

interface Props {
  output: ExecutionResult;
  duration: number;
  onClear: () => void;
}

export default function OutputPanel({ output, duration, onClear }: Props) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-500">output</span>
          <span
            className={`text-[11px] font-mono px-1.5 py-0.5 ${
              output.exitCode === 0
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-rose-400 bg-rose-500/10"
            }`}
          >
            {output.exitCode === null ? "killed" : `exit ${output.exitCode}`}
          </span>
          <span className="text-[11px] font-mono text-gray-600">
            {duration >= 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-[11px] font-mono text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
        >
          clear
        </button>
      </div>
      <pre className="p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
        {output.stdout && <span className="text-gray-300">{output.stdout}</span>}
        {output.stderr && <span className="text-red-400">{output.stderr}</span>}
        {!output.stdout && !output.stderr && (
          <span className="text-gray-600">(no output)</span>
        )}
      </pre>
    </div>
  );
}
