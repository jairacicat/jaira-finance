// Maps between typed objects and sheet rows.
import type { Account, AccountType, Budget, Category, Recurring, Transaction } from '../types';

const toBool = (v: any) => v === true || v === 'TRUE' || v === 'true' || v === 1;
const toNum = (v: any) => (v === '' || v == null ? 0 : Number(v));

export const rowToAccountType = (r: any[]): AccountType => ({
  id: String(r[0]),
  name: String(r[1] ?? ''),
  kind: (r[2] === 'liability' ? 'liability' : 'asset')
});
export const accountTypeToRow = (a: AccountType) => [a.id, a.name, a.kind];

export const rowToAccount = (r: any[]): Account => ({
  id: String(r[0]),
  name: String(r[1] ?? ''),
  typeId: String(r[2] ?? ''),
  openingBalance: toNum(r[3]),
  archived: toBool(r[4])
});
export const accountToRow = (a: Account) => [a.id, a.name, a.typeId, a.openingBalance, a.archived];

export const rowToCategory = (r: any[]): Category => ({
  id: String(r[0]),
  name: String(r[1] ?? ''),
  kind: r[2] === 'income' ? 'income' : 'expense',
  emoji: r[3] ? String(r[3]) : undefined,
  archived: toBool(r[4])
});
export const categoryToRow = (c: Category) => [c.id, c.name, c.kind, c.emoji ?? '', c.archived];

export const rowToTxn = (r: any[]): Transaction => ({
  id: String(r[0]),
  date: typeof r[1] === 'number' ? serialToYmd(r[1]) : String(r[1] ?? ''),
  kind: (r[2] as any) || 'expense',
  amount: toNum(r[3]),
  accountId: String(r[4] ?? ''),
  toAccountId: r[5] ? String(r[5]) : undefined,
  categoryId: r[6] ? String(r[6]) : undefined,
  note: r[7] ? String(r[7]) : undefined,
  createdAt: String(r[8] ?? '')
});
export const txnToRow = (t: Transaction) => [
  t.id, t.date, t.kind, t.amount, t.accountId, t.toAccountId ?? '', t.categoryId ?? '', t.note ?? '', t.createdAt
];

export const rowToRecurring = (r: any[]): Recurring => ({
  id: String(r[0]),
  active: toBool(r[1]),
  kind: (r[2] as any) || 'expense',
  amount: toNum(r[3]),
  accountId: String(r[4] ?? ''),
  toAccountId: r[5] ? String(r[5]) : undefined,
  categoryId: r[6] ? String(r[6]) : undefined,
  note: r[7] ? String(r[7]) : undefined,
  cadence: (r[8] as any) || 'monthly',
  interval: toNum(r[9]) || 1,
  startDate: String(r[10] ?? ''),
  nextDue: String(r[11] ?? ''),
  endDate: r[12] ? String(r[12]) : undefined
});
export const recurringToRow = (r: Recurring) => [
  r.id, r.active, r.kind, r.amount, r.accountId, r.toAccountId ?? '', r.categoryId ?? '',
  r.note ?? '', r.cadence, r.interval, r.startDate, r.nextDue, r.endDate ?? ''
];

export const rowToBudget = (r: any[]): Budget => ({
  id: String(r[0]),
  categoryId: String(r[1] ?? ''),
  monthlyLimit: toNum(r[2])
});
export const budgetToRow = (b: Budget) => [b.id, b.categoryId, b.monthlyLimit];

// Sheets sometimes returns dates as serial numbers (days since 1899-12-30).
function serialToYmd(serial: number): string {
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
