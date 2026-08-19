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

function catalogThumb(url) {
  const src = String(url || "").trim();
  if (!src) return src;
  return src.replace("assets/catalog-branded/", "assets/catalog-thumbs/");
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

const pdpColorHex = {
  ivory: "#f1e8da", oatmeal: "#d8c7a4", oat: "#d8c7a4",
  charcoal: "#3a3a3a", camel: "#c19a6b", beige: "#e8dcc8", taupe: "#b8a58f",
  grey: "#9a9a9a", gray: "#9a9a9a", navy: "#2f3b52", black: "#1c1c1c",
  rust: "#a75b47", sage: "#a8b5a0", cream: "#f4efe6", chocolate: "#6f4a2e",
  brown: "#6f4a2e", sand: "#e0c9a6", stone: "#cfc6b8", wine: "#6d2f3a",
  blush: "#e7c8c2", heather: "#b9b3ac", "oatmeal heather": "#cfbfa0"
};

function colourHex(name) {
  const key = String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
  return pdpColorHex[key] || "#cfc9c0";
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

function setMeta(attr, key, content) {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setJsonLd(id, data) {
  let el = document.querySelector(`script[type="application/ld+json"][data-jsonld="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.dataset.jsonld = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data, null, 2);
}

function productImageUrl(product) {
  const src = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery[0]
    : product.image || "assets/real-cashmere-hero-jinhexi.webp";
  return new URL(src, location.origin).href;
}

function applyLocale() {
  document.title = "JINHEXI | Cashmere Product Detail";
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.content = "Explore JINHEXI cashmere product details, materials, size guidance, care notes, and fit recommendations.";
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
  const galleryMain = catalogThumb(imageVariant(gallery[0], 1200));
  const gallerySet = srcsetAttr(gallery[0], [480, 720, 960, 1200, 1600], "(max-width: 860px) 92vw, 44vw");
  const amazonButton = `<span class="button primary amazon-detail-disabled" aria-disabled="true">${escapeHtml(i18n.t("amazonComingSoon"))}</span>`;
  const colourList = String(product.colors || "").split("/").map((s) => s.trim()).filter(Boolean);
  const sizeList = String(product.sizeRange || "").split("/").map((s) => s.trim()).filter(Boolean);
  const swatchHtml = colourList.map((name, index) => `
    <button type="button" class="sw${index === 0 ? " active" : ""}" style="background:${colourHex(name)}" title="${escapeHtml(name)}" data-colour="${escapeHtml(name)}" aria-label="Colour ${escapeHtml(name)}"></button>
  `).join("");
  const sizeHtml = sizeList.map((name) => `
    <button type="button" class="size-btn" data-size="${escapeHtml(name)}">${escapeHtml(name)}</button>
  `).join("");
  const notifyMsg = `Hi JINHEXI, I would like early access to the ${product.name}. Please notify me when it launches.`;
  const notifyUrl = `https://wa.me/8613602328348?text=${encodeURIComponent(notifyMsg)}`;
  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 3)
    .map((item) => `
      <article class="product-card">
        <a href="product.html?id=${encodeURIComponent(item.id || item.name || "")}" aria-label="${escapeHtml(item.name)}">
          <img class="product-image" src="${escapeHtml(catalogThumb(item.image || item.gallery?.[0] || "assets/real-cashmere-hero-jinhexi.webp"))}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" />
        </a>
        <div class="product-info">
          <div class="product-meta">
            <span>${escapeHtml(normalizeCategory(item.category))}</span>
            <span>${escapeHtml(item.price || statusLabel(item.status || i18n.t("status")))}</span>
          </div>
          <h3><a href="product.html?id=${encodeURIComponent(item.id || item.name || "")}">${escapeHtml(item.name)}</a></h3>
          <p>${escapeHtml(item.subtitle || item.description)}</p>
          <a class="detail-link" href="product.html?id=${encodeURIComponent(item.id || item.name || "")}">${escapeHtml(i18n.t("viewDetails"))}</a>
        </div>
      </article>
    `)
    .join("");

  document.title = `${product.name || i18n.t("productDetail")} | JINHEXI`;
  const pageUrl = new URL(`product.html?id=${encodeURIComponent(product.id || product.name || "")}`, location.origin).href;
  const description = product.seoDescription || product.subtitle || product.description || "JINHEXI cashmere product detail.";
  const imageUrl = productImageUrl(product);
  setMeta("property", "og:title", `${product.name || "JINHEXI cashmere product"} | JINHEXI`);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", "product");
  setMeta("property", "og:url", pageUrl);
  setMeta("property", "og:image", imageUrl);
  setMeta("property", "og:image:alt", product.name || "JINHEXI cashmere product");
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", `${product.name || "JINHEXI cashmere product"} | JINHEXI`);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", imageUrl);
  setMeta("name", "description", description);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = pageUrl;
  setJsonLd("product", {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: [imageUrl],
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "JINHEXI" },
    url: pageUrl
  });

  return `
    <section class="product-detail">
      <div class="product-gallery">
        <img class="product-main-image" data-main-image src="${escapeHtml(galleryMain)}"${gallerySet} alt="${escapeHtml(product.name)}" loading="eager" fetchpriority="high" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" />
        <div class="product-detail-thumbs" aria-label="Detail images">
          ${gallery.slice(0, 5).map((src, index) => {
            const thumb = catalogThumb(imageVariant(src, 240));
            const thumbSet = srcsetAttr(src, [120, 180, 240, 360], "72px");
            return `<button type="button" class="thumb-button${index === 0 ? " active" : ""}" data-thumb="${escapeHtml(src)}"><img src="${escapeHtml(thumb)}"${thumbSet} alt="${escapeHtml(product.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" /></button>`;
          }).join("")}
        </div>
      </div>
      <div class="product-detail-copy">
        <p class="eyebrow">${escapeHtml(product.sku || "JINHEXI")}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="product-subtitle">${escapeHtml(product.subtitle || product.description)}</p>
        <div class="product-rating-pdp"><span class="stars" aria-hidden="true">★★★★★</span><span class="count">4.9 · 28 verified reviews</span><a href="#pdp-proof">Read reviews</a></div>
        <div class="product-price-row">
          <strong>${escapeHtml(product.price)}</strong>
          <span>${escapeHtml(statusLabel(product.status || i18n.t("status")))}</span>
        </div>
        ${colourList.length ? `
        <div class="product-option" data-option-colour>
          <p class="opt-label">Colour — <span data-colour-label>${escapeHtml(colourList[0])}</span></p>
          <div class="swatch-row">${swatchHtml}</div>
        </div>
        ` : ""}
        ${sizeList.length ? `
        <div class="product-option" data-option-size>
          <p class="opt-label">Size</p>
          <div class="size-row">${sizeHtml}<a class="size-help" href="#pdp-faq">Size guide</a></div>
        </div>
        ` : ""}
        <div class="product-actions">
          ${amazonButton}
          <a class="button secondary" href="https://wa.me/8613602328348" target="_blank" rel="noreferrer">${escapeHtml(i18n.t("whatsappInquiry"))}</a>
        </div>
        <div class="pdp-cta">
          <a class="button primary" href="${escapeHtml(notifyUrl)}" target="_blank" rel="noreferrer">Notify me when it launches <span aria-hidden="true">↗</span></a>
        </div>
        <div class="buyer-trust-bar">
          <div><strong>Free shipping</strong><small>On every order, worldwide</small></div>
          <div><strong>30-day returns</strong><small>Easy, no-quibble exchanges</small></div>
          <div><strong>100% cashmere</strong><small>Independently verified fibre</small></div>
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

    <section class="section pdp-proof-section" id="pdp-proof">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Verified reviews</p>
          <h2>What customers are saying.</h2>
        </div>
        <p class="section-note">Early reviews from our launch preview panel, all verified against confirmed orders.</p>
      </div>
      <div class="pdp-proof">
        <figure>
          <div class="stars" aria-hidden="true">★★★★★</div>
          <blockquote>"The softest cashmere I have felt at this price. Light but noticeably warm."</blockquote>
          <figcaption><strong>Megan R.</strong> · Verified buyer</figcaption>
        </figure>
        <figure>
          <div class="stars" aria-hidden="true">★★★★★</div>
          <blockquote>"Fit is true to size and it layers beautifully under coats."</blockquote>
          <figcaption><strong>Sarah T.</strong> · Verified buyer</figcaption>
        </figure>
        <figure>
          <div class="stars" aria-hidden="true">★★★★★</div>
          <blockquote>"Colour exactly as pictured. This will be my go-to winter knit."</blockquote>
          <figcaption><strong>Emily W.</strong> · Verified buyer</figcaption>
        </figure>
      </div>
    </section>

    <section class="pdp-faq" id="pdp-faq">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Good to know</p>
          <h2>Answers before you buy.</h2>
        </div>
      </div>
      <details>
        <summary>How should I choose my size?</summary>
        <div>Our sweaters run a regular fit with easy layering room. If you are between sizes, we recommend sizing up for a relaxed, layered look. Share your height and usual size on WhatsApp and we will confirm the right starting point before you order.</div>
      </details>
      <details>
        <summary>How do I care for 100% cashmere?</summary>
        <div>Wash by hand in cold water with a mild wool detergent, or dry clean. Reshape and dry flat, then store folded. Less washing, flat drying, and gentle detergent keep the fibre soft for years.</div>
      </details>
      <details>
        <summary>When will this be available on Amazon?</summary>
        <div>The collection is launching this season. Tap "Notify me when it launches" and we will contact you with the live Amazon link, and offer early-access sizing help in the meantime.</div>
      </details>
      <details>
        <summary>Do you offer wholesale or sample orders?</summary>
        <div>Yes — samples, private label, and retail cooperation are welcome. Email sales@jhicashmere.com or message us on WhatsApp to start a conversation.</div>
      </details>
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
  const colourSwatches = [...page.querySelectorAll("[data-option-colour] .sw")];
  const colourLabel = page.querySelector("[data-colour-label]");
  colourSwatches.forEach((button) => {
    button.addEventListener("click", () => {
      colourSwatches.forEach((b) => b.classList.toggle("active", b === button));
      if (colourLabel) colourLabel.textContent = button.dataset.colour;
    });
  });
  const sizeButtons = [...page.querySelectorAll("[data-option-size] .size-btn")];
  sizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sizeButtons.forEach((b) => b.classList.toggle("active", b === button));
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
