import { Schema, model, Types, type Document } from "mongoose";

export interface ISnapshot extends Document {
  snippetId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  createdAt: Date;
}

const snapshotSchema = new Schema<ISnapshot>(
  {
    snippetId: { type: Schema.Types.ObjectId, ref: "Snippet", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 100 },
    title: { type: String, required: true },
    language: { type: String, required: true },
    description: { type: String, default: "" },
    code: { type: String, default: "" },
    tags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

snapshotSchema.index({ snippetId: 1, createdAt: -1 });

export default model<ISnapshot>("Snapshot", snapshotSchema);
