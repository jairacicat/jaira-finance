import { useState } from 'react';
import { useStore } from '../store';
import type { Category } from '../types';
import { uid } from '../lib/format';
import { Pencil, Trash, Plus } from '../components/icons';
import { Modal, FormButtons } from './Accounts';

export default function CategoriesPage() {
  const { categories, saveCategory, deleteCategory } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [filter, setFilter] = useState<'expense' | 'income'>('expense');

  const list = categories.filter((c) => c.kind === filter);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Categories</h1>

      <div className="grid grid-cols-2 gap-2">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`py-2 rounded-xl text-sm font-medium ${
              filter === k
                ? k === 'expense' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {k === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          className="btn-ghost text-sm"
          onClick={() => setEditing({ id: '', name: '', kind: filter, emoji: '', archived: false })}
        >
          <Plus className="w-4 h-4" /> New {filter} category
        </button>
      </div>

      <div className="card divide-y divide-slate-800 -mx-1">
        {list.length === 0 && <div className="px-2 py-3 text-slate-400 text-sm">No categories yet.</div>}
        {list.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-2 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{c.emoji || '🏷️'}</span>
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                {c.archived && <div className="text-xs text-slate-500">archived</div>}
              </div>
            </div>
            <div className="flex gap-1">
              <button className="btn-ghost p-2" onClick={() => setEditing(c)}><Pencil className="w-4 h-4" /></button>
              <button
                className="btn-ghost p-2 text-rose-400"
                onClick={() => window.confirm(`Delete category "${c.name}"?`) && deleteCategory(c.id)}
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit Category' : 'New Category'} onClose={() => setEditing(null)}>
          <CategoryForm
            value={editing}
            onCancel={() => setEditing(null)}
            onSave={async (v) => {
              await saveCategory(v.id ? v : { ...v, id: uid('cat_') });
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function CategoryForm({ value, onSave, onCancel }: { value: Category; onSave: (v: Category) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <div>
          <label className="label">Emoji</label>
          <input className="input text-center text-xl" value={v.emoji ?? ''} maxLength={2} onChange={(e) => setV({ ...v, emoji: e.target.value })} />
        </div>
        <div>
          <label className="label">Name</label>
          <input className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
        </div>
      </div>
      <div>
        <label className="label">Kind</label>
        <select className="input" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as any })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={v.archived} onChange={(e) => setV({ ...v, archived: e.target.checked })} />
        Archived
      </label>
      <FormButtons onCancel={onCancel} onSave={() => v.name && onSave(v)} disabled={!v.name} />
    </div>
  );
}
