import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { compareSync } from 'bcryptjs';

export async function POST(request) {
  try {
    const db = getDb();
    const { username, password } = await request.json();

    const staff = db.prepare('SELECT * FROM staff WHERE username = ?').get(username);
    if (!staff || !compareSync(password, staff.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Simple token-based auth (in production, use proper JWT)
    const token = Buffer.from(`${staff.id}:${staff.username}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      token,
    });

    response.cookies.set('antico_session', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
