CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'both',
  colors TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  status TEXT NOT NULL,
  amazonUrl TEXT NOT NULL DEFAULT '',
  amazonLabel TEXT NOT NULL DEFAULT 'View on Amazon',
  tone TEXT NOT NULL DEFAULT 'ivory',
  image TEXT NOT NULL DEFAULT 'assets/products/cashmere-ivory.svg',
  gallery TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  seoTitle TEXT NOT NULL DEFAULT '',
  seoDescription TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
