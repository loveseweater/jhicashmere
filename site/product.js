const i18n = window.JINHEXI_I18N || { locale: "en", t: (key) => key };
const dataPrefix = location.protocol === "file:" ? "./" : "/";

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

function applyLocale() {
  document.title = "JINHEXI | Product Detail";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.content = "JINHEXI product detail page with materials, size, care, buying paths, and Amazon-ready listing notes.";
  }
  const navHome = document.querySelector("#nav-home");
  const navCatalog = document.querySelector("#nav-catalog");
  const navContact = document.querySelector("#nav-contact");
  const navJournal = document.querySelector("#nav-journal");
  if (navCatalog) navCatalog.textContent = i18n.t("catalog");
  if (navHome) navHome.textContent = i18n.t("backToHome");
  if (navContact) navContact.textContent = i18n.t("contactEyebrow");
  if (navJournal) navJournal.textContent = i18n.t("journal");
  const loadingTitle = document.querySelector("[data-loading-title]");
  if (loadingTitle) loadingTitle.textContent = i18n.t("loadingProduct");
  const headerAction = document.querySelector(".header-action");
  if (headerAction) headerAction.textContent = i18n.t("whatsapp");
}

function renderProduct(product) {
  const gallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image || "assets/products/cashmere-ivory.svg"];
  const bullets = lines(product.bullets);
  const amazonButton = product.amazonUrl
    ? `<a class="button primary" href="${escapeHtml(product.amazonUrl)}" target="_blank" rel="noreferrer">${escapeHtml(amazonLabel(product))}</a>`
    : `<span class="button secondary disabled">${escapeHtml(i18n.t("amazonComingSoon"))}</span>`;

  document.title = `${product.name || i18n.t("productDetail")} | JINHEXI`;

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
          <span>${escapeHtml(statusLabel(product.status || i18n.t("status")))}</span>
        </div>
        <div class="product-actions">
          ${amazonButton}
          <a class="button secondary" href="https://wa.me/8613602328348" target="_blank" rel="noreferrer">${escapeHtml(i18n.t("whatsappInquiry"))}</a>
        </div>
        <a class="detail-link" href="/#catalog">${escapeHtml(i18n.t("backToCatalog"))}</a>
      </div>
    </section>

    <section class="section product-listing-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${escapeHtml(i18n.t("productBrief"))}</p>
          <h2>${escapeHtml(i18n.t("productBrief"))}</h2>
        </div>
        <p class="section-note">${escapeHtml(i18n.t("listingBriefNote"))}</p>
      </div>
      <div class="listing-grid">
        <article class="listing-panel">
          <h3>${escapeHtml(i18n.t("coreBullets"))}</h3>
          <ul class="bullet-list">
            ${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || `<li>${escapeHtml(product.description || "Premium cashmere knitwear.")}</li>`}
          </ul>
        </article>
        <article class="listing-panel specs-panel">
          <h3>${escapeHtml(i18n.t("buyerNeeds"))}</h3>
          ${detailRow(i18n.t("colors"), product.colors)}
          ${detailRow(i18n.t("material"), product.material)}
          ${detailRow(i18n.t("size"), product.sizeRange)}
          ${detailRow(i18n.t("fit"), product.fit)}
          ${detailRow(i18n.t("care"), product.care)}
          ${detailRow(i18n.t("occasion"), product.occasion)}
          ${detailRow(i18n.t("keywords"), product.searchKeywords)}
        </article>
        <article class="listing-panel wide">
          <h3>${escapeHtml(i18n.t("productIntro"))}</h3>
          <p>${escapeHtml(product.description)}</p>
        </article>
      </div>
    </section>
  `;
}

async function init() {
  applyLocale();
  const fallback = await loadJson(`${dataPrefix}data/products.json`, []);
  const apiProducts = await loadJson("/api/products", fallback);
  const products = Array.isArray(apiProducts) && apiProducts.length ? apiProducts : fallback;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const product = products.find((item) => String(item.id || item.name) === id) || products[0];
  const page = document.querySelector("[data-product-page]");
  if (!page) return;
  if (!product) {
    page.innerHTML = `<section class="product-detail-loading"><h1>${escapeHtml(i18n.t("noProductsYet"))}</h1><p>${escapeHtml(i18n.t("noProductsHint"))}</p></section>`;
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
