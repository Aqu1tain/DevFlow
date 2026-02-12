import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import type { AIAction } from "../services/api";

interface Props {
  content: string;
  action: AIAction;
  loading: boolean;
  error: string | null;
  onClear: () => void;
}

export default function AIPanel({ content, action, loading, error, onClear }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
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
      <div
        ref={bodyRef}
        className="p-3 max-h-96 overflow-y-auto text-xs text-gray-300 ai-markdown"
      >
        {error
          ? <span className="text-red-400">{error}</span>
          : content
            ? <Markdown>{content}</Markdown>
            : <span className="text-gray-600">Waiting for response...</span>}
        {loading && <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-0.5 animate-pulse align-middle" />}
      </div>
    </div>
  );
}
