let token = localStorage.getItem("jhiAdminToken") || "";
let products = [];
let posts = [];

const loginPanel = document.querySelector("[data-login-panel]");
const workspace = document.querySelector("[data-admin-workspace]");
const statusLine = document.querySelector("[data-status]");

function setStatus(message) {
  statusLine.textContent = message;
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

function field(label, value, key, type = "text") {
  return `
    <label>
      ${label}
      <input type="${type}" data-key="${key}" value="${escapeAttr(value)}" />
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
            ${field("Name", product.name, "name")}
            ${field("Category", product.category, "category")}
            ${field("Colors", product.colors, "colors")}
            ${field("Price", product.price, "price")}
            ${field("Status", product.status, "status")}
            ${field("Color Tone", product.tone, "tone")}
            ${field("Amazon URL", product.amazonUrl, "amazonUrl")}
            ${field("Amazon Button Text", product.amazonLabel, "amazonLabel")}
            ${textarea("Description", product.description, "description")}
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
    localStorage.setItem("jhiAdminToken", token);
    showWorkspace();
    await loadAdminData();
    setStatus("Logged in. Changes save to local JSON files.");
  } catch (error) {
    setStatus(error.message);
  }
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
    name: "New Knitwear Product",
    category: "Women's Sweaters",
    colors: "Ivory / Taupe",
    description: "Describe the product fabric, fit, and occasion.",
    price: "$0.00",
    status: "Draft",
    amazonUrl: "",
    amazonLabel: "View on Amazon",
    tone: "ivory"
  });
  renderProducts();
});

document.querySelector("[data-add-post]").addEventListener("click", () => {
  posts = collect("[data-post-list]", posts);
  posts.push({
    title: "New Blog Post",
    date: new Date().toISOString().slice(0, 10),
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
    setStatus("Products saved.");
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
    setStatus("Blog posts saved.");
  } catch (error) {
    setStatus(error.message);
  }
});

if (token) {
  showWorkspace();
  loadAdminData().catch(() => {
    localStorage.removeItem("jhiAdminToken");
    token = "";
    loginPanel.hidden = false;
    workspace.hidden = true;
  });
}
