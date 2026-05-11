import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Budget } from '../types';
import { fmtMoney, uid } from '../lib/format';
import { Pencil, Trash, Plus } from '../components/icons';
import { Modal, FormButtons } from './Accounts';

export default function BudgetsPage() {
  const { budgets, categories, transactions, settings, saveBudget, deleteBudget } = useStore();
  const [editing, setEditing] = useState<Budget | null>(null);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const spentByCat = useMemo(() => {
    const out = new Map<string, number>();
    for (const t of transactions) {
      if (t.kind !== 'expense' || !t.categoryId) continue;
      if (!t.date.startsWith(monthKey)) continue;
      out.set(t.categoryId, (out.get(t.categoryId) ?? 0) + t.amount);
    }
    return out;
  }, [transactions, monthKey]);

  const expCats = categories.filter((c) => c.kind === 'expense' && !c.archived);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Budgets <span className="text-sm text-slate-400">({monthKey})</span></h1>
        <button className="btn-ghost text-sm" onClick={() => setEditing({ id: '', categoryId: expCats[0]?.id ?? '', monthlyLimit: 0 })}>
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="space-y-2">
        {budgets.length === 0 && <div className="card text-slate-400 text-sm">No budgets set.</div>}
        {budgets.map((b) => {
          const cat = categories.find((c) => c.id === b.categoryId);
          const spent = spentByCat.get(b.categoryId) ?? 0;
          const pct = b.monthlyLimit > 0 ? Math.min(100, (spent / b.monthlyLimit) * 100) : 0;
          const over = spent > b.monthlyLimit;
          return (
            <div key={b.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{cat?.emoji} {cat?.name ?? '(deleted)'}</div>
                <div className="flex gap-1">
                  <button className="btn-ghost p-1.5" onClick={() => setEditing(b)}><Pencil className="w-4 h-4" /></button>
                  <button className="btn-ghost p-1.5 text-rose-400" onClick={() => window.confirm('Delete budget?') && deleteBudget(b.id)}><Trash className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="text-xs text-slate-400 mb-1">
                {fmtMoney(spent, settings)} of {fmtMoney(b.monthlyLimit, settings)}
                {over && <span className="text-rose-400 ml-2">over by {fmtMoney(spent - b.monthlyLimit, settings)}</span>}
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Budget' : 'New Budget'} onClose={() => setEditing(null)}>
          <BudgetForm
            value={editing}
            cats={expCats}
            onCancel={() => setEditing(null)}
            onSave={async (v) => {
              await saveBudget(v.id ? v : { ...v, id: uid('bud_') });
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function BudgetForm({ value, cats, onSave, onCancel }: {
  value: Budget; cats: { id: string; name: string; emoji?: string }[];
  onSave: (v: Budget) => void; onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Category</label>
        <select className="input" value={v.categoryId} onChange={(e) => setV({ ...v, categoryId: e.target.value })}>
          <option value="">Select…</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Monthly limit</label>
        <input type="number" step="0.01" className="input" value={v.monthlyLimit} onChange={(e) => setV({ ...v, monthlyLimit: Number(e.target.value) })} />
      </div>
      <FormButtons onCancel={onCancel} onSave={() => onSave(v)} disabled={!v.categoryId || v.monthlyLimit <= 0} />
    </div>
  );
}
