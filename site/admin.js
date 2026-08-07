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
    throw new Error(data.error || "Request failed");
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

function categoryField(value) {
  const options = [
    ["tops", "上衣"],
    ["sweaters", "毛衣"],
    ["accessories", "配件"],
    ["scarves", "围巾"],
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

function renderProducts() {
  document.querySelector("[data-product-list]").innerHTML = products
    .map(
      (product, index) => `
    <article class="editor-item" data-index="${index}">
          <div class="editor-title">
            <strong>${escapeHtml(product.name || "New Product")}</strong>
            <button type="button" data-remove-product="${index}">Remove</button>
          </div>
          <div class="editor-grid">
            ${field("产品标题", product.name, "name")}
            ${field("SKU / 款号", product.sku, "sku")}
            ${categoryField(product.category)}
            ${field("销售渠道（site / amazon / both）", product.channel, "channel")}
            ${field("颜色", product.colors, "colors")}
            ${field("价格", product.price, "price")}
            ${field("状态", product.status, "status")}
            ${field("色调（ivory / sage / charcoal）", product.tone, "tone")}
            ${field("Amazon URL", product.amazonUrl, "amazonUrl")}
            ${field("Amazon按钮文案", product.amazonLabel, "amazonLabel")}
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
            <strong>${escapeHtml(post.title || "New Post")}</strong>
            <button type="button" data-remove-post="${index}">Remove</button>
          </div>
          <div class="editor-grid">
            ${field("Title", post.title, "title")}
            ${field("Date", post.date, "date", "date")}
            ${field("Slug", post.slug, "slug")}
            ${field("SEO Title", post.seoTitle, "seoTitle")}
            ${field("SEO Description", post.seoDescription, "seoDescription")}
            ${textarea("Excerpt", post.excerpt, "excerpt")}
            ${textarea("Content", post.content, "content")}
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
      next[input.dataset.key] = input.value.trim();
    });
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
      name: "New Cashmere Product",
      sku: "JHX-NEW",
      category: "sweaters",
    channel: "both",
    colors: "Ivory / Taupe",
    subtitle: "Premium knitwear piece for refined daily dressing.",
    description: "Describe the product fabric, fit, hand feel, styling occasions, and buyer-facing details.",
    bullets: [
      "Soft hand feel for daily layering",
      "Clean silhouette for work and travel",
      "Easy to pair with coats, trousers, and skirts"
    ],
    material: "Cashmere blend",
    sizeRange: "S / M / L / XL",
    fit: "Regular fit",
    care: "Cold hand wash or dry clean; dry flat",
    occasion: "Daily wear / travel / gifting",
    searchKeywords: "women cashmere sweater, premium knitwear",
    seoDescription: "JINHEXI premium women's knitwear product.",
    price: "$0.00",
    status: "Draft",
    amazonUrl: "",
    amazonLabel: "View on Amazon",
    tone: "ivory",
    image: "assets/products/cashmere-ivory.svg",
    gallery: [
      "assets/products/cashmere-ivory.svg",
      "assets/products/cashmere-sage.svg",
      "assets/products/cashmere-charcoal.svg"
    ]
  });
  renderProducts();
});

document.querySelector("[data-add-post]").addEventListener("click", () => {
  posts = collect("[data-post-list]", posts);
  posts.push({
    title: "New Blog Post",
    date: new Date().toISOString().slice(0, 10),
    slug: "",
    seoTitle: "",
    seoDescription: "",
    excerpt: "Short blog summary for the website.",
    content: "Write the full blog content here."
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

localStorage.removeItem("jhiAdminToken");
