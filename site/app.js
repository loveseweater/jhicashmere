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

const i18n = window.JINHEXI_I18N || { locale: "en", t: (key) => key };
const dataPrefix = location.protocol === "file:" ? "./" : "/";

const categoryLabels = {
  tops: "Tops",
  sweaters: "Sweaters",
  accessories: "Accessories",
  scarves: "Scarves",
  gloves: "Gloves",
  others: "Other"
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

function normalizeChannel(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["site", "amazon", "both"].includes(raw)) return raw;
  return "all";
}

function normalizeStatus(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  const map = {
    draft: "Draft",
    "coming soon": "Coming Soon",
    "site exclusive": "Site Exclusive",
    "amazon ready": "Amazon Ready"
  };
  return map[key] || map[raw] || raw || "Draft";
}

function statusLabel(value) {
  return normalizeStatus(value);
}

function amazonLabel(product) {
  const label = String(product.amazonLabel || "").trim();
  if (!label) return i18n.t("viewOnAmazon");
  return label;
}

function applyStaticLocale() {
  document.title = "JINHEXI | Cashmere Womenswear Catalog";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.content = "JINHEXI cashmere womenswear catalog with category browsing, product detail pages, and Amazon or direct-site buying paths.";
  }

  const navMap = [
    ["#nav-catalog", i18n.t("catalog")],
    ["#nav-journal", i18n.t("journal")],
    ["#nav-contact", "Contact"]
  ];
  navMap.forEach(([selector, value]) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  });

  const introTitle = document.querySelector("[data-copy-title]");
  if (introTitle) introTitle.textContent = "Women's cashmere, edited for clarity.";
  const heroEyebrow = document.querySelector("[data-hero-eyebrow]");
  if (heroEyebrow) heroEyebrow.textContent = i18n.t("heroEyebrow");
  const introText = document.querySelector("[data-copy-text]");
  if (introText) introText.textContent = "Browse a premium cashmere catalog with clear category navigation, direct-site exclusives, Amazon-linked styles, and SEO-ready journal content.";
  const browseButton = document.querySelector("[data-browse-button]");
  if (browseButton) browseButton.textContent = i18n.t("browseCatalog");
  const journalButton = document.querySelector("[data-journal-button]");
  if (journalButton) journalButton.textContent = i18n.t("openJournal");

  const catalogHeader = document.querySelector("[data-catalog-heading]");
  if (catalogHeader) catalogHeader.textContent = "The Original Edit";
  const catalogEyebrow = document.querySelector("[data-catalog-eyebrow]");
  if (catalogEyebrow) catalogEyebrow.textContent = i18n.t("productCatalog");
  const catalogNote = document.querySelector("[data-catalog-note]");
  if (catalogNote) catalogNote.textContent = "Clean category browsing with site exclusives, Amazon-linked styles, and journal content.";

  const journalHeader = document.querySelector("[data-journal-heading]");
  if (journalHeader) journalHeader.textContent = i18n.t("postsAndArticles");
  const journalEyebrow = document.querySelector("[data-journal-eyebrow]");
  if (journalEyebrow) journalEyebrow.textContent = i18n.t("seoJournal");
  const journalNote = document.querySelector("[data-journal-note]");
  if (journalNote) journalNote.textContent = i18n.t("journalNote");

  const socialHeader = document.querySelector("[data-social-heading]");
  if (socialHeader) socialHeader.textContent = i18n.t("socialPlatforms");
  const socialEyebrow = document.querySelector("[data-social-eyebrow]");
  if (socialEyebrow) socialEyebrow.textContent = i18n.t("social");

  const contactTitle = document.querySelector("[data-contact-title]");
  if (contactTitle) contactTitle.textContent = i18n.t("contactTitle");
  const contactEyebrow = document.querySelector("[data-contact-eyebrow]");
  if (contactEyebrow) contactEyebrow.textContent = i18n.t("contactEyebrow");
  const contactText = document.querySelector("[data-contact-text]");
  if (contactText) contactText.textContent = i18n.t("contactText");
  const contactLink = document.querySelector("[data-contact-link]");
  if (contactLink) contactLink.textContent = `${i18n.t("whatsapp")} +86 136 0232 8348`;

  const footerText = document.querySelector("[data-footer-text]");
  if (footerText) footerText.textContent = "Cashmere Womenswear Catalog";

  const contactHeader = document.querySelector("[data-contact-title]");
  if (contactHeader) contactHeader.textContent = "Contact us on WhatsApp.";
}

