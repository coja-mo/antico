import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET menu items — ?all=1 returns everything, default returns available only
export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === '1';
    const query = showAll
      ? 'SELECT * FROM menu_items ORDER BY category, sort_order'
      : 'SELECT * FROM menu_items WHERE available = 1 ORDER BY category, sort_order';
    const items = db.prepare(query).all();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create new menu item
export async function POST(request) {
  try {
    const db = getDb();
    const { name, description, category, subcategory, price, sort_order } = await request.json();
    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: 'Name, category, and price are required' }, { status: 400 });
    }
    const result = db.prepare(
      'INSERT INTO menu_items (name, description, category, subcategory, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description || null, category, subcategory || null, price, sort_order || 0);
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update item fields or toggle availability
export async function PATCH(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const allowed = ['name', 'description', 'category', 'subcategory', 'price', 'available', 'sort_order'];
    const sets = [];
    const vals = [];
    for (const f of allowed) {
      if (body[f] !== undefined) {
        sets.push(`${f} = ?`);
        vals.push(f === 'available' ? (body[f] ? 1 : 0) : body[f]);
      }
    }
    if (sets.length > 0) {
      vals.push(id);
      db.prepare(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    }
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - remove menu item
export async function DELETE(request) {
  try {
    const db = getDb();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
