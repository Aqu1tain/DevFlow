import { useCallback, useRef, useState } from "react";
import { aiApi, type AIAction } from "../services/api";

export default function useAI() {
  const [content, setContent] = useState("");
  const [action, setAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (code: string, language: string, act: AIAction) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setContent("");
    setAction(act);
    setLoading(true);
    setError(null);

    try {
      await aiApi.stream(
        code,
        language,
        act,
        (chunk) => setContent((prev) => prev + chunk),
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setContent("");
    setAction(null);
    setLoading(false);
    setError(null);
  }, []);

  return { content, action, loading, error, ask, clear };
}
