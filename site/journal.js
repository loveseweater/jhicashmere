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

async function trackPageview() {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location.pathname + location.search })
    });
  } catch {
    return null;
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

function postImage(post) {
  return post.image || "assets/jni-cashmere-hero.png";
}

function postTemplate(post, index = 0) {
  const slug = encodeURIComponent(post.slug || post.id || post.title || "");
  const leadClass = index === 0 ? " lead" : "";
  return `
    <article class="post-item featured${leadClass}">
      <a class="post-media" href="journal.html?post=${slug}" aria-label="${escapeHtml(post.title)}">
        <img class="post-image" src="${escapeHtml(postImage(post))}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="lazy" decoding="async" />
      </a>
      <div class="post-copy">
        <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <p class="post-body">${escapeHtml(post.content)}</p>
      </div>
      <a class="post-link" href="journal.html?post=${slug}">${escapeHtml(i18n.t("readMore"))}</a>
    </article>
  `;
}

function renderSinglePost(post, allPosts = []) {
  const container = document.querySelector("[data-posts]");
  if (!container) return;
  const relatedPosts = allPosts
    .filter((item) => (item.slug || item.id) !== (post.slug || post.id))
    .slice(0, 3)
    .map((item) => {
      const slug = encodeURIComponent(item.slug || item.id || "");
      return `
        <article class="post-item featured">
          <a class="post-media" href="journal.html?post=${slug}" aria-label="${escapeHtml(item.title)}">
            <img class="post-image" src="${escapeHtml(postImage(item))}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy" decoding="async" />
          </a>
          <div class="post-copy">
            <time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.excerpt)}</p>
          </div>
          <a class="post-link" href="journal.html?post=${slug}">${escapeHtml(i18n.t("readMore"))}</a>
        </article>
      `;
    })
    .join("");
  container.innerHTML = `
    <article class="post-item featured post-single">
      <a class="post-media" href="journal.html" aria-label="${escapeHtml(post.title)}">
        <img class="post-image" src="${escapeHtml(postImage(post))}" alt="${escapeHtml(post.imageAlt || post.title)}" loading="eager" fetchpriority="high" decoding="async" />
      </a>
      <div class="post-copy">
        <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <p class="post-body">${escapeHtml(post.content)}</p>
      </div>
      <a class="post-link" href="journal.html">${escapeHtml(i18n.t("backToPosts"))}</a>
    </article>
    <section class="section related-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${escapeHtml(i18n.t("relatedPosts"))}</p>
          <h2>${escapeHtml(i18n.t("moreReading"))}</h2>
        </div>
        <p class="section-note">${escapeHtml(i18n.t("relatedPostsNote"))}</p>
      </div>
      <div class="post-grid">
        ${relatedPosts}
      </div>
    </section>
  `;
  document.title = post.seoTitle || `${post.title} | JINHEXI Journal`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) {
    meta.content = post.seoDescription || post.excerpt || "";
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = `https://jhicashmere.com/journal.html?post=${encodeURIComponent(post.slug || post.id || "")}`;
  }
}

function applyLocale() {
  document.documentElement.lang = "en";
  const home = document.querySelector("[data-nav-home]");
  const catalog = document.querySelector("[data-nav-catalog]");
  const contact = document.querySelector("[data-nav-contact]");
  const back = document.querySelector("[data-back-link]");
  if (home) home.textContent = "Home";
  if (catalog) catalog.textContent = i18n.t("catalog");
  if (contact) contact.textContent = i18n.t("contactEyebrow");
  if (back) back.textContent = i18n.t("backToHome");
  const eyebrow = document.querySelector("[data-journal-eyebrow]");
  const heading = document.querySelector("[data-journal-heading]");
  const intro = document.querySelector("[data-journal-intro]");
  if (eyebrow) eyebrow.textContent = i18n.t("journal");
  if (heading) heading.textContent = "SEO articles for premium cashmere knitwear.";
  if (intro) intro.textContent = i18n.t("journalIntro");
}

async function init() {
  applyLocale();
  const fallback = await loadJson(`${dataPrefix}data/posts.json`, []);
  const posts = await loadJson("/api/posts", fallback);
  const params = new URLSearchParams(location.search);
  const target = params.get("post");
  const container = document.querySelector("[data-posts]");
  if (!container) return;
  if (target) {
    const post = posts.find((item) => (item.slug || item.id) === target);
    if (post) {
      renderSinglePost(post, posts);
      await trackPageview();
      return;
    }
  }
  container.innerHTML = posts.map((post, index) => postTemplate(post, index)).join("");
  await trackPageview();
}

init();