function productTemplate(product) {
  const tone = ["ivory", "sage", "charcoal"].includes(product.tone) ? product.tone : "ivory";
  const gallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image || `assets/products/cashmere-${tone}.svg`];
  const image = gallery[0];
  const amazonButton = product.amazonUrl
    ? `<a class="amazon-link" href="${escapeHtml(product.amazonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(amazonLabel(product))}</a>`
    : `<span class="amazon-link disabled">${escapeHtml(i18n.t("amazonComingSoon"))}</span>`;
  const thumbs = gallery.slice(0, 4).map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(product.name || "Cashmere sweater")}" />`).join("");
  const category = normalizeCategory(product.category);
  const id = encodeURIComponent(product.id || product.name || "");
  return `
    <article class="product-card">
      <a href="/product.html?id=${id}" aria-label="${escapeHtml(product.name || "Product detail")}">
        <img class="product-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.name || "Cashmere sweater")}" />
      </a>
      <div class="product-thumbs">${thumbs}</div>
      <div class="product-info">
        <div class="product-meta">
          <span>${escapeHtml(categoryLabels[category] || product.category || "Other")}</span>
          <span>${escapeHtml(statusLabel(product.status || i18n.t("status")))}</span>
        </div>
        <h3><a href="/product.html?id=${id}">${escapeHtml(product.name)}</a></h3>
        <p class="product-channel">${escapeHtml(product.channel === "site" ? i18n.t("exclusiveSite") : product.channel === "amazon" ? i18n.t("amazonCollection") : i18n.t("bothChannels"))}</p>
        <p>${escapeHtml(product.subtitle || product.description)}</p>
        <div class="product-line">
          <span>${escapeHtml(product.colors)}</span>
          <strong>${escapeHtml(product.price)}</strong>
        </div>
        <a class="detail-link" href="/product.html?id=${id}">${escapeHtml(i18n.t("viewDetails"))}</a>
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
      <a class="post-link" href="/journal.html?post=${slug}">${escapeHtml(i18n.t("readMore"))}</a>
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
  applyStaticLocale();
  const localProducts = await loadJson(`${dataPrefix}data/products.json`, fallbackProducts);
  const apiProducts = await loadJson("/api/products", localProducts);
  const products = Array.isArray(apiProducts) && apiProducts.length ? apiProducts : localProducts;
  const posts = await loadJson(`${dataPrefix}data/posts.json`, fallbackPosts);
  const params = new URLSearchParams(location.search);
  const initialChannel = normalizeChannel(params.get("channel"));
  const productGrid = document.querySelector("[data-products]");
  const postGrid = document.querySelector("[data-posts]");
  const filterGrid = document.querySelector("[data-category-filters]");
  const productCount = document.querySelector("[data-product-count]");
  const categories = ["all", "tops", "sweaters", "accessories", "scarves", "gloves", "others"];
  let activeCategory = "all";
  let activeChannel = initialChannel;

  function filteredProducts() {
    return products.filter((product) => {
      const categoryMatch = activeCategory === "all" || normalizeCategory(product.category) === activeCategory;
      if (!categoryMatch) return false;
      if (activeChannel === "all") return true;
      const productChannel = String(product.channel || "both").toLowerCase();
      if (activeChannel === "site") return productChannel === "site" || productChannel === "both";
      if (activeChannel === "amazon") return productChannel === "amazon" || productChannel === "both";
      return productChannel === activeChannel;
    });
  }

  function renderProducts() {
    if (productGrid) {
      const visible = filteredProducts();
      if (productCount) {
        productCount.textContent = `${visible.length} product${visible.length === 1 ? "" : "s"}`;
      }
      productGrid.innerHTML = visible.length
        ? visible.map(productTemplate).join("")
        : `<article class="empty-state"><h3>${escapeHtml(i18n.t("noProducts"))}</h3><p>${escapeHtml(i18n.t("noProductsNote"))}</p></article>`;
    }
  }

  if (filterGrid) {
    filterGrid.innerHTML = categories
      .map((category) => `
        <button type="button" class="category-pill${category === activeCategory ? " active" : ""}" data-category="${category}">
          ${escapeHtml(category === "all" ? i18n.t("all") : categoryLabels[category])}
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
