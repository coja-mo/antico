import Database from 'better-sqlite3';
import path from 'path';
import { hashSync } from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'antico.db');

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
  `);

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
    ];
    const stmt = db.prepare('INSERT INTO menu_items (name, description, category, price, sort_order) VALUES (?, ?, ?, ?, ?)');
    for (const item of items) {
      stmt.run(item.name, item.description, item.category, item.price, item.sort);
    }
  }
}
