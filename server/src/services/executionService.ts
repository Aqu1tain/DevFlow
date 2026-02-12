const PISTON_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";
const MAX_OUTPUT = 10 * 1024;
const TIMEOUT_MS = 10_000;
const MAX_CODE_LENGTH = 64 * 1024;

interface PistonResponse {
  run: { stdout: string; stderr: string; code: number; output: string } | null;
}

function truncate(str: string) {
  if (str.length <= MAX_OUTPUT) return str;
  return str.slice(0, MAX_OUTPUT) + "\n[output truncated]";
}

export async function execute(language: string, code: string) {
  if (code.length > MAX_CODE_LENGTH) throw new Error("Code exceeds 64KB limit");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, version: "*", files: [{ content: code }] }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Execution engine returned ${res.status}`);

    const data = (await res.json()) as PistonResponse;
    if (!data.run) throw new Error("Execution engine returned no result");
    return {
      stdout: truncate(data.run.stdout),
      stderr: truncate(data.run.stderr),
      exitCode: data.run.code,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError")
      throw new Error("Execution timed out (10s limit)");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
