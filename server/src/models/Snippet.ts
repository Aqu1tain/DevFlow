import mongoose, { Schema, Document, Types } from "mongoose";

export type Visibility = "public" | "unlisted" | "private";

export interface ISnippet extends Document {
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  visibility: Visibility;
  userId: Types.ObjectId;
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
    visibility: { type: String, enum: ["public", "unlisted", "private"], default: "public" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

snippetSchema.index({ visibility: 1, createdAt: -1 });
snippetSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ISnippet>("Snippet", snippetSchema);
