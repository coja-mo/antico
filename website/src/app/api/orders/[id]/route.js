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
      const items = db.prepare("SELECT price, quantity, status FROM order_items WHERE order_id = ?").all(id);
      const subtotal = items
        .filter(i => i.status !== 'voided' && i.status !== 'comped')
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      const discountAmt = parseFloat(order?.discount_amount) || 0;
      const afterDiscount = Math.max(0, subtotal - discountAmt);
      const tax = afterDiscount * 0.13; // Ontario HST
      const tip = body.tip || 0;
      const total = afterDiscount + tax + tip;

      db.prepare(`UPDATE orders SET status = 'closed', subtotal = ?, tax = ?, tip = ?, total = ?, payment_method = ?, gift_card_code = ?, gift_card_amount = ?, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(afterDiscount, tax, tip, total, body.payment_method || 'card', body.gift_card_code || null, body.gift_card_amount || 0, id);

      // Free up table
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

    // Remove item
    if (body.action === 'remove_item') {
      db.prepare('DELETE FROM order_items WHERE id = ? AND order_id = ?').run(body.item_id, id);
      db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
      return NextResponse.json({ items });
    }

    // Update item quantity
    if (body.action === 'update_quantity') {
      db.prepare('UPDATE order_items SET quantity = ? WHERE id = ? AND order_id = ?').run(Math.max(1, body.quantity), body.item_id, id);
      db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
      return NextResponse.json({ items });
    }

    // Void item (keeps record, shows as voided)
    if (body.action === 'void_item') {
      db.prepare("UPDATE order_items SET status = 'voided' WHERE id = ? AND order_id = ?").run(body.item_id, id);
      db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
      return NextResponse.json({ items });
    }

    // Comp item (marked as comped, zero cost)
    if (body.action === 'comp_item') {
      db.prepare("UPDATE order_items SET status = 'comped' WHERE id = ? AND order_id = ?").run(body.item_id, id);
      db.prepare('UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
      return NextResponse.json({ items });
    }

    // Add notes to item
    if (body.action === 'add_item_notes') {
      db.prepare('UPDATE order_items SET notes = ? WHERE id = ? AND order_id = ?').run(body.notes || null, body.item_id, id);
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC').all(id);
      return NextResponse.json({ items });
    }

    // Fire course
    if (body.action === 'fire_course') {
      db.prepare("UPDATE order_items SET status = 'fired', fired_at = CURRENT_TIMESTAMP WHERE order_id = ? AND course = ? AND status = 'pending'")
        .run(id, body.course);
      return NextResponse.json({ success: true });
    }

    // Add discount to order
    if (body.action === 'add_discount') {
      const { discount_type, discount_value, discount_reason } = body;
      let discountAmount = 0;
      if (discount_type === 'percent') {
        const items = db.prepare("SELECT price, quantity, status FROM order_items WHERE order_id = ?").all(id);
        const subtotal = items.filter(i => i.status !== 'voided' && i.status !== 'comped').reduce((s, i) => s + i.price * i.quantity, 0);
        discountAmount = subtotal * (discount_value / 100);
      } else {
        discountAmount = discount_value;
      }
      db.prepare('UPDATE orders SET discount_amount = ?, discount_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(discountAmount, discount_reason || null, id);
      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      return NextResponse.json(updated);
    }

    // General updates
    const allowedFields = ['status', 'notes', 'guest_name', 'order_notes'];
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

