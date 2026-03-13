import Database from 'better-sqlite3';
import path from 'path';
import { hashSync } from 'bcryptjs';

// On Vercel serverless, process.cwd() is read-only — use /tmp instead
const DB_PATH = process.env.VERCEL
  ? '/tmp/antico.db'
  : path.join(process.cwd(), 'antico.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      visit_count INTEGER DEFAULT 0,
      last_visit DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER REFERENCES guests(id),
      guest_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      party_size INTEGER NOT NULL,
      occasion TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      table_id INTEGER REFERENCES tables(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER REFERENCES reservations(id),
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER UNIQUE NOT NULL,
      name TEXT,
      capacity INTEGER NOT NULL,
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      width REAL DEFAULT 80,
      height REAL DEFAULT 80,
      shape TEXT DEFAULT 'square',
      zone TEXT DEFAULT 'main',
      status TEXT DEFAULT 'available',
      current_order_id INTEGER,
      seated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      subcategory TEXT,
      price REAL,
      available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      modifiers TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER REFERENCES tables(id),
      server_id INTEGER REFERENCES staff(id),
      guest_name TEXT,
      status TEXT DEFAULT 'open',
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      tip REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      menu_item_id INTEGER REFERENCES menu_items(id),
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL,
      modifiers TEXT,
      notes TEXT,
      course TEXT DEFAULT 'main',
      status TEXT DEFAULT 'pending',
      fired_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kds_bumps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER REFERENCES order_items(id),
      bumped_by INTEGER REFERENCES staff(id),
      bumped_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customer_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      guest_id INTEGER REFERENCES guests(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gift_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      initial_amount REAL NOT NULL,
      balance REAL NOT NULL,
      sender_name TEXT,
      sender_email TEXT,
      recipient_name TEXT,
      recipient_email TEXT,
      recipient_phone TEXT,
      delivery_method TEXT DEFAULT 'email',
      personal_message TEXT,
      customer_account_id INTEGER REFERENCES customer_accounts(id),
      status TEXT DEFAULT 'active',
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gift_card_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gift_card_id INTEGER NOT NULL REFERENCES gift_cards(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      order_id INTEGER REFERENCES orders(id),
      description TEXT,
      performed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      unit TEXT NOT NULL DEFAULT 'ea',
      quantity REAL DEFAULT 0,
      par_level REAL DEFAULT 0,
      cost_per_unit REAL DEFAULT 0,
      supplier TEXT,
      last_restocked DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      action TEXT NOT NULL,
      quantity_change REAL NOT NULL,
      cost REAL DEFAULT 0,
      performed_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL REFERENCES staff(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      role TEXT DEFAULT 'server',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_name TEXT NOT NULL,
      phone TEXT,
      party_size INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      status TEXT DEFAULT 'waiting',
      quoted_wait INTEGER DEFAULT 15,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notified_at DATETIME,
      seated_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS closeouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      total_revenue REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_tips REAL DEFAULT 0,
      card_total REAL DEFAULT 0,
      cash_total REAL DEFAULT 0,
      gift_card_total REAL DEFAULT 0,
      expected_cash REAL DEFAULT 0,
      counted_cash REAL DEFAULT 0,
      variance REAL DEFAULT 0,
      notes TEXT,
      closed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add new columns to existing tables (safe for existing DBs)
  const safeAddColumn = (table, column, type) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`); } catch {}
  };
  safeAddColumn('orders', 'guest_id', 'INTEGER REFERENCES guests(id)');
  safeAddColumn('orders', 'reservation_id', 'INTEGER REFERENCES reservations(id)');
  safeAddColumn('orders', 'discount_amount', 'REAL DEFAULT 0');
  safeAddColumn('orders', 'discount_reason', 'TEXT');
  safeAddColumn('orders', 'order_notes', 'TEXT');
  safeAddColumn('tables', 'server_name', 'TEXT');
  safeAddColumn('tables', 'reservation_id', 'INTEGER');
  safeAddColumn('reservations', 'server_name', 'TEXT');
  safeAddColumn('orders', 'gift_card_code', 'TEXT');
  safeAddColumn('orders', 'gift_card_amount', 'REAL DEFAULT 0');
  safeAddColumn('gift_cards', 'expires_at', 'DATETIME');

  // ── Gift Card Indexes (safe for re-runs) ──
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_gift_cards_customer ON gift_cards(customer_account_id)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_gift_card_tx_card_id ON gift_card_transactions(gift_card_id)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_gift_card_tx_order_id ON gift_card_transactions(order_id)'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_orders_gift_card ON orders(gift_card_code)'); } catch {}

  // Seed default admin if none exists
  const adminExists = db.prepare('SELECT id FROM staff WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = hashSync('antico2024', 10);
    db.prepare('INSERT INTO staff (username, password_hash, name, role) VALUES (?, ?, ?, ?)').run('admin', hash, 'Arturo', 'admin');
  }

  // Seed cody.mount admin
  const codyExists = db.prepare('SELECT id FROM staff WHERE username = ?').get('cody.mount');
  if (!codyExists) {
    const hash = hashSync('Antico!', 10);
    db.prepare('INSERT INTO staff (username, password_hash, name, role) VALUES (?, ?, ?, ?)').run('cody.mount', hash, 'Cody', 'admin');
  }

  // Seed tables if none exist
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get();
  if (tableCount.count === 0) {
    const tables = [
      { number: 1, name: 'Table 1', capacity: 2, x: 80, y: 80, shape: 'round', zone: 'window' },
      { number: 2, name: 'Table 2', capacity: 2, x: 200, y: 80, shape: 'round', zone: 'window' },
      { number: 3, name: 'Table 3', capacity: 4, x: 320, y: 80, shape: 'square', zone: 'window' },
      { number: 4, name: 'Table 4', capacity: 4, x: 80, y: 220, shape: 'square', zone: 'main' },
      { number: 5, name: 'Table 5', capacity: 6, x: 220, y: 220, width: 120, shape: 'rect', zone: 'main' },
      { number: 6, name: 'Table 6', capacity: 4, x: 380, y: 220, shape: 'square', zone: 'main' },
      { number: 7, name: 'Table 7', capacity: 2, x: 80, y: 360, shape: 'round', zone: 'bar' },
      { number: 8, name: 'Table 8', capacity: 2, x: 200, y: 360, shape: 'round', zone: 'bar' },
      { number: 9, name: 'Table 9', capacity: 8, x: 320, y: 360, width: 160, shape: 'rect', zone: 'private' },
      { number: 10, name: 'Patio 1', capacity: 4, x: 500, y: 80, shape: 'square', zone: 'patio' },
      { number: 11, name: 'Patio 2', capacity: 4, x: 500, y: 220, shape: 'square', zone: 'patio' },
      { number: 12, name: 'Patio 3', capacity: 6, x: 500, y: 360, width: 120, shape: 'rect', zone: 'patio' },
    ];
    const stmt = db.prepare('INSERT INTO tables (number, name, capacity, x, y, width, height, shape, zone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const t of tables) {
      stmt.run(t.number, t.name, t.capacity, t.x, t.y, t.width || 80, 80, t.shape, t.zone);
    }
  }

  // Seed menu items if none exist
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  if (menuCount.count === 0) {
    const items = [
      // Appetizers
      { name: 'Lobster Ravioli', description: 'Served in a fresh lobster blush sauce', category: 'appetizer', price: 22, sort: 1 },
      { name: 'Crispy Deep-Fried Calamari', description: 'Served with our special seafood sauce', category: 'appetizer', price: 16, sort: 2 },
      { name: 'Shrimp Putanesca', description: 'Sautéed shrimp with olive oil, capers, black olives, tomatoes, fresh herbs and white wine', category: 'appetizer', price: 19, sort: 3 },
      { name: 'Blackened Sea Scallops', description: 'Spicy seasoned scallops, served with homemade apple mango salsa', category: 'appetizer', price: 24, sort: 4 },
      { name: 'Escargot', description: 'Sautéed escargot in butter, white wine, cream, lemon juice and fresh herbs', category: 'appetizer', price: 18, sort: 5 },
      { name: 'Antipasto Misto', description: 'Prosciutto, bocconcini cheese, roasted red peppers, salami, and black olives', category: 'appetizer', price: 20, sort: 6 },
      { name: 'Cajun Chicken Bites', description: 'Spicy bites toasted with Cajun sauce & sesame seeds, served on noodles', category: 'appetizer', price: 15, sort: 7 },
      // Salads
      { name: 'House Salad', description: 'Spring mix, with cucumbers, onions, tomatoes, and house dressing', category: 'salad', price: 10, sort: 1 },
      { name: 'Greek Salad', description: 'Tomatoes, red peppers, cucumber, onions, black olives, romaine, and feta cheese', category: 'salad', price: 14, sort: 2 },
      { name: 'Caesar Salad', description: 'Romaine lettuce with croutons, lemon, parmesan cheese and Caesar dressing', category: 'salad', price: 13, sort: 3 },
      { name: 'Caprese', description: 'Fresh tomatoes, bocconcini cheese, sliced and finished with fresh basil and olive oil', category: 'salad', price: 15, sort: 4 },
      { name: 'Red Beet Salad', description: 'Red beets, oranges, goat cheese with honey/olive oil dressing', category: 'salad', price: 14, sort: 5 },
      // Entrees
      { name: 'Gnocchi Gorgonzola', description: 'Served in a fresh gorgonzola sauce', category: 'entree', price: 26, sort: 1 },
      { name: 'Butternut Squash Ravioli', description: 'Served in a sage, parmigiana butter sauce', category: 'entree', price: 27, sort: 2 },
      { name: 'Lobster Ravioli Entrée', description: 'Served in a fresh lobster blush sauce', category: 'entree', price: 34, sort: 3 },
      { name: 'Linguini Di Mare', description: 'Served in a tomato sauce, with calamari, mussels & shrimp', category: 'entree', price: 32, sort: 4 },
      { name: 'Chicken Parmigiana', description: 'Breaded chicken, baked with tomato sauce, provolone and mozzarella cheese, served with penne in fresh tomato basil sauce', category: 'entree', price: 28, sort: 5 },
      { name: 'Veal Parmigiana', description: 'Breaded veal, baked with tomato sauce, provolone and mozzarella cheese, served with penne in fresh tomato basil sauce', category: 'entree', price: 32, sort: 6 },
      { name: 'Chicken Portofino', description: 'Chicken breast, pan seared, topped with sundried tomatoes, artichoke hearts, provolone cheese, wine sauce, served with gnocchi gorgonzola', category: 'entree', price: 30, sort: 7 },
      { name: 'Veal Saltimbocca', description: 'Pan seared veal, with olive oil, sage, capers, lemon juice, white wine, topped with prosciutto, provolone cheese, served with penne in a tomato basil sauce', category: 'entree', price: 34, sort: 8 },
      { name: 'Veal Pizzaiola', description: 'Pan seared veal in a tomato basil sauce with white wine, capers, served with penne in a tomato basil sauce', category: 'entree', price: 32, sort: 9 },
      { name: 'Filet Mignon', description: 'Centre cut 8oz filet, cooked to your liking, topped with gorgonzola butter and a demi glaze, served with your choice of vegetables or fettuccini alfredo', category: 'entree', price: 48, sort: 10 },
      { name: 'Fresh Pickerel', description: 'Pan seared pickerel, with sage, capers, olive oil, white wine, served with lobster ravioli', category: 'entree', price: 36, sort: 11 },
      // Desserts
      { name: "Art's Tiramisu", description: "Chef Arturo's signature tiramisu — a must-have", category: 'dessert', price: 14, sort: 1 },
      // Beverages — Wine
      { name: 'Chianti Classico', description: 'Tuscan red, full-bodied with cherry and oak', category: 'beverage', subcategory: 'wine', price: 14, sort: 1 },
      { name: 'Pinot Grigio', description: 'Light and crisp Italian white', category: 'beverage', subcategory: 'wine', price: 12, sort: 2 },
      { name: 'Barolo', description: 'Premium Piedmont red, aged 24 months', category: 'beverage', subcategory: 'wine', price: 22, sort: 3 },
      { name: 'Prosecco', description: 'Sparkling Italian white, dry and refreshing', category: 'beverage', subcategory: 'wine', price: 13, sort: 4 },
      { name: 'Montepulciano d\'Abruzzo', description: 'Smooth medium-bodied red from Abruzzo', category: 'beverage', subcategory: 'wine', price: 13, sort: 5 },
      { name: 'Amarone della Valpolicella', description: 'Rich, complex red from dried grapes', category: 'beverage', subcategory: 'wine', price: 26, sort: 6 },
      // Beverages — Cocktails
      { name: 'Negroni', description: 'Gin, Campari, sweet vermouth', category: 'beverage', subcategory: 'cocktail', price: 16, sort: 7 },
      { name: 'Aperol Spritz', description: 'Aperol, prosecco, soda water', category: 'beverage', subcategory: 'cocktail', price: 14, sort: 8 },
      { name: 'Espresso Martini', description: 'Vodka, espresso, Kahlúa', category: 'beverage', subcategory: 'cocktail', price: 16, sort: 9 },
      { name: 'Limoncello Spritz', description: 'Limoncello, prosecco, fresh mint', category: 'beverage', subcategory: 'cocktail', price: 14, sort: 10 },
      { name: 'Old Fashioned', description: 'Bourbon, bitters, orange peel', category: 'beverage', subcategory: 'cocktail', price: 15, sort: 11 },
      // Beverages — Beer
      { name: 'Peroni Nastro Azzurro', description: 'Premium Italian lager', category: 'beverage', subcategory: 'beer', price: 8, sort: 12 },
      { name: 'Moretti La Rossa', description: 'Double malt Italian red ale', category: 'beverage', subcategory: 'beer', price: 9, sort: 13 },
      { name: 'Guinness Draught', description: 'Classic Irish stout', category: 'beverage', subcategory: 'beer', price: 8, sort: 14 },
      { name: 'Local Craft IPA', description: 'Rotating selection from local breweries', category: 'beverage', subcategory: 'beer', price: 10, sort: 15 },
      // Beverages — Non-Alcoholic
      { name: 'San Pellegrino', description: 'Sparkling mineral water', category: 'beverage', subcategory: 'non-alcoholic', price: 5, sort: 16 },
      { name: 'Italian Limonata', description: 'Sparkling lemon soda', category: 'beverage', subcategory: 'non-alcoholic', price: 5, sort: 17 },
      { name: 'Espresso', description: 'Double shot Italian espresso', category: 'beverage', subcategory: 'non-alcoholic', price: 4, sort: 18 },
      { name: 'Cappuccino', description: 'Espresso with steamed milk foam', category: 'beverage', subcategory: 'non-alcoholic', price: 6, sort: 19 },
    ];
    const stmt = db.prepare('INSERT INTO menu_items (name, description, category, subcategory, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const item of items) {
      stmt.run(item.name, item.description, item.category, item.subcategory || null, item.price, item.sort);
    }
  }

  // Seed inventory if none exist
  const invCount = db.prepare('SELECT COUNT(*) as count FROM inventory_items').get();
  if (invCount.count === 0) {
    const inv = [
      // Produce
      { name: 'Roma Tomatoes', category: 'produce', unit: 'lb', quantity: 25, par: 15, cost: 2.50, supplier: 'Italian Farms Co.' },
      { name: 'Fresh Basil', category: 'produce', unit: 'bunch', quantity: 8, par: 6, cost: 3.00, supplier: 'Italian Farms Co.' },
      { name: 'Lemons', category: 'produce', unit: 'ea', quantity: 30, par: 20, cost: 0.50, supplier: 'Local Produce' },
      { name: 'Garlic', category: 'produce', unit: 'lb', quantity: 5, par: 3, cost: 4.00, supplier: 'Italian Farms Co.' },
      { name: 'Arugula', category: 'produce', unit: 'lb', quantity: 4, par: 3, cost: 6.00, supplier: 'Local Produce' },
      { name: 'Red Onions', category: 'produce', unit: 'lb', quantity: 12, par: 8, cost: 1.50, supplier: 'Local Produce' },
      { name: 'Butternut Squash', category: 'produce', unit: 'ea', quantity: 6, par: 4, cost: 3.50, supplier: 'Local Produce' },
      // Protein
      { name: 'Veal Cutlets', category: 'protein', unit: 'lb', quantity: 18, par: 12, cost: 18.00, supplier: 'Premium Meats' },
      { name: 'Chicken Breast', category: 'protein', unit: 'lb', quantity: 22, par: 15, cost: 8.50, supplier: 'Premium Meats' },
      { name: 'Filet Mignon (8oz)', category: 'protein', unit: 'ea', quantity: 12, par: 8, cost: 22.00, supplier: 'Premium Meats' },
      { name: 'Lobster Tails', category: 'protein', unit: 'ea', quantity: 8, par: 6, cost: 16.00, supplier: 'Atlantic Seafood' },
      { name: 'Sea Scallops', category: 'protein', unit: 'lb', quantity: 5, par: 4, cost: 24.00, supplier: 'Atlantic Seafood' },
      { name: 'Shrimp (21/25)', category: 'protein', unit: 'lb', quantity: 10, par: 8, cost: 14.00, supplier: 'Atlantic Seafood' },
      { name: 'Calamari', category: 'protein', unit: 'lb', quantity: 8, par: 6, cost: 10.00, supplier: 'Atlantic Seafood' },
      { name: 'Prosciutto di Parma', category: 'protein', unit: 'lb', quantity: 4, par: 3, cost: 22.00, supplier: 'Italian Imports' },
      // Dairy
      { name: 'Mozzarella di Bufala', category: 'dairy', unit: 'lb', quantity: 8, par: 5, cost: 12.00, supplier: 'Italian Imports' },
      { name: 'Parmigiano Reggiano', category: 'dairy', unit: 'lb', quantity: 6, par: 4, cost: 18.00, supplier: 'Italian Imports' },
      { name: 'Gorgonzola', category: 'dairy', unit: 'lb', quantity: 3, par: 2, cost: 14.00, supplier: 'Italian Imports' },
      { name: 'Heavy Cream', category: 'dairy', unit: 'L', quantity: 12, par: 8, cost: 4.50, supplier: 'Local Dairy' },
      { name: 'Unsalted Butter', category: 'dairy', unit: 'lb', quantity: 10, par: 6, cost: 5.00, supplier: 'Local Dairy' },
      { name: 'Goat Cheese', category: 'dairy', unit: 'lb', quantity: 3, par: 2, cost: 16.00, supplier: 'Local Dairy' },
      // Dry Goods
      { name: 'Penne Rigate', category: 'dry_goods', unit: 'lb', quantity: 20, par: 10, cost: 3.00, supplier: 'Italian Imports' },
      { name: 'Linguini', category: 'dry_goods', unit: 'lb', quantity: 18, par: 10, cost: 3.00, supplier: 'Italian Imports' },
      { name: 'Fettuccini', category: 'dry_goods', unit: 'lb', quantity: 15, par: 10, cost: 3.00, supplier: 'Italian Imports' },
      { name: 'Extra Virgin Olive Oil', category: 'dry_goods', unit: 'L', quantity: 6, par: 3, cost: 14.00, supplier: 'Italian Imports' },
      { name: 'San Marzano Tomatoes', category: 'dry_goods', unit: 'can', quantity: 24, par: 12, cost: 4.00, supplier: 'Italian Imports' },
      { name: 'Capers', category: 'dry_goods', unit: 'jar', quantity: 6, par: 3, cost: 5.50, supplier: 'Italian Imports' },
      { name: 'Black Olives (Kalamata)', category: 'dry_goods', unit: 'jar', quantity: 4, par: 3, cost: 6.00, supplier: 'Italian Imports' },
      // Beverages
      { name: 'Chianti (house)', category: 'beverage', unit: 'bottle', quantity: 24, par: 12, cost: 12.00, supplier: 'Wine Distributors' },
      { name: 'Pinot Grigio (house)', category: 'beverage', unit: 'bottle', quantity: 18, par: 12, cost: 10.00, supplier: 'Wine Distributors' },
      { name: 'Prosecco', category: 'beverage', unit: 'bottle', quantity: 12, par: 8, cost: 11.00, supplier: 'Wine Distributors' },
      { name: 'Peroni (case)', category: 'beverage', unit: 'case', quantity: 4, par: 2, cost: 36.00, supplier: 'Beer Distributors' },
      { name: 'Espresso Beans', category: 'beverage', unit: 'kg', quantity: 5, par: 3, cost: 28.00, supplier: 'Italian Imports' },
      { name: 'San Pellegrino', category: 'beverage', unit: 'case', quantity: 3, par: 2, cost: 18.00, supplier: 'Italian Imports' },
      // Other
      { name: 'Linen Napkins', category: 'other', unit: 'pack', quantity: 8, par: 4, cost: 12.00, supplier: 'Restaurant Supply' },
      { name: 'Candles (table)', category: 'other', unit: 'box', quantity: 5, par: 3, cost: 8.00, supplier: 'Restaurant Supply' },
      { name: 'To-Go Containers', category: 'other', unit: 'pack', quantity: 6, par: 4, cost: 15.00, supplier: 'Restaurant Supply' },
    ];
    const invStmt = db.prepare('INSERT INTO inventory_items (name, category, unit, quantity, par_level, cost_per_unit, supplier) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const i of inv) {
      invStmt.run(i.name, i.category, i.unit, i.quantity, i.par, i.cost, i.supplier);
    }
  }
}
