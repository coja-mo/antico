import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all menu items for POS
export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, sort_order').all();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - toggle item availability (86 items)
export async function PATCH(request) {
  try {
    const db = getDb();
    const { id, available } = await request.json();
    db.prepare('UPDATE menu_items SET available = ? WHERE id = ?').run(available ? 1 : 0, id);
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
