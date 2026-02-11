import { handle } from "../lib/handle";
import * as executionService from "../services/executionService";

export const run = handle(async (req, res) => {
  const { language, code } = req.body;
  if (!language) return void res.status(400).json({ error: "Language is required" });
  if (!code?.trim()) return void res.status(400).json({ error: "Code is required" });

  try {
    res.json(await executionService.execute(language, code));
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Execution failed" });
  }
});
