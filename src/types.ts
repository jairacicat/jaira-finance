export type AccountType = {
  id: string;
  name: string;
  // 'asset' for cash/bank/e-wallet/investment, 'liability' for credit cards/loans
  kind: 'asset' | 'liability';
};

export type Account = {
  id: string;
  name: string;
  typeId: string;
  openingBalance: number;
  archived: boolean;
};

export type CategoryKind = 'expense' | 'income';

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  emoji?: string;
  archived: boolean;
};

export type TxnKind = 'expense' | 'income' | 'transfer';

export type Transaction = {
  id: string;
  date: string;          // YYYY-MM-DD
  kind: TxnKind;
  amount: number;        // positive number; meaning depends on kind
  accountId: string;     // for expense/income: the affected account; for transfer: source
  toAccountId?: string;  // transfer destination
  categoryId?: string;   // expense/income only
  note?: string;
  createdAt: string;     // ISO
};

export type Recurring = {
  id: string;
  active: boolean;
  kind: TxnKind;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  note?: string;
  // simple: every N days/weeks/months from startDate; nextDue computed
  cadence: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N units
  startDate: string; // YYYY-MM-DD
  nextDue: string;   // YYYY-MM-DD
  endDate?: string;  // optional
};

export type Budget = {
  id: string;
  categoryId: string; // expense category
  monthlyLimit: number;
};

export type Settings = {
  spreadsheetId: string;
  userName: string;
  currency: string; // ISO code, e.g. PHP
  locale: string;   // e.g. en-PH
};
