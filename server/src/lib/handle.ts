import mongoose from "mongoose";
import { Request, Response } from "express";

type Handler<P = Record<string, string>> = (req: Request<P>, res: Response) => Promise<void>;

export const handle = <P = Record<string, string>>(fn: Handler<P>): Handler<P> =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof mongoose.Error.CastError)
        return void res.status(400).json({ error: "Invalid ID format" });
      if (err instanceof mongoose.Error.ValidationError)
        return void res.status(400).json({ error: err.message });
      res.status(500).json({ error: "Internal server error" });
    }
  };
