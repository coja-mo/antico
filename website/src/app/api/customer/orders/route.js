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

    const orders = db.prepare(`
      SELECT o.*, t.number as table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.guest_id = ? AND o.status = 'closed'
      ORDER BY o.closed_at DESC
    `).all(account.guest_id);

    // Get items for each order
    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT name, quantity, price FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
