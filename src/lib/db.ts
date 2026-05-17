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

  // Seed with initial topics if table is empty
  const countRes = await db.execute('SELECT COUNT(*) as count FROM topics');
  const count = Number(countRes.rows[0]?.count || 0);

  if (count === 0) {
    const now = Date.now();
    const INITIAL_TOPICS = [
      // BWL
      { id: 'bwl-1', subject: 'BWL', title: 'Marketing-Mix (4 Ps: Product, Price, Place, Promotion)', created_at: new Date(now - 3600000 * 24 * 3).toISOString() },
      { id: 'bwl-2', subject: 'BWL', title: 'Rechtsformen (GmbH, AG, Einzelunternehmen, OHG)', created_at: new Date(now - 3600000 * 24 * 1.5).toISOString() },
      { id: 'bwl-3', subject: 'BWL', title: 'Deckungsbeitragsrechnung & Break-Even-Point Analyse', created_at: new Date(now - 3600000 * 6).toISOString() },
      // Datenbanken
      { id: 'db-1', subject: 'Datenbanken', title: 'ER-Modellierung & Kardinalitäten (1:1, 1:n, m:n)', created_at: new Date(now - 3600000 * 24 * 4).toISOString() },
      { id: 'db-2', subject: 'Datenbanken', title: 'SQL-Abfragen (JOINs, GROUP BY, HAVING, Unterabfragen)', created_at: new Date(now - 3600000 * 24 * 1).toISOString() },
      { id: 'db-3', subject: 'Datenbanken', title: 'Normalisierung von Relationen (1. bis 3. Normalform)', created_at: new Date(now - 3600000 * 4).toISOString() },
      // Java
      { id: 'java-1', subject: 'Java', title: 'Prinzipien der OOP (Vererbung, Polymorphie, Kapselung)', created_at: new Date(now - 3600000 * 24 * 5).toISOString() },
      { id: 'java-2', subject: 'Java', title: 'Fehlerbehandlung mittels Try-Catch & Custom Exceptions', created_at: new Date(now - 3600000 * 18).toISOString() },
      // SAP
      { id: 'sap-1', subject: 'SAP', title: 'Organisationsstrukturen im SAP ERP (Mandant, Buchungskreis, Werk)', created_at: new Date(now - 3600000 * 24 * 2).toISOString() },
      { id: 'sap-2', subject: 'SAP', title: 'SD-Prozesskette: Von der Kundenanfrage bis zum Zahlungseingang', created_at: new Date(now - 3600000 * 2).toISOString() }
    ];

    for (const t of INITIAL_TOPICS) {
      await db.execute({
        sql: 'INSERT INTO topics (id, subject, title, created_at) VALUES (?, ?, ?, ?)',
        args: [t.id, t.subject, t.title, t.created_at]
      });
    }
    console.log('Database seeded with initial topics successfully.');
  }

  isInitialized = true;
}
