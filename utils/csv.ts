import { Expense } from '@/db/database';
import { uuid } from '@/utils/dates';

const CSV_HEADER = 'id,amount,description,tag,payment_method,is_recurring,is_excluded,month,created_at';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function expensesToCsv(expenses: Expense[]): string {
  const rows = expenses.map((e) =>
    [
      escapeCsvField(e.id),
      e.amount,
      escapeCsvField(e.description),
      escapeCsvField(e.tag),
      e.paymentMethod,
      e.isRecurring ? '1' : '0',
      e.isExcluded ? '1' : '0',
      e.month,
      e.createdAt,
    ].join(',')
  );
  return [CSV_HEADER, ...rows].join('\n');
}

export function csvToExpenses(csv: string): Expense[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].trim();
  if (header !== CSV_HEADER) {
    throw new Error('Invalid CSV format: header mismatch');
  }

  const expenses: Expense[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < 9) continue;

    expenses.push({
      id: fields[0] || uuid(),
      amount: parseInt(fields[1], 10) || 0,
      description: fields[2],
      tag: fields[3],
      paymentMethod: (fields[4] as Expense['paymentMethod']) || 'cash',
      isRecurring: fields[5] === '1',
      isExcluded: fields[6] === '1',
      month: fields[7],
      createdAt: parseInt(fields[8], 10) || Date.now(),
    });
  }
  return expenses;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
