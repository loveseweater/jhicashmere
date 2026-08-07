async function loadJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    return await response.json();
  } catch (error) {
    return fallback;
  }
}

async function trackPageview() {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location.pathname })
    });
  } catch {
    return null;
  }
}

const categoryLabels = {
  "tops": "上衣",
  "sweaters": "毛衣",
  "accessories": "配件",
  "scarves": "围巾",
  "gloves": "手套",
  "others": "其他"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeCategory(value) {
  const raw = String(value || "").trim();
  const map = {
    "上衣": "tops",
    "毛衣": "sweaters",
    "配件": "accessories",
    "围巾": "scarves",
    "手套": "gloves",
    "其他": "others",
    "pullover sweaters": "sweaters",
    "cardigans": "tops",
    "turtlenecks": "sweaters",
    "women's sweaters": "sweaters",
    "sweaters": "sweaters",
    "tops": "tops",
    "accessories": "accessories",
    "scarves": "scarves",
    "gloves": "gloves",
    "others": "others",
  };
  return map[raw.toLowerCase()] || map[raw] || "others";
}

function productTemplate(product) {
  const tone = ["ivory", "sage", "charcoal"].includes(product.tone) ? product.tone : "ivory";
  const gallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image || `assets/products/cashmere-${tone}.svg`];
  const image = gallery[0];
  const amazonButton = product.amazonUrl
    ? `<a class="amazon-link" href="${escapeHtml(product.amazonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(product.amazonLabel || "View on Amazon")}</a>`
    : `<span class="amazon-link disabled">Amazon Coming Soon</span>`;
  const thumbs = gallery.slice(0, 4).map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(product.name || "Cashmere sweater")}" />`).join("");
  const category = normalizeCategory(product.category);
  return `
    <article class="product-card">
      <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.name || "Cashmere sweater")}" />
      <div class="product-thumbs">${thumbs}</div>
      <div class="product-info">
        <div class="product-meta">
          <span>${escapeHtml(categoryLabels[category] || product.category || "其他")}</span>
          <span>${escapeHtml(product.status || "Coming Soon")}</span>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-channel">${escapeHtml(product.channel === "site" ? "Exclusive to JINHEXI" : product.channel === "amazon" ? "Amazon Collection" : "Amazon + Site")}</p>
        <p>${escapeHtml(product.description)}</p>
        <div class="product-line">
          <span>${escapeHtml(product.colors)}</span>
          <strong>${escapeHtml(product.price)}</strong>
        </div>
        ${amazonButton}
      </div>
    </article>
  `;
}

function postTemplate(post) {
  const slug = encodeURIComponent(post.slug || post.id || post.title || "");
  return `
    <article class="post-item">
      <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.excerpt)}</p>
      <a class="post-link" href="/journal.html?post=${slug}">Read more</a>
    </article>
  `;
}

const fallbackProducts = [
  {
    name: "Cashmere Crewneck",
    category: "sweaters",
    colors: "Ivory / Taupe / Charcoal",
    description: "Minimal daily sweater with a smooth hand feel and versatile fit.",
    price: "$129.00",
    status: "Coming Soon",
    tone: "ivory"
  }
];

const fallbackPosts = [
  {
    title: "How to Care for Premium Cashmere Knitwear",
    date: "2026-07-22",
    excerpt: "Simple care habits help premium knitwear keep its hand feel and refined surface."
  }
];

async function renderSiteData() {
  const products = await loadJson("/api/products", fallbackProducts);
  const posts = await loadJson("/api/posts", fallbackPosts);
  const productGrid = document.querySelector("[data-products]");
  const postGrid = document.querySelector("[data-posts]");
  const filterGrid = document.querySelector("[data-category-filters]");
  const categories = ["all", "tops", "sweaters", "accessories", "scarves", "gloves", "others"];
  let activeCategory = "all";

  function filteredProducts() {
    return activeCategory === "all"
      ? products
      : products.filter((product) => normalizeCategory(product.category) === activeCategory);
  }

  function renderProducts() {
    if (productGrid) {
      const visible = filteredProducts();
      productGrid.innerHTML = visible.length
        ? visible.map(productTemplate).join("")
        : `<article class="empty-state"><h3>当前分类暂无产品</h3><p>你可以在后台新增产品，或者切换到其他分类。</p></article>`;
    }
  }

  if (filterGrid) {
    filterGrid.innerHTML = categories
      .map((category) => `
        <button type="button" class="category-pill${category === activeCategory ? " active" : ""}" data-category="${category}">
          ${escapeHtml(category === "all" ? "全部" : categoryLabels[category])}
        </button>
      `)
      .join("");
    filterGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      activeCategory = button.dataset.category;
      filterGrid.querySelectorAll("[data-category]").forEach((item) => item.classList.toggle("active", item === button));
      renderProducts();
    });
  }

  renderProducts();

  if (postGrid) {
    postGrid.innerHTML = posts.map(postTemplate).join("");
  }

  await trackPageview();
}

renderSiteData();
