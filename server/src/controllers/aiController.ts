import { Request, Response } from "express";
import { stream } from "../services/aiService";
import { handle } from "../lib/handle";

const VALID_ACTIONS = new Set(["explain", "correct"]);

export const ask = handle(async (req: Request, res: Response) => {
  const { code, language, action } = req.body;

  if (!code || typeof code !== "string")
    return void res.status(400).json({ error: "Code is required" });
  if (!action || !VALID_ACTIONS.has(action))
    return void res.status(400).json({ error: "Action must be 'explain' or 'correct'" });

  let aborted = false;
  req.on("close", () => { aborted = true; });

  try {
    const chunks = await stream(code, language || "plaintext", action);

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    for await (const chunk of chunks) {
      if (aborted) break;
      const text = chunk.text();
      if (text) res.write(text);
    }
  } catch {
    if (!res.headersSent)
      return void res.status(502).json({ error: "AI service unavailable" });
  }

  res.end();
});
