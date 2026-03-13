import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/closeout — get closeout for a date or list recent
export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (date) {
      const closeout = db.prepare('SELECT * FROM closeouts WHERE date = ?').get(date);
      if (closeout) return NextResponse.json(closeout);

      // Compute live data if no closeout submitted yet
      const orders = db.prepare(
        `SELECT * FROM orders WHERE date(closed_at) = ? AND status = 'closed'`
      ).all(date);

      const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
      const totalTips = orders.reduce((s, o) => s + (o.tip || 0), 0);
      const cardOrders = orders.filter(o => o.payment_method === 'card' || (o.payment_method || '').includes('card'));
      const cashOrders = orders.filter(o => o.payment_method === 'cash');
      const gcOrders = orders.filter(o => (o.payment_method || '').includes('gift_card'));

      return NextResponse.json({
        date,
        submitted: false,
        total_revenue: totalRevenue,
        total_orders: orders.length,
        total_tips: totalTips,
        card_total: cardOrders.reduce((s, o) => s + (o.total || 0), 0),
        cash_total: cashOrders.reduce((s, o) => s + (o.total || 0), 0),
        gift_card_total: gcOrders.reduce((s, o) => s + (o.gift_card_amount || 0), 0),
        expected_cash: cashOrders.reduce((s, o) => s + (o.total || 0), 0),
        open_orders: db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'open'`).get().count,
      });
    }

    // List recent closeouts
    const closeouts = db.prepare('SELECT * FROM closeouts ORDER BY date DESC LIMIT 30').all();
    return NextResponse.json(closeouts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/closeout — submit a closeout
export async function POST(request) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      date, total_revenue, total_orders, total_tips,
      card_total, cash_total, gift_card_total,
      expected_cash, counted_cash, notes, closed_by
    } = body;

    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

    const variance = (counted_cash || 0) - (expected_cash || 0);

    // Upsert
    const existing = db.prepare('SELECT id FROM closeouts WHERE date = ?').get(date);
    if (existing) {
      db.prepare(`
        UPDATE closeouts SET total_revenue=?, total_orders=?, total_tips=?,
        card_total=?, cash_total=?, gift_card_total=?,
        expected_cash=?, counted_cash=?, variance=?, notes=?, closed_by=?
        WHERE date=?
      `).run(total_revenue, total_orders, total_tips, card_total, cash_total, gift_card_total,
        expected_cash, counted_cash || 0, variance, notes || null, closed_by || 'admin', date);
    } else {
      db.prepare(`
        INSERT INTO closeouts (date, total_revenue, total_orders, total_tips,
          card_total, cash_total, gift_card_total, expected_cash, counted_cash, variance, notes, closed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(date, total_revenue, total_orders, total_tips, card_total, cash_total, gift_card_total,
        expected_cash, counted_cash || 0, variance, notes || null, closed_by || 'admin');
    }

    const closeout = db.prepare('SELECT * FROM closeouts WHERE date = ?').get(date);
    return NextResponse.json(closeout, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
