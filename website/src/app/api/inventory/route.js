import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/inventory — list all inventory items
export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('low_stock');
    const category = searchParams.get('category');

    let query = 'SELECT * FROM inventory_items';
    const conditions = [];
    const params = [];

    if (lowStock) {
      conditions.push('quantity <= par_level');
    }
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY category, name';

    const items = db.prepare(query).all(...params);
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory — add new item
export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, category, unit, quantity, par_level, cost_per_unit, supplier, notes } = body;

    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const result = db.prepare(
      `INSERT INTO inventory_items (name, category, unit, quantity, par_level, cost_per_unit, supplier, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, category || 'other', unit || 'ea', quantity || 0, par_level || 0, cost_per_unit || 0, supplier || null, notes || null);

    // Log the addition
    db.prepare(
      `INSERT INTO inventory_log (item_id, action, quantity_change, cost, performed_by, notes)
       VALUES (?, 'initial', ?, ?, 'admin', 'Item created')`
    ).run(result.lastInsertRowid, quantity || 0, (quantity || 0) * (cost_per_unit || 0));

    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/inventory — update item or restock
export async function PATCH(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'restock') {
      const qty = parseFloat(updates.quantity) || 0;
      const newQty = item.quantity + qty;
      db.prepare('UPDATE inventory_items SET quantity = ?, last_restocked = CURRENT_TIMESTAMP WHERE id = ?').run(newQty, id);
      db.prepare(
        `INSERT INTO inventory_log (item_id, action, quantity_change, cost, performed_by, notes)
         VALUES (?, 'restock', ?, ?, ?, ?)`
      ).run(id, qty, qty * item.cost_per_unit, updates.performed_by || 'admin', updates.notes || 'Restocked');
    } else if (action === 'waste') {
      const qty = parseFloat(updates.quantity) || 0;
      const newQty = Math.max(0, item.quantity - qty);
      db.prepare('UPDATE inventory_items SET quantity = ? WHERE id = ?').run(newQty, id);
      db.prepare(
        `INSERT INTO inventory_log (item_id, action, quantity_change, cost, performed_by, notes)
         VALUES (?, 'waste', ?, ?, ?, ?)`
      ).run(id, -qty, qty * item.cost_per_unit, updates.performed_by || 'admin', updates.notes || 'Wasted');
    } else {
      // General update
      const fields = [];
      const vals = [];
      for (const [key, val] of Object.entries(updates)) {
        if (['name', 'category', 'unit', 'quantity', 'par_level', 'cost_per_unit', 'supplier', 'notes'].includes(key)) {
          fields.push(`${key} = ?`);
          vals.push(val);
        }
      }
      if (fields.length) {
        vals.push(id);
        db.prepare(`UPDATE inventory_items SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
      }
    }

    const updated = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/inventory
export async function DELETE(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('DELETE FROM inventory_log WHERE item_id = ?').run(id);
    db.prepare('DELETE FROM inventory_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
