import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM reservations';
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }
    if (search) {
      conditions.push('(guest_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY date DESC, time ASC';

    const reservations = db.prepare(query).all(...params);
    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { guest_name, email, phone, date, time, party_size, occasion, notes } = body;

    if (!guest_name || !email || !phone || !date || !time || !party_size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create guest
    let guest = db.prepare('SELECT * FROM guests WHERE email = ?').get(email);
    if (!guest) {
      const guestResult = db.prepare('INSERT INTO guests (name, email, phone) VALUES (?, ?, ?)').run(guest_name, email, phone);
      guest = { id: guestResult.lastInsertRowid };
    }

    const result = db.prepare(`
      INSERT INTO reservations (guest_id, guest_name, email, phone, date, time, party_size, occasion, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(guest.id, guest_name, email, phone, date, time, party_size, occasion || null, notes || null);

    // Auto-create welcome message
    db.prepare(`
      INSERT INTO messages (reservation_id, sender, content)
      VALUES (?, 'system', ?)
    `).run(result.lastInsertRowid, `Reservation request received from ${guest_name} for ${party_size} on ${date} at ${time}.`);

    return NextResponse.json({ id: result.lastInsertRowid, status: 'pending' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
