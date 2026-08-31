export interface Stat {
  label: string;
  value: string;
}

export default function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface p-4">
          <div className="text-xs text-muted">{s.label}</div>
          <div className="mt-1 text-2xl font-semibold">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
