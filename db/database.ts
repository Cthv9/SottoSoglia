import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export async function initDb(): Promise<void> {
  db = await SQLite.openDatabaseAsync('sottosoglia.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      tag TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT 'cash',
      is_recurring INTEGER NOT NULL DEFAULT 0,
      is_excluded INTEGER NOT NULL DEFAULT 0,
      month TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);
  `);
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  tag: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  isExcluded: boolean;
  month: string;
  createdAt: number;
}

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    amount: row.amount as number,
    description: row.description as string,
    tag: row.tag as string,
    paymentMethod: row.payment_method as PaymentMethod,
    isRecurring: (row.is_recurring as number) === 1,
    isExcluded: (row.is_excluded as number) === 1,
    month: row.month as string,
    createdAt: row.created_at as number,
  };
}

export async function getExpensesByMonth(month: string): Promise<Expense[]> {
  const database = getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM expenses WHERE month = ? ORDER BY created_at DESC',
    [month]
  );
  return rows.map(rowToExpense);
}

export async function getAllExpenses(): Promise<Expense[]> {
  const database = getDb();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM expenses ORDER BY month DESC, created_at DESC'
  );
  return rows.map(rowToExpense);
}

export async function insertExpense(expense: Expense): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT INTO expenses (id, amount, description, tag, payment_method, is_recurring, is_excluded, month, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      expense.id,
      expense.amount,
      expense.description,
      expense.tag,
      expense.paymentMethod,
      expense.isRecurring ? 1 : 0,
      expense.isExcluded ? 1 : 0,
      expense.month,
      expense.createdAt,
    ]
  );
}

export async function deleteExpense(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function updateExpenseExcluded(id: string, isExcluded: boolean): Promise<void> {
  const database = getDb();
  await database.runAsync('UPDATE expenses SET is_excluded = ? WHERE id = ?', [
    isExcluded ? 1 : 0,
    id,
  ]);
}

export async function getSetting(key: string): Promise<string | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function insertExpensesBatch(expenses: Expense[]): Promise<void> {
  const database = getDb();
  await database.withTransactionAsync(async () => {
    for (const expense of expenses) {
      await database.runAsync(
        `INSERT OR REPLACE INTO expenses (id, amount, description, tag, payment_method, is_recurring, is_excluded, month, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          expense.amount,
          expense.description,
          expense.tag,
          expense.paymentMethod,
          expense.isRecurring ? 1 : 0,
          expense.isExcluded ? 1 : 0,
          expense.month,
          expense.createdAt,
        ]
      );
    }
  });
}
