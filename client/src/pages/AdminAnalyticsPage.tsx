import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi, type AdminStats } from "../services/api";

type BarItem = { label: string; value: number; color: string };

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <p className="text-[11px] font-mono text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-mono font-medium text-gray-100">{value}</p>
    </div>
  );
}

function BarChart({ items, total }: { items: BarItem[]; total: number }) {
  if (total === 0) return <p className="text-xs text-gray-600 font-mono">no data</p>;
  return (
    <div className="space-y-2.5">
      {items.map(({ label, value, color }) => {
        const pct = Math.round((value / total) * 100);
        return (
          <div key={label}>
            <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
              <span>{label}</span>
              <span>{value}{pct > 0 && ` (${pct}%)`}</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] overflow-hidden">
              <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== "admin") return <Navigate to="/snippets" replace />;
  if (loading) return <p className="text-sm text-gray-500 animate-pulse">loading...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!stats) return null;

  const proRatio = stats.users.total
    ? `${Math.round((stats.users.pro / stats.users.total) * 100)}%`
    : "0%";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-mono font-medium">analytics</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">
          {stats.snippets.total} snippets, {stats.users.total} users
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06]">
        <StatCard label="total snippets" value={stats.snippets.total} />
        <StatCard label="total users" value={stats.users.total} />
        <StatCard label="pro users" value={stats.users.pro} />
        <StatCard label="pro ratio" value={proRatio} />
      </div>

      <div>
        <h2 className="text-sm font-mono lowercase text-gray-400 mb-3">snippets by visibility</h2>
        <BarChart
          items={[
            { label: "public", value: stats.snippets.public, color: "bg-gray-400" },
            { label: "unlisted", value: stats.snippets.unlisted, color: "bg-amber-400" },
            { label: "private", value: stats.snippets.private, color: "bg-rose-400" },
          ]}
          total={stats.snippets.total}
        />
      </div>

      <div>
        <h2 className="text-sm font-mono lowercase text-gray-400 mb-3">users by plan</h2>
        <BarChart
          items={[
            { label: "free", value: stats.users.free, color: "bg-gray-400" },
            { label: "pro", value: stats.users.pro, color: "bg-emerald-400" },
          ]}
          total={stats.users.total}
        />
      </div>

      <div>
        <h2 className="text-sm font-mono lowercase text-gray-400 mb-3">top languages</h2>
        <BarChart
          items={stats.snippets.languages.map((l) => ({ label: l.name, value: l.count, color: "bg-emerald-400" }))}
          total={stats.snippets.total}
        />
      </div>
    </div>
  );
}
