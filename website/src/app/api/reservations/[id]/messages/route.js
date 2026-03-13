import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const messages = db.prepare('SELECT * FROM messages WHERE reservation_id = ? ORDER BY created_at ASC').all(id);
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    if (!body.content || !body.sender) {
      return NextResponse.json({ error: 'Missing content or sender' }, { status: 400 });
    }

    const result = db.prepare('INSERT INTO messages (reservation_id, sender, content) VALUES (?, ?, ?)').run(id, body.sender, body.content);
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
