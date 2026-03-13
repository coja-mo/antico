import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = 'SELECT * FROM guests';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY last_visit DESC NULLS LAST, created_at DESC';

    const guests = db.prepare(query).all(...params);
    return NextResponse.json(guests);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
