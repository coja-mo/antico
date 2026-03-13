import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/shifts — get shifts for a date range
export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = `
      SELECT s.*, st.name as staff_name
      FROM shifts s
      LEFT JOIN staff st ON s.staff_id = st.id
    `;
    const params = [];

    if (start && end) {
      query += ' WHERE s.date BETWEEN ? AND ?';
      params.push(start, end);
    } else if (start) {
      query += ' WHERE s.date >= ?';
      params.push(start);
    }
    query += ' ORDER BY s.date, s.start_time';

    const shifts = db.prepare(query).all(...params);
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/shifts — create a shift
export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { staff_id, date, start_time, end_time, role, notes } = body;

    if (!staff_id || !date || !start_time || !end_time) {
      return NextResponse.json({ error: 'staff_id, date, start_time, and end_time required' }, { status: 400 });
    }

    const result = db.prepare(
      `INSERT INTO shifts (staff_id, date, start_time, end_time, role, notes) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(staff_id, date, start_time, end_time, role || 'server', notes || null);

    const shift = db.prepare(`
      SELECT s.*, st.name as staff_name FROM shifts s LEFT JOIN staff st ON s.staff_id = st.id WHERE s.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/shifts — update a shift
export async function PATCH(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const fields = [];
    const vals = [];
    for (const [key, val] of Object.entries(updates)) {
      if (['staff_id', 'date', 'start_time', 'end_time', 'role', 'notes'].includes(key)) {
        fields.push(`${key} = ?`);
        vals.push(val);
      }
    }
    if (fields.length) {
      vals.push(id);
      db.prepare(`UPDATE shifts SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
    }

    const shift = db.prepare(`
      SELECT s.*, st.name as staff_name FROM shifts s LEFT JOIN staff st ON s.staff_id = st.id WHERE s.id = ?
    `).get(id);

    return NextResponse.json(shift);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/shifts
export async function DELETE(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM shifts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
