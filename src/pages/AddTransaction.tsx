import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { todayISO } from '../lib/format';
import type { TxnKind } from '../types';

const tabs: { kind: TxnKind; label: string; color: string }[] = [
  { kind: 'expense', label: 'Expense', color: 'bg-rose-600' },
  { kind: 'income', label: 'Income', color: 'bg-emerald-600' },
  { kind: 'transfer', label: 'Transfer', color: 'bg-slate-600' }
];

export default function AddTransaction() {
  const navigate = useNavigate();
  const { accounts, categories, addTransaction, status } = useStore();
  const [kind, setKind] = useState<TxnKind>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
  const activeCategories = useMemo(
    () => categories.filter((c) => !c.archived && c.kind === (kind === 'transfer' ? 'expense' : kind)),
    [categories, kind]
  );

  const canSubmit = (() => {
    if (!amount || Number(amount) <= 0) return false;
    if (!date) return false;
    if (!accountId) return false;
    if (kind === 'transfer' && (!toAccountId || toAccountId === accountId)) return false;
    if (kind !== 'transfer' && !categoryId) return false;
    return true;
  })();

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await addTransaction({
        kind,
        amount: Number(amount),
        date,
        accountId,
        toAccountId: kind === 'transfer' ? toAccountId : undefined,
        categoryId: kind === 'transfer' ? undefined : categoryId,
        note: note.trim() || undefined
      });
      navigate('/');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Add Transaction</h1>

      <div className="card space-y-4">
        {/* Kind tabs */}
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((t) => (
            <button
              key={t.kind}
              onClick={() => setKind(t.kind)}
              className={`py-2 rounded-xl text-sm font-medium transition ${
                kind === t.kind ? `${t.color} text-white` : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <label className="label">Amount</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className="input text-2xl font-semibold"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{kind === 'transfer' ? 'From account' : 'Account'}</label>
            <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select…</option>
              {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {kind === 'transfer' ? (
          <div>
            <label className="label">To account</label>
            <select className="input" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">Select…</option>
              {activeAccounts.filter((a) => a.id !== accountId).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">Category</label>
            {activeCategories.length === 0 ? (
              <p className="text-sm text-slate-400">No {kind} categories yet. Add one in <em>Tags</em>.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {activeCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`p-2 rounded-xl text-xs border transition ${
                      categoryId === c.id ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-lg leading-tight">{c.emoji ?? '🏷️'}</div>
                    <div className="truncate">{c.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="label">Note (optional)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. lunch with team" />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-secondary flex-1" onClick={() => navigate('/')}>Cancel</button>
          <button className="btn-primary flex-1" disabled={!canSubmit || busy || status === 'syncing'} onClick={submit}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
