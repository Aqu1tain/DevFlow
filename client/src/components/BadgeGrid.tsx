import type { ProfileBadge } from "../services/api";

interface Props {
  badges: ProfileBadge[];
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.round((current / target) * 100);
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-emerald-500/50"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] font-mono text-gray-600">{current}/{target}</p>
    </div>
  );
}

export default function BadgeGrid({ badges }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`border px-4 py-3 ${
            badge.unlocked
              ? "border-emerald-500/30 bg-emerald-500/[0.05]"
              : "border-white/[0.06] bg-white/[0.02]"
          }`}
        >
          <p className={`text-xs font-mono font-medium ${badge.unlocked ? "text-emerald-400" : "text-gray-500"}`}>
            {badge.name}
          </p>
          <p className="text-[11px] font-mono text-gray-600 mt-0.5">{badge.description}</p>
          {!badge.unlocked && badge.progress && (
            <ProgressBar current={badge.progress.current} target={badge.progress.target} />
          )}
        </div>
      ))}
    </div>
  );
}
