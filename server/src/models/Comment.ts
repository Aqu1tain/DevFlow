import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
  snippetId: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    snippetId: { type: Schema.Types.ObjectId, ref: "Snippet", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true },
);

commentSchema.index({ snippetId: 1, createdAt: -1 });

export default mongoose.model<IComment>("Comment", commentSchema);
