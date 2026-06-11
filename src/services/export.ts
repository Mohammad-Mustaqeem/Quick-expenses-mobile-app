import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FS = FileSystem as any;
import { Currency, Expense, ExpenseFile } from '../types';
import { formatCurrency, fileTotal, formatDate, formatDateTime } from '../utils/helpers';

/**
 * Build a lookup map: expense id → 1-based position in the full list.
 * When exporting filtered results, pass the original full expenses array
 * so serial numbers reflect the true entry position, not just the subset.
 */
function buildIndexMap(originalExpenses: Expense[]): Map<string, number> {
  const map = new Map<string, number>();
  originalExpenses.forEach((e, i) => map.set(e.id, i + 1));
  return map;
}

export async function exportToPDF(
  file: ExpenseFile,
  originalExpenses?: Expense[],
  currency?: Pick<Currency, 'symbol' | 'locale'>,
): Promise<void> {
  const indexMap = buildIndexMap(originalExpenses ?? file.expenses);

  const rows = file.expenses
    .map((e) => {
      const sno = indexMap.get(e.id) ?? '—';
      return `
        <tr>
          <td>${sno}</td>
          <td>${e.particular}</td>
          <td class="amount">${formatCurrency(e.amount, currency)}</td>
          <td class="datetime">${formatDateTime(e.createdAt)}</td>
        </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, sans-serif; padding: 40px; color: #1C1C1E; background: #fff; }
    h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 6px; }
    .meta { color: #787776; font-size: 13px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F2F2F7; padding: 10px 14px; text-align: left; font-size: 11px; color: #787776; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 11px 14px; border-bottom: 1px solid rgba(60,60,67,0.1); font-size: 14px; vertical-align: top; }
    .amount { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .datetime { font-size: 12px; color: #555; white-space: nowrap; }
    .total td { font-weight: 600; background: #F9F9F9; font-size: 15px; }
    th:nth-child(1), td:nth-child(1) { width: 48px; }
    th:last-child, td:last-child { width: 160px; }
  </style>
</head>
<body>
  <h1>${file.name}</h1>
  <p class="meta">${file.expenses.length} expense${file.expenses.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Generated ${formatDate(new Date().toISOString())}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Particular</th>
        <th style="text-align:right">Amount</th>
        <th>Date &amp; Time Added</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total">
        <td colspan="2">Total</td>
        <td class="amount">${formatCurrency(fileTotal(file.expenses), currency)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
}

export async function exportToCSV(
  file: ExpenseFile,
  originalExpenses?: Expense[],
  currency?: Pick<Currency, 'symbol' | 'locale'>,
): Promise<void> {
  const indexMap = buildIndexMap(originalExpenses ?? file.expenses);

  const header = 'No.,Particular,Amount (INR),Date & Time Added\n';
  const rows = file.expenses
    .map((e) => {
      const sno = indexMap.get(e.id) ?? '';
      return `${sno},"${e.particular.replace(/"/g, '""')}",${e.amount},${formatDateTime(e.createdAt)}`;
    })
    .join('\n');
  const footer = `\nTotal,,${fileTotal(file.expenses)},`;

  const csv = header + rows + footer;
  const fileName = file.name.replace(/[^a-z0-9]/gi, '_');
  const path = `${FS.cacheDirectory}${fileName}.csv`;

  await FileSystem.writeAsStringAsync(path, csv, {
    encoding: 'utf8' as never,
  });
  await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: '.csv' });
}
