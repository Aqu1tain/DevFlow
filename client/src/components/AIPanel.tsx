import { useEffect, useRef } from "react";
import type { AIAction } from "../services/api";

interface Props {
  content: string;
  action: AIAction;
  loading: boolean;
  error: string | null;
  onClear: () => void;
}

export default function AIPanel({ content, action, loading, error, onClear }: Props) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [content]);

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
        <span className="text-[11px] font-mono text-gray-500">
          ai · {action}
        </span>
        <button
          onClick={onClear}
          className="text-[11px] font-mono text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
        >
          clear
        </button>
      </div>
      <pre
        ref={preRef}
        className="p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto text-gray-300"
      >
        {error
          ? <span className="text-red-400">{error}</span>
          : content || <span className="text-gray-600">Waiting for response...</span>}
        {loading && <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />}
      </pre>
    </div>
  );
}
