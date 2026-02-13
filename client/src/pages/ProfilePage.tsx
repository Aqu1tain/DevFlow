import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { profileApi, type ProfileBadge, type ProfileData } from "../services/api";
import { buttonClass } from "../components/Button";
import Heatmap from "../components/Heatmap";
import BadgeGrid from "../components/BadgeGrid";

const BADGES_KEY = "devflow_seen_badges";

function useNewBadges(badges: ProfileBadge[], isOwn: boolean) {
  const [toast, setToast] = useState<string | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (!isOwn || checked.current) return;
    checked.current = true;

    const unlocked = badges.filter((b) => b.unlocked).map((b) => b.id);
    const seen: string[] = JSON.parse(localStorage.getItem(BADGES_KEY) || "[]");
    const fresh = unlocked.filter((id) => !seen.includes(id));

    localStorage.setItem(BADGES_KEY, JSON.stringify(unlocked));

    if (!fresh.length) return;
    const name = badges.find((b) => b.id === fresh[0])!.name;
    const label = fresh.length === 1 ? `badge unlocked: ${name}` : `${fresh.length} badges unlocked`;
    setToast(label);
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [badges, isOwn]);

  return toast;
}

function BadgeToast({ message }: { message: string }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.3s_ease-out] border border-emerald-500/30 bg-[#0f0f17] px-5 py-3 shadow-lg">
      <p className="text-xs font-mono text-emerald-400">{message}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <p className="text-[11px] font-mono text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-mono font-medium text-gray-100">{value}</p>
    </div>
  );
}

function Initials({ username }: { username: string }) {
  const letters = username.slice(0, 2).toUpperCase();
  return (
    <div className="w-16 h-16 flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-mono text-xl font-semibold border border-emerald-500/20">
      {letters}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-white/[0.08] px-6 py-8 text-center">
      <p className="text-sm font-mono text-gray-400">no activity yet</p>
      <p className="text-xs font-mono text-gray-600 mt-1">
        <Link to="/snippets/new" className="text-emerald-400 hover:text-emerald-300 transition-colors">
          create your first snippet
        </Link>
        {" "}to start building your profile
      </p>
    </div>
  );
}

const currentYear = new Date().getFullYear();

function trailingStart() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  d.setDate(d.getDate() + 1);
  return d;
}

export default function ProfilePage() {
  const { username: paramUsername } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [year, setYear] = useState<number | null>(null);

  const username = paramUsername || user?.username;
  const isOwn = user?.username === data?.user.username;

  const isTrailing = year === null;
  const prevYear = isTrailing ? currentYear - 1 : year - 1;

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError("");

    if (isTrailing) {
      Promise.all([
        profileApi.get(username, currentYear),
        profileApi.get(username, currentYear - 1),
      ])
        .then(([curr, prev]) => {
          setData(curr);
          setHeatmap({ ...prev.heatmap, ...curr.heatmap });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      profileApi
        .get(username, year)
        .then((d) => { setData(d); setHeatmap(d.heatmap); })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [username, year, isTrailing]);

  const badgeToast = useNewBadges(data?.badges ?? [], isOwn);

  if (!paramUsername && user) return <Navigate to={`/profile/${user.username}`} replace />;
  if (loading) return <p className="text-sm text-gray-500 animate-pulse">loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return null;

  const unlockedCount = data.badges.filter((b) => b.unlocked).length;
  const totalActivity = data.stats.snippets + data.stats.comments + data.stats.snapshots;
  const isEmpty = totalActivity === 0 && isOwn;

  const heatmapStart = isTrailing ? trailingStart() : new Date(year, 0, 1);
  const heatmapEnd = isTrailing ? new Date() : new Date(year, 11, 31);
  const displayLabel = isTrailing ? "past year" : String(year);

  return (
    <div className="space-y-8">
      {badgeToast && <BadgeToast message={badgeToast} />}
      <div className="flex items-center gap-5">
        <Initials username={data.user.username} />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono font-medium">{data.user.username}</h1>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
              data.user.role === "admin"
                ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                : data.user.userType === "pro"
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : "text-gray-600 border-white/[0.06]"
            }`}>
              {data.user.role === "admin" ? "admin" : data.user.userType}
            </span>
          </div>
          <p className="text-xs font-mono text-gray-600 mt-0.5">
            member since {new Date(data.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
          {isOwn && (
            <Link to="/settings" className={buttonClass("ghost", "inline-block mt-2 px-3 py-1.5")}>
              edit profile
            </Link>
          )}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          <section>
            <h2 className="text-sm font-mono lowercase text-gray-400 mb-3">stats</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-white/[0.06]">
              <StatCard label="snippets" value={data.stats.snippets} />
              <StatCard label="comments" value={data.stats.comments} />
              <StatCard label="snapshots" value={data.stats.snapshots} />
              <StatCard label="languages" value={data.stats.languages.length} />
              <StatCard label="current streak" value={`${data.streaks.current}d`} />
              <StatCard label="longest streak" value={`${data.streaks.longest}d`} />
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-mono lowercase text-gray-400">activity</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setYear(prevYear)}
                  className="cursor-pointer text-xs font-mono text-gray-600 hover:text-gray-300 transition-colors"
                >
                  &larr;
                </button>
                <span className="text-xs font-mono text-gray-400">{displayLabel}</span>
                <button
                  onClick={() => setYear(isTrailing ? null : year === currentYear - 1 ? null : year + 1)}
                  disabled={isTrailing}
                  className="cursor-pointer text-xs font-mono text-gray-600 hover:text-gray-300 transition-colors disabled:opacity-30"
                >
                  &rarr;
                </button>
              </div>
            </div>
            <Heatmap data={heatmap} startDate={heatmapStart} endDate={heatmapEnd} />
          </section>
        </>
      )}

      <section>
        <h2 className="text-sm font-mono lowercase text-gray-400 mb-3">
          badges ({unlockedCount}/{data.badges.length} unlocked)
        </h2>
        <BadgeGrid badges={data.badges} />
      </section>
    </div>
  );
}
