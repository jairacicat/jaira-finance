// Sheet schema & bootstrap. Idempotent: safe to call repeatedly.
//
// Tabs:
//   Settings        key/value
//   AccountTypes    id | name | kind
//   Accounts        id | name | typeId | openingBalance | archived
//   Categories      id | name | kind | emoji | archived
//   Recurring       id | active | kind | amount | accountId | toAccountId | categoryId | note | cadence | interval | startDate | nextDue | endDate
//   Budgets         id | categoryId | monthlyLimit
//   <YYYY>          id | date | kind | amount | accountId | toAccountId | categoryId | note | createdAt
//   Dashboard <YYYY> formulas, readable offline in Sheets
import { batchUpdate, getSpreadsheetMeta, setValues, getValues } from './google';
export const TAB = {
    settings: 'Settings',
    accountTypes: 'AccountTypes',
    accounts: 'Accounts',
    categories: 'Categories',
    recurring: 'Recurring',
    budgets: 'Budgets'
};
export const HEADERS = {
    [TAB.settings]: ['key', 'value'],
    [TAB.accountTypes]: ['id', 'name', 'kind'],
    [TAB.accounts]: ['id', 'name', 'typeId', 'openingBalance', 'archived'],
    [TAB.categories]: ['id', 'name', 'kind', 'emoji', 'archived'],
    [TAB.recurring]: [
        'id', 'active', 'kind', 'amount', 'accountId', 'toAccountId',
        'categoryId', 'note', 'cadence', 'interval', 'startDate', 'nextDue', 'endDate'
    ],
    [TAB.budgets]: ['id', 'categoryId', 'monthlyLimit']
};
export const TXN_HEADERS = [
    'id', 'date', 'kind', 'amount', 'accountId', 'toAccountId', 'categoryId', 'note', 'createdAt'
];
export function yearTab(year) {
    return String(year);
}
export function dashboardTab(year) {
    return `Dashboard ${year}`;
}
async function getSheets(spreadsheetId) {
    const meta = await getSpreadsheetMeta(spreadsheetId);
    return (meta.sheets || []).map((s) => ({ sheetId: s.properties.sheetId, title: s.properties.title }));
}
async function ensureSheet(spreadsheetId, title, existing) {
    const found = existing.find((s) => s.title === title);
    if (found)
        return found;
    const res = await batchUpdate(spreadsheetId, [{ addSheet: { properties: { title } } }]);
    const props = res.replies[0].addSheet.properties;
    const meta = { sheetId: props.sheetId, title: props.title };
    existing.push(meta);
    return meta;
}
async function ensureHeaders(spreadsheetId, title, headers) {
    const current = await getValues(spreadsheetId, `${title}!1:1`);
    const have = (current[0] || []).map(String);
    const same = have.length === headers.length && headers.every((h, i) => have[i] === h);
    if (!same) {
        await setValues(spreadsheetId, `${title}!A1`, [Array.from(headers)]);
    }
}
/** Create base tabs + headers if missing. Returns the year tab created/ensured for `year`. */
export async function bootstrapSpreadsheet(spreadsheetId, year) {
    const sheets = await getSheets(spreadsheetId);
    // Base tabs
    for (const t of Object.values(TAB))
        await ensureSheet(spreadsheetId, t, sheets);
    for (const t of Object.values(TAB)) {
        const headers = HEADERS[t];
        await ensureHeaders(spreadsheetId, t, headers);
    }
    // Year tab
    const yt = yearTab(year);
    await ensureSheet(spreadsheetId, yt, sheets);
    await ensureHeaders(spreadsheetId, yt, TXN_HEADERS);
    // Dashboard tab
    const dt = dashboardTab(year);
    const wasMissingDash = !sheets.find((s) => s.title === dt);
    await ensureSheet(spreadsheetId, dt, sheets);
    if (wasMissingDash) {
        await writeDashboardFormulas(spreadsheetId, year);
    }
    // If the first-ever bootstrap, seed defaults.
    await maybeSeedDefaults(spreadsheetId);
}
/** Ensure a year tab exists (called when logging in a new year, e.g. Jan 1). */
export async function ensureYear(spreadsheetId, year) {
    const sheets = await getSheets(spreadsheetId);
    const yt = yearTab(year);
    if (!sheets.find((s) => s.title === yt)) {
        await ensureSheet(spreadsheetId, yt, sheets);
        await ensureHeaders(spreadsheetId, yt, TXN_HEADERS);
    }
    const dt = dashboardTab(year);
    if (!sheets.find((s) => s.title === dt)) {
        await ensureSheet(spreadsheetId, dt, sheets);
        await writeDashboardFormulas(spreadsheetId, year);
    }
}
async function maybeSeedDefaults(spreadsheetId) {
    // Seed only if Categories is empty (only header row).
    const cats = await getValues(spreadsheetId, `${TAB.categories}!A2:E`);
    if (cats.length === 0) {
        const seed = [
            ['cat_food', 'Food & Dining', 'expense', '🍔', false],
            ['cat_groc', 'Groceries', 'expense', '🛒', false],
            ['cat_tran', 'Transport', 'expense', '🚗', false],
            ['cat_util', 'Utilities', 'expense', '💡', false],
            ['cat_rent', 'Rent / Housing', 'expense', '🏠', false],
            ['cat_heal', 'Health', 'expense', '💊', false],
            ['cat_ent', 'Entertainment', 'expense', '🎬', false],
            ['cat_shop', 'Shopping', 'expense', '🛍️', false],
            ['cat_misc', 'Miscellaneous', 'expense', '📦', false],
            ['cat_sal', 'Salary', 'income', '💼', false],
            ['cat_free', 'Freelance', 'income', '🧑‍💻', false],
            ['cat_gift', 'Gift', 'income', '🎁', false],
            ['cat_int', 'Interest', 'income', '🏦', false]
        ];
        await setValues(spreadsheetId, `${TAB.categories}!A2`, seed);
    }
    const types = await getValues(spreadsheetId, `${TAB.accountTypes}!A2:C`);
    if (types.length === 0) {
        await setValues(spreadsheetId, `${TAB.accountTypes}!A2`, [
            ['at_cash', 'Cash', 'asset'],
            ['at_bank', 'Bank Account', 'asset'],
            ['at_ewal', 'E-Wallet', 'asset'],
            ['at_inv', 'Investment', 'asset'],
            ['at_cc', 'Credit Card', 'liability'],
            ['at_loan', 'Loan', 'liability']
        ]);
    }
}
/**
 * Writes a human-readable, formula-driven dashboard for the given year.
 * All numbers update automatically as the YYYY tab gets new rows.
 */
