import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    if (!reservation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const messages = db.prepare('SELECT * FROM messages WHERE reservation_id = ? ORDER BY created_at ASC').all(id);
    return NextResponse.json({ ...reservation, messages });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();
    const updates = [];
    const values = [];

    const allowedFields = ['status', 'date', 'time', 'party_size', 'table_id', 'notes'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // If status changed, create a system message
    if (body.status) {
      const statusMessages = {
        confirmed: 'Reservation has been confirmed.',
        declined: 'Reservation has been declined.',
        cancelled: 'Reservation has been cancelled.',
        completed: 'Reservation marked as completed.',
        waitlisted: 'You have been added to the waitlist.',
      };
      if (statusMessages[body.status]) {
        db.prepare('INSERT INTO messages (reservation_id, sender, content) VALUES (?, ?, ?)').run(id, 'system', statusMessages[body.status]);
      }
    }

    // Update guest visit count if completed
    if (body.status === 'completed') {
      const reso = db.prepare('SELECT guest_id, party_size FROM reservations WHERE id = ?').get(id);
      if (reso?.guest_id) {
        db.prepare('UPDATE guests SET visit_count = visit_count + 1, last_visit = CURRENT_TIMESTAMP WHERE id = ?').run(reso.guest_id);
      }
    }

    const updated = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
