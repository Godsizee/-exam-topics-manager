import { createClient, Client } from '@libsql/client';

export type Subject = 'BWL' | 'Datenbanken' | 'Java' | 'SAP';

export interface Topic {
  id: string;
  title: string;
  createdAt: string;
}

const globalForDb = globalThis as unknown as {
  db: Client | undefined;
};

export const db = globalForDb.db ?? createClient({
  url: 'file:exam_topics.db',
});

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

let isInitialized = false;

export async function ensureDb() {
  if (isInitialized) return;

  // Create table if it doesn't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  isInitialized = true;
}
