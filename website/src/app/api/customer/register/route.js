import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashSync } from 'bcryptjs';

export async function POST(request) {
  try {
    const db = getDb();
    const { first_name, last_name, email, phone, password } = await request.json();

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const emailLower = email.toLowerCase();

    // Check if account already exists
    const existing = db.prepare('SELECT id FROM customer_accounts WHERE email = ?').get(emailLower);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Find or create guest record
    let guest = db.prepare('SELECT * FROM guests WHERE email = ?').get(emailLower);
    if (!guest) {
      const guestResult = db.prepare('INSERT INTO guests (name, email, phone) VALUES (?, ?, ?)').run(
        `${first_name} ${last_name}`, emailLower, phone || null
      );
      guest = { id: guestResult.lastInsertRowid };
    }

    const password_hash = hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO customer_accounts (email, password_hash, first_name, last_name, phone, guest_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(emailLower, password_hash, first_name, last_name, phone || null, guest.id);

    const token = Buffer.from(`customer:${result.lastInsertRowid}:${emailLower}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      id: result.lastInsertRowid,
      first_name,
      last_name,
      email: emailLower,
      phone,
      guest_id: guest.id,
      token,
    }, { status: 201 });

    response.cookies.set('antico_customer', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
