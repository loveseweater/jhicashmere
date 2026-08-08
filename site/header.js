(function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const siteMenu = document.querySelector("#site-menu");
  if (!menuToggle || !siteMenu) return;

  const closeMenu = () => {
    siteMenu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    siteMenu.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
  };

  menuToggle.addEventListener("click", () => {
    if (siteMenu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (siteMenu.hidden) return;
    if (siteMenu.contains(event.target) || menuToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !siteMenu.hidden) closeMenu();
  });

  siteMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
})();
