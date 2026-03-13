import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// POST /api/tables/manage — create a new table
export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { number, capacity, zone, shape } = body;

    if (!number) return NextResponse.json({ error: 'Table number required' }, { status: 400 });

    // Check for existing
    const existing = db.prepare('SELECT id FROM tables WHERE number = ?').get(number);
    if (existing) return NextResponse.json({ error: 'Table number already exists' }, { status: 409 });

    // Compute position based on existing tables
    const count = db.prepare('SELECT COUNT(*) as count FROM tables').get().count;
    const x = 80 + (count % 6) * 120;
    const y = 80 + Math.floor(count / 6) * 140;

    const result = db.prepare(
      `INSERT INTO tables (number, name, capacity, x, y, width, height, shape, zone)
       VALUES (?, ?, ?, ?, ?, 80, 80, ?, ?)`
    ).run(number, `Table ${number}`, capacity || 4, x, y, shape || 'square', zone || 'main');

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tables/manage?id=xxx
export async function DELETE(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // Don't allow deleting tables with active orders
    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    if (table && table.status !== 'available') {
      return NextResponse.json({ error: 'Cannot delete a table that is currently occupied' }, { status: 400 });
    }

    db.prepare('DELETE FROM tables WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
