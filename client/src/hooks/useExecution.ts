import { useState } from "react";
import { executionApi, type ExecutionResult } from "../services/api";

const RUNNABLE = new Set([
  "javascript", "typescript", "python", "bash", "c", "c++", "csharp",
  "java", "go", "rust", "ruby", "php", "swift", "kotlin", "dart",
  "lua", "perl", "haskell", "scala", "elixir", "erlang", "clojure",
  "coffeescript", "crystal", "julia", "nim", "ocaml", "pascal",
  "prolog", "racket", "zig", "fortran", "groovy", "d",
]);

export const canRun = (language: string) => RUNNABLE.has(language);

export default function useExecution() {
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState(0);

  const run = async (code: string, language: string) => {
    setRunning(true);
    const start = performance.now();
    try {
      setOutput(await executionApi.run(code, language));
    } catch (err) {
      setOutput({ stdout: "", stderr: err instanceof Error ? err.message : "Execution failed", exitCode: 1 });
    } finally {
      setDuration(Math.round(performance.now() - start));
      setRunning(false);
    }
  };

  const clear = () => setOutput(null);

  return { output, running, duration, run, clear };
}
