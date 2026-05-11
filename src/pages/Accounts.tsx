import { useState } from 'react';
import { useStore } from '../store';
import type { Account, AccountType } from '../types';
import { fmtMoney, uid } from '../lib/format';
import { Pencil, Trash, Plus, Check, X } from '../components/icons';

export default function AccountsPage() {
  const { accounts, accountTypes, settings, saveAccount, deleteAccount, saveAccountType, deleteAccountType } = useStore();
  const [editingType, setEditingType] = useState<AccountType | null>(null);
  const [editingAcct, setEditingAcct] = useState<Account | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Accounts</h1>

      {/* Account Types */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Account Types</div>
          <button className="btn-ghost text-sm" onClick={() => setEditingType({ id: '', name: '', kind: 'asset' })}>
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="card divide-y divide-slate-800 -mx-1">
          {accountTypes.length === 0 && <div className="px-2 py-3 text-slate-400 text-sm">No types yet.</div>}
          {accountTypes.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-2 py-2.5">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-400">{t.kind}</div>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-2" onClick={() => setEditingType(t)}><Pencil className="w-4 h-4" /></button>
                <button className="btn-ghost p-2 text-rose-400" onClick={() => confirmDel(`Delete type "${t.name}"?`, () => deleteAccountType(t.id))}><Trash className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accounts */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Accounts</div>
          <button
            className="btn-ghost text-sm"
            disabled={accountTypes.length === 0}
            onClick={() => setEditingAcct({ id: '', name: '', typeId: accountTypes[0]?.id ?? '', openingBalance: 0, archived: false })}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="card divide-y divide-slate-800 -mx-1">
          {accounts.length === 0 && <div className="px-2 py-3 text-slate-400 text-sm">No accounts yet.</div>}
          {accounts.map((a) => {
            const type = accountTypes.find((t) => t.id === a.typeId);
            return (
              <div key={a.id} className="flex items-center justify-between px-2 py-2.5">
                <div>
                  <div className="font-medium">
                    {a.name} {a.archived && <span className="chip ml-1">archived</span>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {type?.name ?? '?'} · opening {fmtMoney(a.openingBalance, settings)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost p-2" onClick={() => setEditingAcct(a)}><Pencil className="w-4 h-4" /></button>
                  <button className="btn-ghost p-2 text-rose-400" onClick={() => confirmDel(`Delete account "${a.name}"? Existing transactions stay but lose their account label.`, () => deleteAccount(a.id))}><Trash className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editingType && (
        <Modal title={editingType.id ? 'Edit Type' : 'New Type'} onClose={() => setEditingType(null)}>
          <TypeForm
            value={editingType}
            onCancel={() => setEditingType(null)}
            onSave={async (v) => {
              await saveAccountType(v.id ? v : { ...v, id: uid('at_') });
              setEditingType(null);
            }}
          />
        </Modal>
      )}
      {editingAcct && (
        <Modal title={editingAcct.id ? 'Edit Account' : 'New Account'} onClose={() => setEditingAcct(null)}>
          <AcctForm
            value={editingAcct}
            types={accountTypes}
            onCancel={() => setEditingAcct(null)}
            onSave={async (v) => {
              await saveAccount(v.id ? v : { ...v, id: uid('a_') });
              setEditingAcct(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function TypeForm({ value, onSave, onCancel }: { value: AccountType; onSave: (v: AccountType) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
      </div>
      <div>
        <label className="label">Kind</label>
        <select className="input" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as any })}>
          <option value="asset">Asset (cash, bank, e-wallet, investment)</option>
          <option value="liability">Liability (credit card, loan)</option>
        </select>
      </div>
      <FormButtons onCancel={onCancel} onSave={() => v.name && onSave(v)} disabled={!v.name} />
    </div>
  );
}

function AcctForm({ value, types, onSave, onCancel }: { value: Account; types: AccountType[]; onSave: (v: Account) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Name</label>
        <input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
      </div>
      <div>
        <label className="label">Type</label>
        <select className="input" value={v.typeId} onChange={(e) => setV({ ...v, typeId: e.target.value })}>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Opening balance</label>
        <input
          type="number" step="0.01" className="input"
          value={v.openingBalance}
          onChange={(e) => setV({ ...v, openingBalance: Number(e.target.value) })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={v.archived} onChange={(e) => setV({ ...v, archived: e.target.checked })} />
        Archived
      </label>
      <FormButtons onCancel={onCancel} onSave={() => v.name && v.typeId && onSave(v)} disabled={!v.name || !v.typeId} />
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{title}</h2>
          <button className="btn-ghost p-2" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormButtons({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 pt-2">
      <button className="btn-secondary flex-1" onClick={onCancel}>Cancel</button>
      <button className="btn-primary flex-1" disabled={disabled} onClick={onSave}><Check className="w-4 h-4" /> Save</button>
    </div>
  );
}

function confirmDel(msg: string, fn: () => Promise<void> | void) {
  if (window.confirm(msg)) Promise.resolve(fn()).catch((e) => alert(e.message));
}
