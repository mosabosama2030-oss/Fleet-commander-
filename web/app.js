(() => {
  "use strict";

  const pageTitles = {
    home: "الرئيسية",
    shift: "الشيفت",
    trips: "الرحلات",
    expenses: "المصروفات",
    reports: "التقارير",
    settings: "الإعدادات",
  };

  const sections = Array.from(document.querySelectorAll("[data-page]"));
  const navigationButtons = Array.from(document.querySelectorAll("[data-page-target]"));
  const pageTitle = document.getElementById("page-title");
  const menuToggle = document.getElementById("menu-toggle");
  const menuBackdrop = document.getElementById("menu-backdrop");
  const networkState = document.getElementById("network-state");
  const networkLabel = document.getElementById("network-label");

  function closeMenu() {
    document.body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    if (menuBackdrop) menuBackdrop.hidden = true;
  }

  function openMenu() {
    document.body.classList.add("menu-open");
    menuToggle?.setAttribute("aria-expanded", "true");
    if (menuBackdrop) menuBackdrop.hidden = false;
  }

  function showPage(pageId) {
    if (!Object.hasOwn(pageTitles, pageId)) return;

    sections.forEach((section) => {
      const active = section.dataset.page === pageId;
      section.classList.toggle("is-visible", active);
      section.hidden = !active;
    });

    navigationButtons.forEach((button) => {
      const active = button.dataset.pageTarget === pageId;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    if (pageTitle) pageTitle.textContent = pageTitles[pageId];
    document.title = `Fleet Commander | ${pageTitles[pageId]}`;
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navigationButtons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.pageTarget));
  });

  menuToggle?.addEventListener("click", () => {
    if (document.body.classList.contains("menu-open")) closeMenu();
    else openMenu();
  });

  menuBackdrop?.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  function updateDeviceConnectivityHint() {
    if (!networkState || !networkLabel) return;
    const deviceOnline = navigator.onLine;
    networkState.dataset.state = deviceOnline ? "online" : "offline";
    networkLabel.textContent = deviceOnline ? "اتصال الجهاز متاح" : "الجهاز غير متصل";
    networkState.title = "مؤشر المتصفح لاتصال الجهاز فقط؛ لا يؤكد اتصال Fleet Commander بالخادم.";
  }

  window.addEventListener("online", updateDeviceConnectivityHint);
  window.addEventListener("offline", updateDeviceConnectivityHint);
  updateDeviceConnectivityHint();

  // No storage, network requests, geolocation, or financial calculations are used in this prototype.
})();