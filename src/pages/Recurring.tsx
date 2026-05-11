import { useState } from 'react';
import { useStore } from '../store';
import type { Recurring } from '../types';
import { fmtMoney, todayISO, uid } from '../lib/format';
import { Pencil, Trash, Plus } from '../components/icons';
import { Modal, FormButtons } from './Accounts';

export default function RecurringPage() {
  const { recurring, accounts, categories, settings, saveRecurring, deleteRecurring, runDueRecurring } = useStore();
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [ranCount, setRanCount] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recurring</h1>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-sm"
            onClick={async () => setRanCount(await runDueRecurring())}
          >
            Run due now
          </button>
          <button
            className="btn-ghost text-sm"
            onClick={() => setEditing({
              id: '', active: true, kind: 'expense', amount: 0,
              accountId: accounts[0]?.id ?? '', categoryId: categories.find((c) => c.kind === 'expense')?.id,
              cadence: 'monthly', interval: 1,
              startDate: todayISO(), nextDue: todayISO()
            })}
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {ranCount !== null && (
        <div className="card text-sm text-slate-300">
          {ranCount === 0 ? 'Nothing was due.' : `Created ${ranCount} transaction${ranCount === 1 ? '' : 's'} from due recurring entries.`}
        </div>
      )}

      <div className="card divide-y divide-slate-800 -mx-1">
        {recurring.length === 0 && <div className="px-2 py-3 text-slate-400 text-sm">No recurring entries.</div>}
        {recurring.map((r) => {
          const cat = categories.find((c) => c.id === r.categoryId);
          const acct = accounts.find((a) => a.id === r.accountId);
          return (
            <div key={r.id} className="flex items-center justify-between px-2 py-2.5">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {r.kind === 'transfer' ? '⇄ Transfer' : `${cat?.emoji ?? ''} ${cat?.name ?? r.kind}`}
                  {!r.active && <span className="chip ml-2">paused</span>}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {fmtMoney(r.amount, settings)} · every {r.interval} {r.cadence} · {acct?.name ?? '?'} · next {r.nextDue}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-2" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></button>
                <button className="btn-ghost p-2 text-rose-400" onClick={() => window.confirm('Delete this recurring entry?') && deleteRecurring(r.id)}><Trash className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Recurring' : 'New Recurring'} onClose={() => setEditing(null)}>
          <RecurringForm
            value={editing}
            onCancel={() => setEditing(null)}
            onSave={async (v) => {
              await saveRecurring(v.id ? v : { ...v, id: uid('rec_') });
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function RecurringForm({ value, onSave, onCancel }: { value: Recurring; onSave: (v: Recurring) => void; onCancel: () => void }) {
  const { accounts, categories } = useStore();
  const [v, setV] = useState(value);
  const cats = categories.filter((c) => c.kind === (v.kind === 'transfer' ? 'expense' : v.kind) && !c.archived);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(['expense', 'income', 'transfer'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setV({ ...v, kind: k })}
            className={`py-2 rounded-xl text-sm ${v.kind === k ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Amount</label>
          <input type="number" step="0.01" className="input" value={v.amount} onChange={(e) => setV({ ...v, amount: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label">{v.kind === 'transfer' ? 'From account' : 'Account'}</label>
          <select className="input" value={v.accountId} onChange={(e) => setV({ ...v, accountId: e.target.value })}>
            <option value="">Select…</option>
            {accounts.filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      {v.kind === 'transfer' ? (
        <div>
          <label className="label">To account</label>
          <select className="input" value={v.toAccountId ?? ''} onChange={(e) => setV({ ...v, toAccountId: e.target.value })}>
            <option value="">Select…</option>
            {accounts.filter((a) => !a.archived && a.id !== v.accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="label">Category</label>
          <select className="input" value={v.categoryId ?? ''} onChange={(e) => setV({ ...v, categoryId: e.target.value })}>
            <option value="">Select…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Every</label>
          <input type="number" min="1" className="input" value={v.interval} onChange={(e) => setV({ ...v, interval: Math.max(1, Number(e.target.value)) })} />
        </div>
        <div className="col-span-2">
          <label className="label">Period</label>
          <select className="input" value={v.cadence} onChange={(e) => setV({ ...v, cadence: e.target.value as any })}>
            <option value="daily">day(s)</option>
            <option value="weekly">week(s)</option>
            <option value="monthly">month(s)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start date</label>
          <input type="date" className="input" value={v.startDate} onChange={(e) => setV({ ...v, startDate: e.target.value, nextDue: v.id ? v.nextDue : e.target.value })} />
        </div>
        <div>
          <label className="label">Next due</label>
          <input type="date" className="input" value={v.nextDue} onChange={(e) => setV({ ...v, nextDue: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Note</label>
        <input className="input" value={v.note ?? ''} onChange={(e) => setV({ ...v, note: e.target.value })} />
      </div>
      <div>
        <label className="label">End date (optional)</label>
        <input type="date" className="input" value={v.endDate ?? ''} onChange={(e) => setV({ ...v, endDate: e.target.value || undefined })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />
        Active
      </label>
      <FormButtons
        onCancel={onCancel}
        onSave={() => onSave(v)}
        disabled={!v.amount || !v.accountId || (v.kind === 'transfer' ? !v.toAccountId : !v.categoryId)}
      />
    </div>
  );
}
