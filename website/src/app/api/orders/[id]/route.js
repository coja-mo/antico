import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const order = db.prepare('SELECT o.*, t.number as table_number, t.name as table_name FROM orders o LEFT JOIN tables t ON o.table_id = t.id WHERE o.id = ?').get(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
    return NextResponse.json({ ...order, items });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = await request.json();

    // Close order
    if (body.action === 'close') {
      const items = db.prepare('SELECT price, quantity FROM order_items WHERE order_id = ?').all(id);
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.13; // Ontario HST
      const tip = body.tip || 0;
      const total = subtotal + tax + tip;

      db.prepare(`UPDATE orders SET status = 'closed', subtotal = ?, tax = ?, tip = ?, total = ?, payment_method = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(subtotal, tax, tip, total, body.payment_method || 'card', id);

      // Free up table
      const order = db.prepare('SELECT table_id FROM orders WHERE id = ?').get(id);
      if (order?.table_id) {
        db.prepare('UPDATE tables SET status = ?, current_order_id = NULL, seated_at = NULL WHERE id = ?')
          .run('cleaning', order.table_id);
      }

      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      return NextResponse.json(updated);
    }

    // Add item
    if (body.action === 'add_item') {
      const { menu_item_id, name, price, quantity, modifiers, notes, course } = body;
      db.prepare(`INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, modifiers, notes, course) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, menu_item_id || null, name, price, quantity || 1, modifiers || null, notes || null, course || 'main');

      db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
      return NextResponse.json({ items });
    }

    // Fire course
    if (body.action === 'fire_course') {
      db.prepare("UPDATE order_items SET status = 'fired', fired_at = CURRENT_TIMESTAMP WHERE order_id = ? AND course = ? AND status = 'pending'")
        .run(id, body.course);
      return NextResponse.json({ success: true });
    }

    // General updates
    const allowedFields = ['status', 'notes', 'guest_name'];
    const setClause = [];
    const values = [];
    for (const field of allowedFields) {
      if (body[field] !== undefined) { setClause.push(`${field} = ?`); values.push(body[field]); }
    }
    if (setClause.length > 0) {
      setClause.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      db.prepare(`UPDATE orders SET ${setClause.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
