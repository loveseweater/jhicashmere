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

function imageVariant(url, width) {
  const src = String(url || "").trim();
  if (!src) return src;
  if (!/cdn\.shopify\.com/.test(src)) return src;
  const cleaned = src.replace(/([?&])width=\d+/g, "").replace(/([?&])$/, "");
  return `${cleaned}${cleaned.includes("?") ? "&" : "?"}width=${width}`;
}

function imageSrcSet(url, widths) {
  if (!/cdn\.shopify\.com/.test(String(url || ""))) return "";
  return widths.map((width) => `${imageVariant(url, width)} ${width}w`).join(", ");
}

function srcsetAttr(url, widths, sizes) {
  const set = imageSrcSet(url, widths);
  return set ? ` srcset="${escapeHtml(set)}" sizes="${escapeHtml(sizes)}"` : "";
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
    draft: "Preview Open",
    "coming soon": "Coming Soon",
    "site exclusive": "Site Exclusive",
    "preview open": "Preview Open",
    "amazon ready": "Amazon Launch Soon",
    "amazon launch soon": "Amazon Launch Soon"
  };
  return map[key] || map[raw] || raw || "Preview Open";
}

function statusLabel(value) {
  return normalizeStatus(value);
}

function normalizeCategory(value) {
  const raw = String(value || "").trim().toLowerCase();
  const map = {
    sweaters: "Sweaters",
    tops: "Tops",
    accessories: "Accessories",
    scarves: "Scarves",
    hats: "Hats",
    gloves: "Gloves",
    others: "Other"
  };
  return map[raw] || "Collection";
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
    meta.content = "JINHEXI product detail page with materials, size, care, fit guidance, and retained Amazon launch buttons.";
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
}

function renderProduct(product, products = []) {
  const gallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image || "assets/real-cashmere-hero-jinhexi.webp"];
  const bullets = lines(product.bullets);
  const galleryMain = imageVariant(gallery[0], 1200);
  const gallerySet = srcsetAttr(gallery[0], [480, 720, 960, 1200, 1600], "(max-width: 860px) 92vw, 44vw");
  const amazonButton = `<span class="button primary amazon-detail-disabled" aria-disabled="true">${escapeHtml(i18n.t("amazonComingSoon"))}</span>`;
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 3)
    .map((item) => `
      <article class="product-card">
        <a href="product.html?id=${encodeURIComponent(item.id || item.name || "")}" aria-label="${escapeHtml(item.name)}">
          <img class="product-image" src="${escapeHtml(item.image || item.gallery?.[0] || "assets/real-cashmere-hero-jinhexi.webp")}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" />
        </a>
        <div class="product-info">
          <div class="product-meta">
            <span>${escapeHtml(normalizeCategory(item.category))}</span>
            <span>${escapeHtml(statusLabel(item.status || i18n.t("status")))}</span>
          </div>
          <h3><a href="product.html?id=${encodeURIComponent(item.id || item.name || "")}">${escapeHtml(item.name)}</a></h3>
          <p>${escapeHtml(item.subtitle || item.description)}</p>
          <div class="product-line">
            <span>${escapeHtml(item.colors)}</span>
            <strong>${escapeHtml(item.price)}</strong>
          </div>
          <a class="detail-link" href="product.html?id=${encodeURIComponent(item.id || item.name || "")}">${escapeHtml(i18n.t("viewDetails"))}</a>
        </div>
      </article>
    `)
    .join("");

  document.title = `${product.name || i18n.t("productDetail")} | JINHEXI`;

  return `
    <section class="product-detail">
      <div class="product-gallery">
        <img class="product-main-image" data-main-image src="${escapeHtml(galleryMain)}"${gallerySet} alt="${escapeHtml(product.name)}" loading="eager" fetchpriority="high" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" />
        <details class="product-gallery-details">
          <summary>View detail images</summary>
          <div class="product-detail-thumbs">
            ${gallery.slice(0, 5).map((src, index) => {
              const thumb = imageVariant(src, 240);
              const thumbSet = srcsetAttr(src, [120, 180, 240, 360], "72px");
              return `<button type="button" class="thumb-button${index === 0 ? " active" : ""}" data-thumb="${escapeHtml(src)}"><img src="${escapeHtml(thumb)}"${thumbSet} alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" /></button>`;
            }).join("")}
          </div>
        </details>
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
        <a class="detail-link" href="collection.html">${escapeHtml(i18n.t("backToCatalog"))}</a>
      </div>
    </section>

    <section class="section product-listing-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${escapeHtml(i18n.t("productBrief"))}</p>
          <h2>Everything needed to choose this piece.</h2>
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

    <section class="section related-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${escapeHtml(i18n.t("relatedPieces"))}</p>
          <h2>${escapeHtml(i18n.t("moreToExplore"))}</h2>
        </div>
        <p class="section-note">${escapeHtml(i18n.t("relatedPiecesNote"))}</p>
      </div>
      <div class="product-grid related-grid">
        ${relatedProducts}
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
  const legacyIds = {
    "cashmere-crewneck-sweater": "100-cashmere-crewneck-sweater",
    "cashmere-v-neck-sweater": "100-cashmere-v-neck-sweater",
    "cashmere-cardigan": "100-cashmere-cardigan",
    "cashmere-turtleneck-sweater": "100-cashmere-turtleneck-sweater",
    "cashmere-wrap-scarf": "100-cashmere-wrap-scarf",
    "cashmere-ribbed-beanie": "100-cashmere-ribbed-beanie",
    "cashmere-knit-gloves": "100-cashmere-knit-gloves",
    "cashmere-winter-gift-set": "100-cashmere-winter-gift-set"
  };
  const normalizedId = legacyIds[id] || id;
  const product = products.find((item) => String(item.id || item.name) === normalizedId) || products[0];
  const page = document.querySelector("[data-product-page]");
  if (!page) return;
  if (!product) {
    page.innerHTML = `<section class="product-detail-loading"><h1>${escapeHtml(i18n.t("noProductsYet"))}</h1><p>${escapeHtml(i18n.t("noProductsHint"))}</p></section>`;
    return;
  }
  page.innerHTML = renderProduct(product, products);
  const mainImage = page.querySelector("[data-main-image]");
  const thumbButtons = [...page.querySelectorAll("[data-thumb]")];
  thumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!mainImage) return;
      mainImage.src = button.dataset.thumb;
      const nextSet = imageSrcSet(button.dataset.thumb, [480, 720, 960, 1200, 1600]);
      if (nextSet) {
        mainImage.srcset = nextSet;
      } else {
        mainImage.removeAttribute("srcset");
        mainImage.removeAttribute("sizes");
      }
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
