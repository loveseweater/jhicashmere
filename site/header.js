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
