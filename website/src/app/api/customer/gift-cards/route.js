import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getCustomerId() {
  const cookieStore = await cookies();
  const session = cookieStore.get('customer_session');
  if (!session?.value) return null;
  try {
    const parsed = JSON.parse(session.value);
    return parsed.id;
  } catch {
    return null;
  }
}

// GET — list gift cards linked to the logged-in customer
export async function GET() {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();
    const cards = db.prepare(
      'SELECT * FROM gift_cards WHERE customer_account_id = ? ORDER BY created_at DESC'
    ).all(customerId);

    return NextResponse.json(cards);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — link a gift card to the customer's account by entering its code
export async function POST(request) {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Gift card code is required' }, { status: 400 });
    }

    const card = db.prepare('SELECT * FROM gift_cards WHERE code = ?').get(code);
    if (!card) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    if (card.customer_account_id && card.customer_account_id !== customerId) {
      return NextResponse.json({ error: 'This gift card is already linked to another account' }, { status: 409 });
    }

    db.prepare('UPDATE gift_cards SET customer_account_id = ? WHERE id = ?')
      .run(customerId, card.id);

    const updated = db.prepare('SELECT * FROM gift_cards WHERE id = ?').get(card.id);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
