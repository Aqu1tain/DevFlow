import type { Visibility } from "../services/api";

export const visibilityStyle: Record<Visibility, { text: string; badge: string }> = {
  public: { text: "text-gray-400", badge: "text-gray-400 bg-white/[0.04]" },
  unlisted: { text: "text-amber-400", badge: "text-amber-400 bg-amber-500/10" },
  private: { text: "text-rose-400", badge: "text-rose-400 bg-rose-500/10" },
};
