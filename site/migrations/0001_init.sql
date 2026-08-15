CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'both',
  colors TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  bullets TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT '',
  sizeRange TEXT NOT NULL DEFAULT '',
  fit TEXT NOT NULL DEFAULT '',
  care TEXT NOT NULL DEFAULT '',
  occasion TEXT NOT NULL DEFAULT '',
  searchKeywords TEXT NOT NULL DEFAULT '',
  seoDescription TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL,
  status TEXT NOT NULL,
  amazonUrl TEXT NOT NULL DEFAULT '',
  amazonLabel TEXT NOT NULL DEFAULT 'View on Amazon',
  tone TEXT NOT NULL DEFAULT 'ivory',
  image TEXT NOT NULL DEFAULT 'assets/real-cashmere-hero-jinhexi.webp',
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
  seoDescription TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT 'assets/jni-cashmere-hero.png',
  imageAlt TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
