import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getCustomerFromToken(db) {
  const cookieStore = await cookies();
  const token = cookieStore.get('antico_customer')?.value;
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split(':');
    if (parts[0] !== 'customer') return null;
    const accountId = parseInt(parts[1]);
    return db.prepare('SELECT * FROM customer_accounts WHERE id = ?').get(accountId);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const db = getDb();
    const account = await getCustomerFromToken(db);

    if (!account) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const guest = account.guest_id
      ? db.prepare('SELECT * FROM guests WHERE id = ?').get(account.guest_id)
      : null;

    return NextResponse.json({
      id: account.id,
      first_name: account.first_name,
      last_name: account.last_name,
      email: account.email,
      phone: account.phone,
      guest_id: account.guest_id,
      visit_count: guest?.visit_count || 0,
      last_visit: guest?.last_visit || null,
      member_since: account.created_at,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update profile
export async function PATCH(request) {
  try {
    const db = getDb();
    const account = await getCustomerFromToken(db);
    if (!account) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();

    // Password change
    if (body.new_password) {
      const bcrypt = require('bcryptjs');
      const valid = await bcrypt.compare(body.current_password || '', account.password_hash);
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      if (body.new_password.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      const hash = await bcrypt.hash(body.new_password, 10);
      db.prepare('UPDATE customer_accounts SET password_hash = ? WHERE id = ?').run(hash, account.id);
      return NextResponse.json({ success: true, message: 'Password updated' });
    }

    // Profile fields
    const allowed = ['first_name', 'last_name', 'phone'];
    const sets = [];
    const vals = [];
    for (const field of allowed) {
      if (body[field] !== undefined) { sets.push(`${field} = ?`); vals.push(body[field]); }
    }
    if (sets.length > 0) {
      vals.push(account.id);
      db.prepare(`UPDATE customer_accounts SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('antico_customer', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
