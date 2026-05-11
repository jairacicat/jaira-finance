import { create } from 'zustand';
import type { Account, AccountType, Budget, Category, Recurring, Settings, Transaction } from './types';
import {
  appendValues, batchUpdate, clearRange, getValues, getSpreadsheetMeta,
  getUserEmail, isConfigured, setValues, signIn, signOut
} from './lib/google';
import {
  bootstrapSpreadsheet, ensureYear, HEADERS, TAB, writeDashboardFormulas, yearTab
} from './lib/sheetSchema';
import {
  accountToRow, accountTypeToRow, budgetToRow, categoryToRow,
  recurringToRow, rowToAccount, rowToAccountType, rowToBudget,
  rowToCategory, rowToRecurring, rowToTxn, txnToRow
} from './lib/mappers';
import { addInterval, todayISO, uid } from './lib/format';

const SETTINGS_KEY = 'jaira.settings.v1';

const defaultSettings: Settings = {
  spreadsheetId: '',
  userName: '',
  currency: 'PHP',
  locale: 'en-PH'
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}
function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export type Status = 'idle' | 'loading' | 'syncing' | 'error';

type StoreState = {
  configured: boolean;
  signedIn: boolean;
  email: string | null;
  settings: Settings;

  status: Status;
  error: string | null;
  lastSyncAt: number | null;

  year: number;
  accountTypes: AccountType[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[]; // for current year
  recurring: Recurring[];
  budgets: Budget[];

  // bootstrapping
  setSettings: (patch: Partial<Settings>) => void;
  signIn: () => Promise<void>;
  signOut: () => void;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  setYear: (y: number) => Promise<void>;

  // mutations
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  saveAccount: (a: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  saveAccountType: (a: AccountType) => Promise<void>;
  deleteAccountType: (id: string) => Promise<void>;

  saveCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  saveRecurring: (r: Recurring) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  runDueRecurring: () => Promise<number>;

  saveBudget: (b: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  rebuildDashboard: () => Promise<void>;
  resetSpreadsheet: () => Promise<void>;
};

export const useStore = create<StoreState>((set, get) => ({
  configured: isConfigured(),
  signedIn: false,
  email: null,
  settings: loadSettings(),
  status: 'idle',
  error: null,
  lastSyncAt: null,

  year: new Date().getFullYear(),
  accountTypes: [],
  accounts: [],
  categories: [],
  transactions: [],
  recurring: [],
  budgets: [],

  setSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },

  signIn: async () => {
    set({ status: 'loading', error: null });
    try {
      await signIn(true);
      set({ signedIn: true, email: getUserEmail() });
      // If a spreadsheet is already configured, bootstrap immediately.
      if (get().settings.spreadsheetId) await get().bootstrap();
      set({ status: 'idle' });
    } catch (e: any) {
      set({ status: 'error', error: e.message ?? String(e) });
    }
  },

  signOut: () => {
    signOut();
    set({
      signedIn: false, email: null,
      accountTypes: [], accounts: [], categories: [],
      transactions: [], recurring: [], budgets: []
    });
  },

  setYear: async (y) => {
    set({ year: y });
    if (get().settings.spreadsheetId && get().signedIn) {
      await ensureYear(get().settings.spreadsheetId, y);
      await get().refresh();
    }
  },

  bootstrap: async () => {
    const { settings, year } = get();
    if (!settings.spreadsheetId) throw new Error('No spreadsheet selected');
    set({ status: 'syncing', error: null });
    try {
      await bootstrapSpreadsheet(settings.spreadsheetId, year);
      await get().refresh();
      // Auto-run any recurring transactions that are due.
      await get().runDueRecurring();
      set({ status: 'idle' });
    } catch (e: any) {
      set({ status: 'error', error: e.message ?? String(e) });
    }
  },

  refresh: async () => {
    const { settings, year } = get();
    if (!settings.spreadsheetId) return;
    set({ status: 'syncing', error: null });
    try {
      const ranges = await Promise.all([
        getValues(settings.spreadsheetId, `${TAB.accountTypes}!A2:C`),
        getValues(settings.spreadsheetId, `${TAB.accounts}!A2:E`),
        getValues(settings.spreadsheetId, `${TAB.categories}!A2:E`),
        getValues(settings.spreadsheetId, `${TAB.recurring}!A2:M`),
        getValues(settings.spreadsheetId, `${TAB.budgets}!A2:C`),
        getValues(settings.spreadsheetId, `${yearTab(year)}!A2:I`)
      ]);
      set({
        accountTypes: ranges[0].filter((r) => r[0]).map(rowToAccountType),
        accounts: ranges[1].filter((r) => r[0]).map(rowToAccount),
        categories: ranges[2].filter((r) => r[0]).map(rowToCategory),
        recurring: ranges[3].filter((r) => r[0]).map(rowToRecurring),
        budgets: ranges[4].filter((r) => r[0]).map(rowToBudget),
        transactions: ranges[5].filter((r) => r[0]).map(rowToTxn),
        lastSyncAt: Date.now(),
        status: 'idle'
      });
    } catch (e: any) {
      set({ status: 'error', error: e.message ?? String(e) });
    }
  },

  addTransaction: async (t) => {
    const { settings } = get();
    const txn: Transaction = {
      ...t,
      id: uid('t_'),
      createdAt: new Date().toISOString()
    };
    const txnYear = Number(txn.date.slice(0, 4));
    // Make sure the year tab exists (handles New Year automatically).
    await ensureYear(settings.spreadsheetId, txnYear);
    await appendValues(settings.spreadsheetId, `${yearTab(txnYear)}!A1`, [txnToRow(txn)]);
    if (txnYear === get().year) {
      set({ transactions: [...get().transactions, txn] });
    } else {
      // switch to that year so the user sees their entry
      await get().setYear(txnYear);
    }
  },

  deleteTransaction: async (id) => {
    const { settings, year, transactions } = get();
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx < 0) return;
    // sheet row = idx + 2 (header on row 1)
    const row = idx + 2;
    await clearRange(settings.spreadsheetId, `${yearTab(year)}!A${row}:I${row}`);
    // Re-fetch is simplest & safest:
    await get().refresh();
  },

  saveAccount: async (a) => upsertSimple(get, set, TAB.accounts, 'accounts', a, accountToRow),
  deleteAccount: async (id) => deleteSimple(get, set, TAB.accounts, 'accounts', id, HEADERS[TAB.accounts].length),

  saveAccountType: async (a) => upsertSimple(get, set, TAB.accountTypes, 'accountTypes', a, accountTypeToRow),
  deleteAccountType: async (id) => deleteSimple(get, set, TAB.accountTypes, 'accountTypes', id, HEADERS[TAB.accountTypes].length),

  saveCategory: async (c) => upsertSimple(get, set, TAB.categories, 'categories', c, categoryToRow),
  deleteCategory: async (id) => deleteSimple(get, set, TAB.categories, 'categories', id, HEADERS[TAB.categories].length),

  saveRecurring: async (r) => upsertSimple(get, set, TAB.recurring, 'recurring', r, recurringToRow),
  deleteRecurring: async (id) => deleteSimple(get, set, TAB.recurring, 'recurring', id, HEADERS[TAB.recurring].length),

  saveBudget: async (b) => upsertSimple(get, set, TAB.budgets, 'budgets', b, budgetToRow),
  deleteBudget: async (id) => deleteSimple(get, set, TAB.budgets, 'budgets', id, HEADERS[TAB.budgets].length),

  runDueRecurring: async () => {
    const { recurring } = get();
    const today = todayISO();
    let count = 0;
    for (const r of recurring) {
      if (!r.active) continue;
      let nextDue = r.nextDue || r.startDate;
      while (nextDue && nextDue <= today && (!r.endDate || nextDue <= r.endDate)) {
        await get().addTransaction({
          date: nextDue,
          kind: r.kind,
          amount: r.amount,
          accountId: r.accountId,
          toAccountId: r.toAccountId,
          categoryId: r.categoryId,
          note: r.note ? `${r.note} (recurring)` : 'recurring'
        });
        nextDue = addInterval(nextDue, r.cadence, r.interval);
        count++;
      }
      if (nextDue !== r.nextDue) {
        await get().saveRecurring({ ...r, nextDue });
      }
    }
    if (count > 0) await get().refresh();
    return count;
  },

  rebuildDashboard: async () => {
    const { settings, year } = get();
    await writeDashboardFormulas(settings.spreadsheetId, year);
  },

  resetSpreadsheet: async () => {
    const { settings, year } = get();
    if (!settings.spreadsheetId) return;
    set({ status: 'syncing' });
    const tabs = [...Object.values(TAB), yearTab(year)];
    for (const t of tabs) {
      await clearRange(settings.spreadsheetId, `${t}!A2:Z`);
    }
    await writeDashboardFormulas(settings.spreadsheetId, year);
    await get().bootstrap();
  }
}));

// ---------- generic upsert/delete helpers ----------
type Keys = 'accounts' | 'accountTypes' | 'categories' | 'recurring' | 'budgets';

async function upsertSimple<T extends { id: string }>(
  get: () => StoreState,
  set: (patch: Partial<StoreState>) => void,
  tab: string,
  key: Keys,
  item: T,
  toRow: (x: T) => any[]
) {
  const { settings } = get();
  const list = ((get()[key] as unknown) as T[]).slice();
  const idx = list.findIndex((x) => x.id === item.id);
  const finalItem = item.id ? item : { ...item, id: uid(`${key.slice(0, 3)}_`) } as T;
  if (idx >= 0) {
    list[idx] = finalItem;
    const row = idx + 2;
    const cols = String.fromCharCode(64 + toRow(finalItem).length); // A..
    await setValues(settings.spreadsheetId, `${tab}!A${row}:${cols}${row}`, [toRow(finalItem)]);
  } else {
    list.push(finalItem);
    await appendValues(settings.spreadsheetId, `${tab}!A1`, [toRow(finalItem)]);
  }
  set({ [key]: list } as any);
}

async function deleteSimple(
  get: () => StoreState,
  set: (patch: Partial<StoreState>) => void,
  tab: string,
  key: Keys,
  id: string,
  numCols: number
) {
  const { settings } = get();
  const list = (get()[key] as { id: string }[]).slice();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return;
  list.splice(idx, 1);
  // Wipe the row in-place; then we'll compact by re-writing the whole list to keep it simple.
  const lastCol = String.fromCharCode(64 + numCols);
  await clearRange(settings.spreadsheetId, `${tab}!A2:${lastCol}`);
  if (list.length > 0) {
    const toRowFn = ROW_FNS[key];
    await setValues(settings.spreadsheetId, `${tab}!A2`, list.map((x) => toRowFn(x as any)));
  }
  set({ [key]: list } as any);
}

const ROW_FNS: Record<Keys, (x: any) => any[]> = {
  accounts: accountToRow,
  accountTypes: accountTypeToRow,
  categories: categoryToRow,
  recurring: recurringToRow,
  budgets: budgetToRow
};

// Also expose a helper to find a spreadsheet title (e.g., to display in settings UI).
export async function fetchSpreadsheetTitle(id: string): Promise<string> {
  const meta = await getSpreadsheetMeta(id);
  return meta.properties?.title ?? id;
}

// Expose a helper to wipe all data and create a fresh spreadsheet via store.
export async function batchUpdateProxy(spreadsheetId: string, requests: any[]) {
  return batchUpdate(spreadsheetId, requests);
}
