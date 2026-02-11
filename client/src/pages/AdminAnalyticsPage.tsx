import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi, type AdminStats } from "../services/api";

type BarChartItem = { label: string; value: number; color: string };

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <p className="text-[11px] font-mono text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-mono font-semibold text-gray-100">{value}</p>
    </div>
  );
}

function BarChart({ items, total }: { items: BarChartItem[]; total: number }) {
  if (total === 0) return <p className="text-xs text-gray-600 font-mono">no data</p>;
  return (
    <div className="space-y-2.5">
      {items.map(({ label, value, color }) => (
        <div key={label}>
          <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
            <span>{label}</span>
            <span>{value} ({Math.round((value / total) * 100)}%)</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${(value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">{title}</h2>
      {children}
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

  const visibilityItems = [
    { label: "public", value: stats.snippets.public, color: "bg-gray-400" },
    { label: "unlisted", value: stats.snippets.unlisted, color: "bg-amber-400" },
    { label: "private", value: stats.snippets.private, color: "bg-rose-400" },
  ];

  const userTypeItems = [
    { label: "free", value: stats.users.free, color: "bg-emerald-400" },
    { label: "pro", value: stats.users.pro, color: "bg-violet-400" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-lg font-mono font-medium">analytics</h1>
        <p className="text-xs text-gray-500 mt-1 font-mono">platform overview</p>
      </div>

      <Section title="KPIs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.06]">
          <StatCard label="total snippets" value={stats.snippets.total} />
          <StatCard label="total users" value={stats.users.total} />
          <StatCard label="pro users" value={stats.users.pro} />
          <StatCard label="pro ratio" value={proRatio} />
        </div>
      </Section>

      <Section title="Snippets by visibility">
        <BarChart items={visibilityItems} total={stats.snippets.total} />
      </Section>

      <Section title="Users by plan">
        <BarChart items={userTypeItems} total={stats.users.total} />
      </Section>

      <Section title="Top languages">
        <BarChart
          items={stats.snippets.languages.map((l) => ({ label: l.name, value: l.count, color: "bg-emerald-400" }))}
          total={stats.snippets.total}
        />
      </Section>
    </div>
  );
}
