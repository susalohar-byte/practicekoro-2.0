export function AdminMoneyChart({
  points,
}: {
  points: { label: string; revenue: number; refunds?: number }[];
}) {
  const hasRefunds = points.some((p) => p.refunds !== undefined);
  const max = Math.max(1, ...points.flatMap((p) => [p.revenue, p.refunds || 0]));
  return (
    <div className="space-y-3" aria-label="Recorded revenue by period">
      <p className="text-xs text-slate-500">
        Blue: retained revenue{hasRefunds ? ' · Pink: recorded refunds' : ''} · INR
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Period starting</th>
            <th>Retained revenue</th>
            {hasRefunds && <th>Recorded refunds</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p, index) => (
            <tr key={`${p.label}-${index}`} className="border-t border-slate-100">
              <th className="py-2 text-left font-medium">{p.label}</th>
              {(hasRefunds ? [p.revenue, p.refunds || 0] : [p.revenue]).map((value, i) => (
                <td key={i} className="w-1/3 px-2">
                  <span>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <div aria-hidden="true" className="mt-1 h-2 rounded bg-slate-100">
                    <div
                      className={`h-2 rounded ${i ? 'bg-pink-400' : 'bg-blue-500'}`}
                      style={{ width: `${(100 * value) / max}%` }}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!points.some((p) => p.revenue || p.refunds) && (
        <p className="text-xs text-slate-500">No recorded revenue or refunds in this period.</p>
      )}
    </div>
  );
}
