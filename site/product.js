async function loadJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    return await response.json();
  } catch {
    return fallback;
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

function lines(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function detailRow(label, value) {
  if (!value) return "";
  return `
    <div>
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value)}</span>
    </div>
  `;
}

function renderProduct(product) {
  const gallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image || "assets/products/cashmere-ivory.svg"];
  const bullets = lines(product.bullets);
  const amazonButton = product.amazonUrl
    ? `<a class="button primary" href="${escapeHtml(product.amazonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(product.amazonLabel || "View on Amazon")}</a>`
    : `<span class="button secondary disabled">Amazon Coming Soon</span>`;

  document.title = `${product.name || "Product"} | JINHEXI`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = product.seoDescription || product.subtitle || product.description || "";

  return `
    <section class="product-detail">
      <div class="product-gallery">
        <img class="product-main-image" data-main-image src="${escapeHtml(gallery[0])}" alt="${escapeHtml(product.name)}" />
        <div class="product-detail-thumbs">
          ${gallery.slice(0, 5).map((src, index) => `<button type="button" class="thumb-button${index === 0 ? " active" : ""}" data-thumb="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)}" /></button>`).join("")}
        </div>
      </div>
      <div class="product-detail-copy">
        <p class="eyebrow">${escapeHtml(product.sku || "JINHEXI")}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="product-subtitle">${escapeHtml(product.subtitle || product.description)}</p>
        <div class="product-price-row">
          <strong>${escapeHtml(product.price)}</strong>
          <span>${escapeHtml(product.status || "Coming Soon")}</span>
        </div>
        <div class="product-actions">
          ${amazonButton}
          <a class="button secondary" href="https://wa.me/8613602328348" target="_blank" rel="noreferrer">WhatsApp 咨询</a>
        </div>
        <a class="detail-link" href="/#catalog">返回分类</a>
      </div>
    </section>

    <section class="section product-listing-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Listing Brief</p>
          <h2>产品资料</h2>
        </div>
        <p class="section-note">这里是简化版 Amazon Listing 信息，后台可以维护。</p>
      </div>
      <div class="listing-grid">
        <article class="listing-panel">
          <h3>核心卖点</h3>
          <ul class="bullet-list">
            ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(product.description || "Premium cashmere knitwear.")}</li>`}
          </ul>
        </article>
        <article class="listing-panel specs-panel">
          <h3>买家需要知道</h3>
          ${detailRow("颜色", product.colors)}
          ${detailRow("材质", product.material)}
          ${detailRow("尺码", product.sizeRange)}
          ${detailRow("版型", product.fit)}
          ${detailRow("护理", product.care)}
          ${detailRow("适用场景", product.occasion)}
          ${detailRow("关键词", product.searchKeywords)}
        </article>
        <article class="listing-panel wide">
          <h3>产品简介</h3>
          <p>${escapeHtml(product.description)}</p>
        </article>
      </div>
    </section>
  `;
}

async function init() {
  const fallback = await loadJson("/data/products.json", []);
  const apiProducts = await loadJson("/api/products", fallback);
  const products = Array.isArray(apiProducts) && apiProducts.length ? apiProducts : fallback;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const product = products.find((item) => String(item.id || item.name) === id) || products[0];
  const page = document.querySelector("[data-product-page]");
  if (!page) return;
  if (!product) {
    page.innerHTML = `<section class="product-detail-loading"><h1>暂无产品</h1><p>请先在后台新增产品。</p></section>`;
    return;
  }
  page.innerHTML = renderProduct(product);
  const mainImage = page.querySelector("[data-main-image]");
  const thumbButtons = [...page.querySelectorAll("[data-thumb]")];
  thumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!mainImage) return;
      mainImage.src = button.dataset.thumb;
      thumbButtons.forEach((item) => item.classList.toggle("active", item === button));
    });
  });
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location.pathname + location.search })
    });
  } catch {
    return;
  }
}

init();
