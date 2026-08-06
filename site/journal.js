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

function postTemplate(post) {
  const slug = encodeURIComponent(post.slug || post.id || post.title || "");
  return `
    <article class="post-item featured">
      <div>
        <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <p class="post-body">${escapeHtml(post.content)}</p>
      </div>
      <a class="post-link" href="/journal.html?post=${slug}">Read more</a>
    </article>
  `;
}

function renderSinglePost(post) {
  const container = document.querySelector("[data-posts]");
  if (!container) return;
  container.innerHTML = `
    <article class="post-item featured">
      <div>
        <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <p class="post-body">${escapeHtml(post.content)}</p>
      </div>
      <a class="post-link" href="/journal.html">Back to all posts</a>
    </article>
  `;
  document.title = post.seoTitle || `${post.title} | JINHEXI Journal`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.content = post.seoDescription || post.excerpt || "";
  }
}

async function init() {
  const posts = await loadJson("/api/posts", []);
  const params = new URLSearchParams(location.search);
  const target = params.get("post");
  const container = document.querySelector("[data-posts]");
  if (!container) return;
  if (target) {
    const post = posts.find((item) => (item.slug || item.id) === target);
    if (post) {
      renderSinglePost(post);
      return;
    }
  }
  container.innerHTML = posts.map(postTemplate).join("");
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
