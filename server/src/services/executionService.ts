const PISTON_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";
const MAX_OUTPUT = 10 * 1024;

interface PistonResponse {
  run: { stdout: string; stderr: string; code: number; output: string };
  language: string;
  version: string;
}

function truncate(str: string) {
  return str.length > MAX_OUTPUT ? str.slice(0, MAX_OUTPUT) + "\n[output truncated]" : str;
}

export async function execute(language: string, code: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, version: "*", files: [{ content: code }] }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message || `Piston returned ${res.status}`);
    }

    const data = (await res.json()) as PistonResponse;
    return {
      stdout: truncate(data.run.stdout),
      stderr: truncate(data.run.stderr),
      exitCode: data.run.code,
    };
  } finally {
    clearTimeout(timeout);
  }
}
