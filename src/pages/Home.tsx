import { useMemo } from 'react';
import { useStore } from '../store';
import { fmtMoney } from '../lib/format';
import { ArrowDown, ArrowUp, Repeat } from '../components/icons';
import { Link } from 'react-router-dom';

export default function Home() {
  const { transactions, accounts, categories, accountTypes, settings, year } = useStore();

  const stats = useMemo(() => {
    const inc = transactions.filter((t) => t.kind === 'income').reduce((a, t) => a + t.amount, 0);
    const exp = transactions.filter((t) => t.kind === 'expense').reduce((a, t) => a + t.amount, 0);
    return { income: inc, expense: exp, net: inc - exp };
  }, [transactions]);

  const byAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, a.openingBalance);
    for (const t of transactions) {
      if (t.kind === 'income') map.set(t.accountId, (map.get(t.accountId) ?? 0) + t.amount);
      if (t.kind === 'expense') map.set(t.accountId, (map.get(t.accountId) ?? 0) - t.amount);
      if (t.kind === 'transfer') {
        map.set(t.accountId, (map.get(t.accountId) ?? 0) - t.amount);
        if (t.toAccountId) map.set(t.toAccountId, (map.get(t.toAccountId) ?? 0) + t.amount);
      }
    }
    return map;
  }, [transactions, accounts]);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8),
    [transactions]
  );

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="card">
        <div className="text-xs text-slate-400 mb-2">Year {year} Summary</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Income" value={fmtMoney(stats.income, settings)} accent="text-emerald-400" icon={<ArrowDown className="w-4 h-4" />} />
          <Stat label="Expense" value={fmtMoney(stats.expense, settings)} accent="text-rose-400" icon={<ArrowUp className="w-4 h-4" />} />
          <Stat label="Net" value={fmtMoney(stats.net, settings)} accent={stats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'} icon={<Repeat className="w-4 h-4" />} />
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Accounts</div>
          <Link to="/accounts" className="text-xs text-brand-500">Manage</Link>
        </div>
        {accounts.length === 0 ? (
          <EmptyHint to="/accounts" label="Add your first account" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {accounts.filter((a) => !a.archived).map((a) => (
              <div key={a.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-slate-400">{accountTypeLabel(a.typeId)}</div>
                </div>
                <div className={`font-semibold ${(byAccount.get(a.id) ?? 0) < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {fmtMoney(byAccount.get(a.id) ?? 0, settings)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Recent</div>
          <Link to="/charts" className="text-xs text-brand-500">View charts</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyHint to="/add" label="Log your first transaction" />
        ) : (
          <div className="card divide-y divide-slate-800 -mx-1">
            {recent.map((t) => {
              const acct = accounts.find((a) => a.id === t.accountId);
              const cat = categories.find((c) => c.id === t.categoryId);
              const sign = t.kind === 'income' ? '+' : t.kind === 'expense' ? '−' : '⇄';
              const color =
                t.kind === 'income' ? 'text-emerald-400' :
                t.kind === 'expense' ? 'text-rose-400' :
                'text-slate-300';
              return (
                <div key={t.id} className="flex items-center justify-between px-2 py-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {cat ? `${cat.emoji ?? ''} ${cat.name}` : t.kind === 'transfer' ? 'Transfer' : '—'}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {t.date} · {acct?.name ?? '?'}{t.toAccountId ? ` → ${accounts.find((a) => a.id === t.toAccountId)?.name ?? '?'}` : ''}
                      {t.note ? ` · ${t.note}` : ''}
                    </div>
                  </div>
                  <div className={`font-semibold ${color}`}>{sign}{fmtMoney(t.amount, settings).replace('-', '')}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  function accountTypeLabel(typeId: string) {
    return accountTypes.find((t) => t.id === typeId)?.name ?? '';
  }
}

function Stat({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className={`flex items-center justify-center gap-1 text-xs ${accent}`}>{icon}{label}</div>
      <div className={`mt-1 font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function EmptyHint({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="card block text-center text-slate-400 hover:text-slate-200">
      {label} →
    </Link>
  );
}
