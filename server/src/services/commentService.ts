import Comment from "../models/Comment";

export const findBySnippetId = (snippetId: string) =>
  Comment.find({ snippetId })
    .sort({ createdAt: -1 })
    .populate("userId", "username")
    .exec();

export const create = async (data: { snippetId: string; userId: string; body: string }) => {
  const comment = await Comment.create(data);
  return comment.populate("userId", "username");
};

export const findById = (id: string) =>
  Comment.findById(id).exec();

export const remove = (id: string) =>
  Comment.findByIdAndDelete(id).exec();

export const removeBySnippetId = (snippetId: string) =>
  Comment.deleteMany({ snippetId }).exec();
