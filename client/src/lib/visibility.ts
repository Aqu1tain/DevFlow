import type { Visibility } from "../services/api";

const styles: Record<Visibility, { color: string; bg: string }> = {
  public: { color: "text-gray-400", bg: "bg-white/[0.04]" },
  unlisted: { color: "text-amber-400", bg: "bg-amber-500/10" },
  private: { color: "text-rose-400", bg: "bg-rose-500/10" },
};

const fallback = { color: "text-gray-400", bg: "bg-white/[0.04]" };

export const visibilityStyle = (v: string): { color: string; bg: string } =>
  styles[v as Visibility] ?? fallback;
