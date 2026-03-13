import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all orders (with optional filters)
export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tableId = searchParams.get('table_id');

    let query = 'SELECT o.*, t.number as table_number, t.name as table_name FROM orders o LEFT JOIN tables t ON o.table_id = t.id';
    const conditions = [];
    const params = [];

    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (tableId) { conditions.push('o.table_id = ?'); params.push(tableId); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create new order
export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { table_id, server_id, guest_name, notes } = body;

    const result = db.prepare(`
      INSERT INTO orders (table_id, server_id, guest_name, notes)
      VALUES (?, ?, ?, ?)
    `).run(table_id || null, server_id || null, guest_name || null, notes || null);

    // Update table status if assigned
    if (table_id) {
      db.prepare('UPDATE tables SET status = ?, current_order_id = ?, seated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('occupied', result.lastInsertRowid, table_id);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
