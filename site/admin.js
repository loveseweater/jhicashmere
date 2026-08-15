let token = "";
let products = [];
let posts = [];

const loginPanel = document.querySelector("[data-login-panel]");
const workspace = document.querySelector("[data-admin-workspace]");
const statusLine = document.querySelector("[data-status]");
const loginStatus = document.querySelector("[data-login-status]");

function setStatus(message) {
  if (statusLine) statusLine.textContent = message;
  if (loginStatus && !loginPanel.hidden) loginStatus.textContent = message;
}

async function requestJson(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

async function loadStats() {
  const stats = await requestJson("/api/stats");
  document.querySelector('[data-metric="views"]').textContent = String(stats.totalViews || 0);
  document.querySelector('[data-metric="today"]').textContent = String(stats.todayViews || 0);
  document.querySelector('[data-metric="products"]').textContent = String(stats.productCount || 0);
  document.querySelector('[data-metric="posts"]').textContent = String(stats.postCount || 0);
  document.querySelector('[data-metric="analytics-views"]').textContent = String(stats.totalViews || 0);
  document.querySelector('[data-metric="analytics-today"]').textContent = String(stats.todayViews || 0);
  document.querySelector('[data-metric="analytics-products"]').textContent = String(stats.productCount || 0);
  document.querySelector('[data-metric="analytics-posts"]').textContent = String(stats.postCount || 0);
  document.querySelector("[data-analytics-list]").innerHTML = `
    <article class="editor-item">
      <div class="editor-title"><strong>热门页面</strong></div>
      <table class="analytics-table">
        <thead>
          <tr><th>路径</th><th>浏览量</th></tr>
        </thead>
        <tbody>
          ${(stats.topPages || [])
            .map((item) => `<tr><td>${escapeHtml(item.path)}</td><td>${escapeHtml(String(item.views))}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </article>
  `;
}

function field(label, value, key, type = "text") {
  return `
    <label>
      ${label}
      <input type="${type}" data-key="${key}" value="${escapeAttr(value)}" />
    </label>
  `;
}

function selectField(label, value, key, options) {
  return `
    <label>
      ${label}
      <select data-key="${key}">
        ${options
          .map(([optionValue, optionLabel]) => `<option value="${escapeAttr(optionValue)}"${String(value || "").trim() === optionValue ? " selected" : ""}>${optionLabel}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function categoryField(value) {
  const options = [
    ["tops", "上衣"],
    ["sweaters", "毛衣"],
    ["accessories", "配件"],
    ["scarves", "围巾"],
    ["hats", "帽子"],
    ["gloves", "手套"],
    ["others", "其他"]
  ];
  return `
    <label>
      分类
      <select data-key="category">
        ${options
          .map(([valueKey, label]) => `<option value="${valueKey}"${String(value || "").trim() === valueKey ? " selected" : ""}>${label}</option>`)
          .join("")}
      </select>
    </label>
  `;
}

function channelField(value) {
  return selectField("销售渠道", value, "channel", [
    ["site", "独立站"],
    ["amazon", "Amazon"],
    ["both", "双渠道"]
  ]);
}

function statusField(value) {
  return selectField("状态", normalizeStatus(value), "status", [
    ["Preview Open", "预览展示"],
    ["Coming Soon", "即将上架"],
    ["Amazon Launch Soon", "Amazon 即将上线"],
    ["Site Exclusive", "独立站展示"]
  ]);
}

function textarea(label, value, key) {
  return `
    <label class="wide-field">
      ${label}
      <textarea data-key="${key}" rows="4">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function galleryTextarea(value) {
  const gallery = Array.isArray(value) ? value.join("\n") : String(value || "");
  return textarea("图片图册（每行一个URL）", gallery, "gallery");
}

function bulletsTextarea(value) {
  const bullets = Array.isArray(value) ? value.join("\n") : String(value || "");
  return textarea("核心卖点（每行一条，类似Amazon五点描述）", bullets, "bullets");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function normalizeStatus(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  const map = {
    draft: "Preview Open",
    "草稿": "Preview Open",
    "preview open": "Preview Open",
    "预览展示": "Preview Open",
    "coming soon": "Coming Soon",
    "即将上架": "Coming Soon",
    "site exclusive": "Site Exclusive",
    "独家上架": "Site Exclusive",
    "amazon ready": "Amazon Launch Soon",
    "amazon 备货": "Amazon Launch Soon",
    "amazon launch soon": "Amazon Launch Soon",
    "amazon 即将上线": "Amazon Launch Soon"
  };
  return map[key] || map[raw] || "Preview Open";
}

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderProducts() {
  document.querySelector("[data-product-list]").innerHTML = products
    .map(
      (product, index) => `
    <article class="editor-item" data-index="${index}">
          <div class="editor-title">
            <div class="admin-item-title">
              <img src="${escapeAttr(product.image || "assets/catalog-branded/100-cashmere-crewneck-sweater-01.webp")}" alt="" loading="lazy" decoding="async" />
              <div>
                <strong>${escapeHtml(product.name || "新产品")}</strong>
                <span>${escapeHtml(product.sku || "JHX")} · ${escapeHtml(product.material || "100% cashmere")}</span>
              </div>
            </div>
            <button type="button" data-remove-product="${index}">删除</button>
          </div>
          <div class="editor-grid">
            ${field("产品标题", product.name, "name")}
            ${field("SKU / 款号", product.sku, "sku")}
            ${categoryField(product.category)}
            ${channelField(product.channel)}
            ${field("颜色", product.colors, "colors")}
            ${field("价格", product.price, "price")}
            ${statusField(product.status)}
            ${field("色调（ivory / sage / charcoal）", product.tone, "tone")}
            ${field("Amazon 链接", product.amazonUrl, "amazonUrl")}
            ${field("Amazon 按钮文案", product.amazonLabel, "amazonLabel")}
            ${field("材质成分", product.material, "material")}
            ${field("尺码范围", product.sizeRange, "sizeRange")}
            ${field("版型", product.fit, "fit")}
            ${field("护理方式", product.care, "care")}
            ${field("适用场景", product.occasion, "occasion")}
            ${field("搜索关键词", product.searchKeywords, "searchKeywords")}
            ${field("主图URL", product.image, "image")}
            ${galleryTextarea(product.gallery)}
            ${textarea("一句话简介（前台卡片显示）", product.subtitle, "subtitle")}
            ${bulletsTextarea(product.bullets)}
            ${textarea("产品详情描述", product.description, "description")}
            ${textarea("SEO描述", product.seoDescription, "seoDescription")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderPosts() {
  document.querySelector("[data-post-list]").innerHTML = posts
    .map(
      (post, index) => `
        <article class="editor-item" data-index="${index}">
          <div class="editor-title">
            <strong>${escapeHtml(post.title || "新博文")}</strong>
            <button type="button" data-remove-post="${index}">删除</button>
          </div>
          <div class="editor-grid">
            ${field("标题", post.title, "title")}
            ${field("日期", post.date, "date", "date")}
            ${field("URL 别名", post.slug, "slug")}
            ${field("封面图片", post.image, "image")}
            ${field("封面文案", post.imageAlt, "imageAlt")}
            ${field("SEO 标题", post.seoTitle, "seoTitle")}
            ${field("SEO 描述", post.seoDescription, "seoDescription")}
            ${textarea("摘要", post.excerpt, "excerpt")}
            ${textarea("正文", post.content, "content")}
          </div>
        </article>
      `
    )
    .join("");
}

function collect(listSelector, source) {
  return [...document.querySelectorAll(`${listSelector} .editor-item`)].map((item) => {
    const index = Number(item.dataset.index);
    const next = { ...source[index] };
    item.querySelectorAll("[data-key]").forEach((input) => {
      const key = input.dataset.key;
      const value = input.value.trim();
      if (key === "gallery" || key === "bullets") {
        next[key] = splitLines(value);
      } else {
        next[key] = value;
      }
    });
    if (Object.prototype.hasOwnProperty.call(next, "status")) {
      next.status = normalizeStatus(next.status);
    }
    return next;
  });
}

async function loadAdminData() {
  products = await requestJson("/api/products");
  posts = await requestJson("/api/posts");
  renderProducts();
  renderPosts();
  await loadStats();
}

function showWorkspace() {
  loginPanel.hidden = true;
  workspace.hidden = false;
}

document.querySelector("[data-login-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = new FormData(event.currentTarget).get("password");
  try {
    const data = await requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify({ password })
    });
    token = data.token;
    showWorkspace();
    await loadAdminData();
    setStatus("登录成功。修改后点击保存即可同步到站点数据。");
  } catch (error) {
    setStatus(error.message);
  }
});

document.querySelector("[data-logout]").addEventListener("click", () => {
  token = "";
  products = [];
  posts = [];
  workspace.hidden = true;
  loginPanel.hidden = false;
  document.querySelector("[data-login-form]").reset();
  setStatus("已退出，请重新输入管理员密码。");
});

document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`[data-panel="${button.dataset.tab}"]`).classList.add("active");
  });
});

document.querySelector("[data-add-product]").addEventListener("click", () => {
  products = collect("[data-product-list]", products);
    products.push({
      name: "New 100% Cashmere Product",
      sku: "JHX-100-NEW",
      category: "sweaters",
      channel: "both",
      colors: "Ivory / Oatmeal / Charcoal",
      subtitle: "A soft 100% cashmere piece for refined daily wear.",
      description: "Describe the 100% cashmere material, fit, hand feel, colors, care guidance, and customer use scenario here.",
      bullets: [
        "Made with 100% cashmere for soft lightweight warmth",
        "Clean silhouette for work, travel, and daily styling",
        "Neutral colors coordinate with sweaters and accessories"
      ],
      material: "100% cashmere",
      sizeRange: "S / M / L / XL",
      fit: "Regular fit",
      care: "Cold hand wash or dry clean; reshape and dry flat",
      occasion: "Office / travel / gifting",
      searchKeywords: "100 cashmere sweater women, JINHEXI cashmere, premium knitwear",
      seoDescription: "JINHEXI 100% cashmere product for premium women's knitwear and accessories.",
      price: "$0.00",
      status: "Preview Open",
      amazonUrl: "",
      amazonLabel: "Amazon Coming Soon",
      tone: "ivory",
      image: "assets/catalog-branded/100-cashmere-crewneck-sweater-01.webp",
      gallery: [
        "assets/catalog-branded/100-cashmere-crewneck-sweater-01.webp",
        "assets/catalog-branded/100-cashmere-crewneck-sweater-02.webp",
        "assets/catalog-branded/100-cashmere-crewneck-sweater-03.webp"
      ]
  });
  renderProducts();
});

document.querySelector("[data-add-post]").addEventListener("click", () => {
  posts = collect("[data-post-list]", posts);
  posts.push({
    title: "新博文",
    date: new Date().toISOString().slice(0, 10),
    slug: "",
    seoTitle: "",
    seoDescription: "",
    excerpt: "这里填写博文摘要。",
    content: "这里填写博文正文。"
  });
  renderPosts();
});

document.addEventListener("click", (event) => {
  const removeProduct = event.target.closest("[data-remove-product]");
  const removePost = event.target.closest("[data-remove-post]");
  if (removeProduct) {
    products.splice(Number(removeProduct.dataset.removeProduct), 1);
    renderProducts();
  }
  if (removePost) {
    posts.splice(Number(removePost.dataset.removePost), 1);
    renderPosts();
  }
});

document.querySelector("[data-save-products]").addEventListener("click", async () => {
  try {
    products = collect("[data-product-list]", products);
    products = await requestJson("/api/products", {
      method: "PUT",
      body: JSON.stringify(products)
    });
    renderProducts();
    setStatus("产品已保存。");
  } catch (error) {
    setStatus(error.message);
  }
});

document.querySelector("[data-save-posts]").addEventListener("click", async () => {
  try {
    posts = collect("[data-post-list]", posts);
    posts = await requestJson("/api/posts", {
      method: "PUT",
      body: JSON.stringify(posts)
    });
    renderPosts();
    setStatus("博文已保存。");
  } catch (error) {
    setStatus(error.message);
  }
});

document.querySelectorAll(".admin-tabs .tab").forEach((button) => {
  if (button.dataset.tab === "analytics") {
    button.addEventListener("click", async () => {
      try {
        await loadStats();
      } catch (error) {
        setStatus(error.message);
      }
    });
  }
});
