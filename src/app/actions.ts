'use server';

import { db, ensureDb, Subject, Topic } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Load all topics and group them by Subject
export async function getTopicsAction(): Promise<Record<Subject, Topic[]>> {
  await ensureDb();

  const result = await db.execute('SELECT id, subject, title, created_at FROM topics ORDER BY created_at DESC');
  
  const grouped: Record<Subject, Topic[]> = {
    BWL: [],
    Datenbanken: [],
    Java: [],
    SAP: []
  };

  for (const row of result.rows) {
    const subject = row.subject as Subject;
    if (grouped[subject]) {
      grouped[subject].push({
        id: row.id as string,
        title: row.title as string,
        createdAt: row.created_at as string
      });
    }
  }

  return grouped;
}

// Add a new topic
export async function addTopicAction(subject: Subject, title: string): Promise<{ success: boolean; error?: string }> {
  await ensureDb();

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { success: false, error: 'Das Thema darf nicht leer sein.' };
  }

  // Server-side duplicate validation
  const duplicateCheck = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM topics WHERE subject = ? AND LOWER(title) = ?',
    args: [subject, trimmedTitle.toLowerCase()]
  });

  const count = Number(duplicateCheck.rows[0]?.count || 0);
  if (count > 0) {
    return { success: false, error: 'Dieses Thema existiert bereits in diesem Fach!' };
  }

  const id = `${subject.toLowerCase()}-${Date.now()}`;
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO topics (id, subject, title, created_at) VALUES (?, ?, ?, ?)',
    args: [id, subject, trimmedTitle, createdAt]
  });

  // Revalidate the home page so Next.js fetches fresh server-rendered data
  revalidatePath('/');

  return { success: true };
}

// Delete a topic
export async function deleteTopicAction(subject: Subject, id: string): Promise<{ success: boolean; error?: string }> {
  await ensureDb();

  await db.execute({
    sql: 'DELETE FROM topics WHERE id = ? AND subject = ?',
    args: [id, subject]
  });

  // Revalidate the home page to update cache
  revalidatePath('/');

  return { success: true };
}
