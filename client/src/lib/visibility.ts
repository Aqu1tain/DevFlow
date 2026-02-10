import type { Visibility } from "../services/api";

export const visibilityStyle: Record<Visibility, { color: string; bg: string }> = {
  public: { color: "text-gray-400", bg: "bg-white/[0.04]" },
  unlisted: { color: "text-amber-400", bg: "bg-amber-500/10" },
  private: { color: "text-rose-400", bg: "bg-rose-500/10" },
};
