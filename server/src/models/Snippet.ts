import mongoose, { Schema, Document } from "mongoose";

export interface ISnippet extends Document {
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const snippetSchema = new Schema<ISnippet>(
  {
    title: { type: String, required: true },
    language: { type: String, required: true },
    description: { type: String, default: "" },
    code: { type: String, default: "" },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ISnippet>("Snippet", snippetSchema);
