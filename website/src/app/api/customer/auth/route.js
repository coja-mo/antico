import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { compareSync } from 'bcryptjs';

export async function POST(request) {
  try {
    const db = getDb();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const account = db.prepare('SELECT * FROM customer_accounts WHERE email = ?').get(email.toLowerCase());
    if (!account || !compareSync(password, account.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const guest = account.guest_id
      ? db.prepare('SELECT * FROM guests WHERE id = ?').get(account.guest_id)
      : null;

    const token = Buffer.from(`customer:${account.id}:${account.email}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      id: account.id,
      first_name: account.first_name,
      last_name: account.last_name,
      email: account.email,
      phone: account.phone,
      guest_id: account.guest_id,
      visit_count: guest?.visit_count || 0,
      token,
    });

    response.cookies.set('antico_customer', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
