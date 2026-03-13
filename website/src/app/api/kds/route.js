import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET KDS items - pending and fired order items
export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare(`
      SELECT oi.*, o.id as order_id, t.number as table_number, t.name as table_name,
             o.guest_name, o.notes as order_notes
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE oi.status IN ('pending', 'fired')
      AND o.status = 'open'
      ORDER BY 
        CASE oi.status WHEN 'fired' THEN 0 ELSE 1 END,
        oi.fired_at ASC,
        oi.created_at ASC
    `).all();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - bump/complete items
export async function PATCH(request) {
  try {
    const db = getDb();
    const { item_id, action } = await request.json();

    if (action === 'bump') {
      db.prepare("UPDATE order_items SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(item_id);
      db.prepare('INSERT INTO kds_bumps (order_item_id) VALUES (?)').run(item_id);
    } else if (action === 'fire') {
      db.prepare("UPDATE order_items SET status = 'fired', fired_at = CURRENT_TIMESTAMP WHERE id = ?").run(item_id);
    } else if (action === 'rush') {
      db.prepare("UPDATE order_items SET notes = COALESCE(notes || ' ', '') || '⚡ RUSH' WHERE id = ?").run(item_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
