(function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const siteMenu = document.querySelector("#site-menu");
  if (!menuToggle || !siteMenu) return;

  const mobileQuery = window.matchMedia("(max-width: 860px)");
  let menuOpen = false;

  const syncMenu = () => {
    if (mobileQuery.matches) {
      menuToggle.hidden = false;
      siteMenu.hidden = !menuOpen;
      siteMenu.classList.toggle("is-open", menuOpen);
      menuToggle.setAttribute("aria-expanded", String(menuOpen));
      siteMenu.setAttribute("aria-hidden", String(!menuOpen));
      return;
    }

    menuOpen = false;
    menuToggle.hidden = true;
    siteMenu.hidden = false;
    siteMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    siteMenu.removeAttribute("aria-hidden");
  };

  menuToggle.addEventListener("click", () => {
    menuOpen = !menuOpen;
    syncMenu();
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (!mobileQuery.matches) return;
      menuOpen = false;
      syncMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!mobileQuery.matches || !menuOpen) return;
    if (siteMenu.contains(event.target) || menuToggle.contains(event.target)) return;
    menuOpen = false;
    syncMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileQuery.matches && menuOpen) {
      menuOpen = false;
      syncMenu();
    }
  });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", syncMenu);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(syncMenu);
  }

  syncMenu();
})();

/* ============ GOOGLE ANALYTICS 4 (replace with your real Measurement ID) ============ */
(function () {
  var GA_ID = "G-XXXXXXXXXX"; /* TODO: paste your GA4 Measurement ID, e.g. G-ABC123XYZ */
  if (!GA_ID || GA_ID.indexOf("XXXX") !== -1) return; /* inactive until a real ID is set */
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: true });
})();

/* ============ GOOGLE SEARCH CONSOLE verification (replace with your token) ============ */
(function () {
  var TOKEN = ""; /* TODO: paste your google-site-verification content value, e.g. abc123... */
  if (!TOKEN) return; /* inactive until a real token is set */
  var m = document.createElement("meta");
  m.name = "google-site-verification";
  m.content = TOKEN;
  document.head.appendChild(m);
})();