export async function writeDashboardFormulas(spreadsheetId, year) {
    const yt = yearTab(year);
    const dt = dashboardTab(year);
    const T = `'${yt}'`; // quoted ref
    // Helpful column refs in YYYY: B=date, C=kind, D=amount, E=accountId, F=toAccountId, G=categoryId
    const A = (range) => `${T}!${range}`;
    const rows = [];
    rows.push([`Dashboard — ${year}`, '', '', '', '']);
    rows.push(['Auto-updated from the ', yt, ' sheet. Safe to view offline.', '', '']);
    rows.push([]);
    // Totals
    rows.push(['Totals', '', '', '', '']);
    rows.push(['Total Income', `=SUMIF(${A('C:C')},"income",${A('D:D')})`, '', 'Total Expense', `=SUMIF(${A('C:C')},"expense",${A('D:D')})`]);
    rows.push(['Net (Income − Expense)', `=B5-E5`, '', 'Transactions', `=COUNTA(${A('A:A')})-1`]);
    rows.push([]);
    // Monthly breakdown
    rows.push(['Monthly Breakdown', '', '', '', '']);
    rows.push(['Month', 'Income', 'Expense', 'Net', 'Cumulative Net']);
    const monthStartRow = rows.length + 1; // 1-based
    for (let m = 1; m <= 12; m++) {
        const monthLabel = new Date(year, m - 1, 1).toLocaleString('en-US', { month: 'short' });
        const inc = `=SUMIFS(${A('D:D')},${A('C:C')},"income",${A('B:B')},">="&DATE(${year},${m},1),${A('B:B')},"<"&DATE(${year},${m + 1},1))`;
        const exp = `=SUMIFS(${A('D:D')},${A('C:C')},"expense",${A('B:B')},">="&DATE(${year},${m},1),${A('B:B')},"<"&DATE(${year},${m + 1},1))`;
        const net = `=B${monthStartRow + m - 1}-C${monthStartRow + m - 1}`;
        const cum = m === 1
            ? `=D${monthStartRow}`
            : `=E${monthStartRow + m - 2}+D${monthStartRow + m - 1}`;
        rows.push([monthLabel, inc, exp, net, cum]);
    }
    rows.push([]);
    // Spending by category (expense only)
    rows.push(['Top Expense Categories', '', '', '', '']);
    rows.push(['Category', 'Total', '', '', '']);
    const catFormula = `=IFERROR(QUERY({${A('G:G')},${A('C:C')},${A('D:D')}},"select Col1, sum(Col3) where Col2='expense' and Col1 is not null group by Col1 order by sum(Col3) desc label sum(Col3) ''",0),"(no data yet)")`;
    rows.push([catFormula, '', '', '', '']);
    rows.push([]);
    // Account net flow
    rows.push(['Account Net Flow (this year)', '', '', '', '']);
    rows.push(['Account', 'In', 'Out', 'Net', '']);
    // Money in: income to account + transfer-in (toAccountId)
    // Money out: expense from account + transfer-out (accountId)
    const acctFormula = `=IFERROR(QUERY({{${A('E:E')},${A('C:C')},${A('D:D')}};{${A('F:F')},IF(${A('C:C')}="transfer","transfer-in",""),${A('D:D')}}},"select Col1, sum(Col3) where Col1 is not null and (Col2='income' or Col2='transfer-in') group by Col1 label sum(Col3) ''",0),"(no data yet)")`;
    rows.push([acctFormula, '', '', '', '']);
    // Resize to header column width by writing as one block.
    await setValues(spreadsheetId, `${dt}!A1`, rows);
    // Light formatting: bold section headers, currency format on numeric columns.
    // We need the sheetId of the dashboard to format. Look it up.
    const sheets = await getSheets(spreadsheetId);
    const dash = sheets.find((s) => s.title === dt);
    if (!dash)
        return;
    const requests = [
        // Title bold + larger
        {
            repeatCell: {
                range: { sheetId: dash.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 },
                cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
                fields: 'userEnteredFormat.textFormat'
            }
        },
        // Section titles (rows 4, 8, 9 header, etc. — bold a few likely rows)
        ...[4, 8, 9, 22, 23, 27, 28].map((r) => ({
            repeatCell: {
                range: { sheetId: dash.sheetId, startRowIndex: r - 1, endRowIndex: r, startColumnIndex: 0, endColumnIndex: 5 },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: 'userEnteredFormat.textFormat'
            }
        })),
        // Number-ish columns: format columns B–E as numbers with 2 decimals
        {
            repeatCell: {
                range: { sheetId: dash.sheetId, startRowIndex: 1, startColumnIndex: 1, endColumnIndex: 5 },
                cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0.00;[Red]-#,##0.00' } } },
                fields: 'userEnteredFormat.numberFormat'
            }
        },
        {
            updateSheetProperties: {
                properties: { sheetId: dash.sheetId, gridProperties: { frozenRowIndex: 1 } },
                fields: 'gridProperties.frozenRowIndex'
            }
        }
    ];
    await batchUpdate(spreadsheetId, requests);
}
