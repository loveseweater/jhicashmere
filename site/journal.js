const i18n = window.JINHEXI_I18N || { locale: "en", t: (key) => key };

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
      <a class="post-link" href="/journal.html?post=${slug}">${escapeHtml(i18n.t("readMore"))}</a>
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
      <a class="post-link" href="/journal.html">${escapeHtml(i18n.t("backToPosts"))}</a>
    </article>
  `;
  document.title = post.seoTitle || `${post.title} | JINHEXI Journal`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.content = post.seoDescription || post.excerpt || "";
  }
}

function applyLocale() {
  document.documentElement.lang = i18n.locale === "zh" ? "zh-CN" : "en";
  const home = document.querySelector("[data-nav-home]");
  const catalog = document.querySelector("[data-nav-catalog]");
  const social = document.querySelector("[data-nav-social]");
  const back = document.querySelector("[data-back-link]");
  if (home) home.textContent = i18n.locale === "zh" ? "首页" : "Home";
  if (catalog) catalog.textContent = i18n.t("catalog");
  if (social) social.textContent = i18n.t("social");
  if (back) back.textContent = i18n.t("backToHome");
  const eyebrow = document.querySelector("[data-journal-eyebrow]");
  const heading = document.querySelector("[data-journal-heading]");
  const intro = document.querySelector("[data-journal-intro]");
  if (eyebrow) eyebrow.textContent = i18n.t("journal");
  if (heading) heading.textContent = i18n.locale === "zh"
    ? "用于羊绒内容、护理和 SEO 的博文。"
    : "SEO articles for premium cashmere knitwear.";
  if (intro) intro.textContent = i18n.t("journalIntro");
}

async function init() {
  applyLocale();
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
