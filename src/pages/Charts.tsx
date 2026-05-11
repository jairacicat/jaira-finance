import { useMemo } from 'react';
import { useStore } from '../store';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtMoney } from '../lib/format';

const PALETTE = ['#6366f1', '#22c55e', '#f97316', '#eab308', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#ec4899', '#14b8a6', '#f43f5e'];

export default function ChartsPage() {
  const { transactions, categories, settings, year } = useStore();

  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString('en-US', { month: 'short' }),
      Income: 0, Expense: 0
    }));
    for (const t of transactions) {
      if (!t.date.startsWith(String(year))) continue;
      const m = Number(t.date.slice(5, 7)) - 1;
      if (t.kind === 'income') arr[m].Income += t.amount;
      if (t.kind === 'expense') arr[m].Expense += t.amount;
    }
    return arr;
  }, [transactions, year]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.kind !== 'expense' || !t.categoryId) continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([id, value]) => ({ id, name: categories.find((c) => c.id === id)?.name ?? '?', value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, categories]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Charts — {year}</h1>

      <section className="card">
        <div className="section-title mb-3">Income vs Expense (monthly)</div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={monthly}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                formatter={(v: number) => fmtMoney(v, settings)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <div className="section-title mb-3">Top Expense Categories</div>
        {byCategory.length === 0 ? (
          <div className="text-slate-400 text-sm">No expenses yet.</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={100} label={(d) => d.name}>
                  {byCategory.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                  formatter={(v: number) => fmtMoney(v, settings)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
