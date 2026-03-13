import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/waitlist — active waitlist entries
export async function GET() {
  try {
    const db = getDb();
    const entries = db.prepare(
      `SELECT * FROM waitlist WHERE status IN ('waiting', 'notified') ORDER BY added_at ASC`
    ).all();
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/waitlist — add to waitlist
export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { guest_name, phone, party_size, notes, quoted_wait } = body;

    if (!guest_name || !party_size) {
      return NextResponse.json({ error: 'guest_name and party_size required' }, { status: 400 });
    }

    const result = db.prepare(
      `INSERT INTO waitlist (guest_name, phone, party_size, notes, quoted_wait) VALUES (?, ?, ?, ?, ?)`
    ).run(guest_name, phone || null, party_size, notes || null, quoted_wait || 15);

    const entry = db.prepare('SELECT * FROM waitlist WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/waitlist — update status
export async function PATCH(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

    if (status === 'notified') {
      db.prepare('UPDATE waitlist SET status = ?, notified_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    } else if (status === 'seated') {
      db.prepare('UPDATE waitlist SET status = ?, seated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    } else {
      db.prepare('UPDATE waitlist SET status = ? WHERE id = ?').run(status, id);
    }

    const entry = db.prepare('SELECT * FROM waitlist WHERE id = ?').get(id);
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/waitlist
export async function DELETE(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM waitlist WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
