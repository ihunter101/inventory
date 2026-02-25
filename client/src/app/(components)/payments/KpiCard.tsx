export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-widset text-zinc-400">{label}</div>
      <div className="text-lg font-bold text-zinc-900 mt-1">{value}</div>
    </div>
  )
}
