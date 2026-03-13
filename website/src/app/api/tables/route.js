import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all tables
export async function GET() {
  try {
    const db = getDb();
    const tables = db.prepare('SELECT * FROM tables ORDER BY zone, number').all();
    return NextResponse.json(tables);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update table status, position, etc.
export async function PATCH(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'Table ID required' }, { status: 400 });

    const allowedFields = ['status', 'x', 'y', 'current_order_id', 'seated_at', 'zone', 'name'];
    const setClause = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length > 0) {
      values.push(id);
      db.prepare(`UPDATE tables SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
    }

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    return NextResponse.json(table);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
