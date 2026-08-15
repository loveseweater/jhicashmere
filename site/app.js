async function loadJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    return await response.json();
  } catch {
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

const dataPrefix = location.protocol === "file:" ? "./" : "/";
const categoryLabels = {
  tops: "Tops",
  sweaters: "Sweaters",
  accessories: "Accessories",
  scarves: "Scarves",
  gloves: "Gloves",
  hats: "Hats",
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

function normalizeCategory(value) {
  const raw = String(value || "").trim().toLowerCase();
  const map = {
    "pullover sweaters": "sweaters",
    cardigans: "tops",
    turtlenecks: "sweaters",
    "women's sweaters": "sweaters",
    sweaters: "sweaters",
    tops: "tops",
    accessories: "accessories",
    scarves: "scarves",
    gloves: "gloves",
    hats: "hats",
    beanies: "hats",
    others: "others"
  };
  return map[raw] || "others";
}

function priceNumber(value) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}

function amazonButtonLabel(product) {
  const channel = String(product.channel || "").toLowerCase();
  if (channel === "amazon" || channel === "both") return "Amazon coming soon";
  return "Amazon preview";
}

function productTemplate(product, index) {
  const image = product.image || (Array.isArray(product.gallery) ? product.gallery[0] : "") || "assets/real-cashmere-hero-jinhexi.webp";
  const imageSrc = imageVariant(image, 960);
  const imageSet = srcsetAttr(image, [360, 540, 720, 960, 1200], "(max-width: 620px) 92vw, (max-width: 1050px) 44vw, 28vw");
  const category = normalizeCategory(product.category);
  const status = String(product.status || "Limited release");
  const inquiryUrl = `https://wa.me/8613602328348?text=${encodeURIComponent(`Hi JINHEXI, I would like availability and sizing help for ${product.name}.`)}`;
  const bullets = Array.isArray(product.bullets) ? product.bullets.filter(Boolean).slice(0, 2) : [];

  return `
    <article class="sales-product-card reveal" style="--reveal-delay:${Math.min(index * 70, 280)}ms">
      <div class="sales-product-media" aria-label="${escapeHtml(product.name)}">
        <img src="${escapeHtml(imageSrc)}"${imageSet} alt="${escapeHtml(product.name || "JINHEXI cashmere product")}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/real-cashmere-hero-jinhexi.webp';" />
        <span class="product-status">${escapeHtml(status)}</span>
      </div>
      <div class="sales-product-info">
        <div class="sales-product-topline">
          <span>${escapeHtml(categoryLabels[category] || "Knitwear")}</span>
          <strong>${escapeHtml(product.price || "Enquire")}</strong>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.subtitle || product.description || "")}</p>
        <div class="product-material"><span>Material</span><strong>${escapeHtml(product.material || "100% cashmere")}</strong></div>
        <div class="product-colors"><span>Size</span><span>${escapeHtml(product.sizeRange || "Ask for current sizes")}</span></div>
        <div class="product-colors"><span>Colors</span><span>${escapeHtml(product.colors || "Ask for current colors")}</span></div>
        ${bullets.length ? `<ul class="product-mini-bullets">${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        <div class="product-actions">
          <span class="product-buy amazon-disabled" aria-disabled="true">${escapeHtml(amazonButtonLabel(product))}</span>
          <a class="product-inquiry" href="${escapeHtml(inquiryUrl)}" target="_blank" rel="noreferrer">Ask availability <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </article>
  `;
}

function postTemplate(post, index) {
  const slug = encodeURIComponent(post.slug || post.id || post.title || "");
  const image = post.image || "assets/real-cashmere-hero-jinhexi.webp";
  return `
    <article class="sales-post-card reveal" style="--reveal-delay:${Math.min(index * 90, 270)}ms">
      <a class="sales-post-media" href="journal.html?post=${slug}">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" />
      </a>
      <div class="sales-post-copy">
        <div><time datetime="${escapeHtml(post.date || "")}">${escapeHtml(post.date || "Journal")}</time><span>Cashmere notes</span></div>
        <h3><a href="journal.html?post=${slug}">${escapeHtml(post.title)}</a></h3>
        <p>${escapeHtml(post.excerpt || "")}</p>
        <a class="text-arrow" href="journal.html?post=${slug}">Read story <span aria-hidden="true">→</span></a>
      </div>
    </article>
  `;
}

function enableRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  items.forEach((item) => observer.observe(item));
}

async function renderStorefront() {
  const fallbackProducts = [];
  const fallbackPosts = [];
  const localProducts = await loadJson(`${dataPrefix}data/products.json`, fallbackProducts);
  const apiProducts = await loadJson("/api/products", localProducts);
  const products = Array.isArray(apiProducts) && apiProducts.length ? apiProducts : localProducts;
  const posts = await loadJson(`${dataPrefix}data/posts.json`, fallbackPosts);

  const productGrid = document.querySelector("[data-products]");
  const postGrid = document.querySelector("[data-posts]");
  const filterGrid = document.querySelector("[data-category-filters]");
  const productCount = document.querySelector("[data-product-count]");
  const sortSelect = document.querySelector("[data-sort-select]");
  const searchInput = document.querySelector("[data-search-input]");
  const categories = ["all", "sweaters", "tops", "scarves", "hats", "gloves", "accessories"];
  let activeCategory = "all";
  let activeSort = "featured";
  let activeSearch = "";

  function filteredProducts() {
    const visible = products.filter((product) => {
      const categoryMatch = activeCategory === "all" || normalizeCategory(product.category) === activeCategory;
      const haystack = [product.name, product.subtitle, product.description, product.colors, product.searchKeywords].join(" ").toLowerCase();
      return categoryMatch && (!activeSearch || haystack.includes(activeSearch));
    });
    if (activeSort === "newest") return visible.slice().reverse();
    if (activeSort === "price-asc") return visible.slice().sort((a, b) => priceNumber(a.price) - priceNumber(b.price));
    if (activeSort === "price-desc") return visible.slice().sort((a, b) => priceNumber(b.price) - priceNumber(a.price));
    return visible;
  }

  function renderProducts() {
    const visible = filteredProducts();
    if (productCount) productCount.textContent = `${visible.length} piece${visible.length === 1 ? "" : "s"} in this edit`;
    if (productGrid) {
      productGrid.innerHTML = visible.length
        ? visible.map(productTemplate).join("")
        : '<div class="empty-state"><h3>No matching pieces</h3><p>Try another category or message us for current availability.</p></div>';
      enableRevealAnimations();
    }
  }

  if (filterGrid) {
    filterGrid.innerHTML = categories.map((category) => `
      <button type="button" class="category-pill${category === "all" ? " active" : ""}" data-category="${category}">
        ${category === "all" ? "All pieces" : categoryLabels[category]}
      </button>
    `).join("");
    filterGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      activeCategory = button.dataset.category;
      filterGrid.querySelectorAll("[data-category]").forEach((item) => item.classList.toggle("active", item === button));
      renderProducts();
    });
  }

  sortSelect?.addEventListener("change", () => {
    activeSort = sortSelect.value;
    renderProducts();
  });

  searchInput?.addEventListener("input", () => {
    activeSearch = searchInput.value.trim().toLowerCase();
    renderProducts();
  });

  renderProducts();
  if (postGrid) postGrid.innerHTML = posts.slice(0, 3).map(postTemplate).join("");

  const leadForm = document.querySelector("[data-lead-form]");
  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(leadForm).get("email");
    const message = `Hi JINHEXI, I would like private launch access and sizing help. My email is ${email}.`;
    window.open(`https://wa.me/8613602328348?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  });

  enableRevealAnimations();
  await trackPageview();
}

renderStorefront();
