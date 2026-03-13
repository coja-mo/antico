import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashSync } from 'bcryptjs';

// GET all staff (without password hashes)
export async function GET() {
  try {
    const db = getDb();
    const staff = db.prepare('SELECT id, username, name, role, created_at FROM staff ORDER BY created_at ASC').all();
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create new staff member
export async function POST(request) {
  try {
    const db = getDb();
    const { username, password, name, role } = await request.json();
    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Username, password, and name are required' }, { status: 400 });
    }
    const existing = db.prepare('SELECT id FROM staff WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    const hash = hashSync(password, 10);
    const result = db.prepare('INSERT INTO staff (username, password_hash, name, role) VALUES (?, ?, ?, ?)').run(username, hash, name, role || 'staff');
    const staff = db.prepare('SELECT id, username, name, role, created_at FROM staff WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - remove staff member
export async function DELETE(request) {
  try {
    const db = getDb();
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    db.prepare('DELETE FROM staff WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
