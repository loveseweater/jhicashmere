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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productTemplate(product) {
  const tone = ["ivory", "sage", "charcoal"].includes(product.tone) ? product.tone : "ivory";
  const image = product.image || `assets/products/cashmere-${tone}.svg`;
  const amazonButton = product.amazonUrl
    ? `<a class="amazon-link" href="${escapeHtml(product.amazonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(product.amazonLabel || "View on Amazon")}</a>`
    : `<span class="amazon-link disabled">Amazon Coming Soon</span>`;
  return `
    <article class="product-card">
      <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.name || "Cashmere sweater")}" />
      <div class="product-info">
        <div class="product-meta">
          <span>${escapeHtml(product.category || "Knitwear")}</span>
          <span>${escapeHtml(product.status || "Coming Soon")}</span>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
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
    category: "Pullover Sweaters",
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

  if (productGrid) {
    productGrid.innerHTML = products.map(productTemplate).join("");
  }

  if (postGrid) {
    postGrid.innerHTML = posts.map(postTemplate).join("");
  }

  await trackPageview();
}

renderSiteData();
