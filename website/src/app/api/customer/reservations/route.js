import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getCustomerFromToken(db) {
  const cookieStore = cookies();
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
    const account = getCustomerFromToken(db);

    if (!account) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const reservations = db.prepare(`
      SELECT * FROM reservations
      WHERE guest_id = ? OR email = ?
      ORDER BY date DESC, time ASC
    `).all(account.guest_id, account.email);

    return NextResponse.json(reservations);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
