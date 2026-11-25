(() => {
  "use strict";
  const titles = {
    home: "الرئيسية", shift: "الشيفت", trips: "الرحلات",
    expenses: "المصروفات", history: "السجل", reports: "التقارير",
    assistant: "المساعد الشخصي", settings: "الإعدادات والخصوصية"
  };
  const sections = [...document.querySelectorAll("[data-page]")];
  const controls = [...document.querySelectorAll("[data-page-target]")];
  const title = document.getElementById("page-title");
  const sidebar = document.getElementById("sidebar");
  const menu = document.getElementById("menu-toggle");
  const more = document.getElementById("mobile-more");
  const backdrop = document.getElementById("drawer-backdrop");

  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    menu?.setAttribute("aria-expanded", "false");
    more?.setAttribute("aria-expanded", "false");
    if (backdrop) backdrop.hidden = true;
  }
  function openDrawer() {
    document.body.classList.add("drawer-open");
    menu?.setAttribute("aria-expanded", "true");
    more?.setAttribute("aria-expanded", "true");
    if (backdrop) backdrop.hidden = false;
  }
  function showPage(id) {
    if (!Object.hasOwn(titles, id)) return;
    sections.forEach((section) => {
      const active = section.dataset.page === id;
      section.hidden = !active;
      section.classList.toggle("is-visible", active);
    });
    controls.forEach((control) => {
      const active = control.dataset.pageTarget === id;
      control.classList.toggle("is-active", active);
      if (active) control.setAttribute("aria-current", "page");
      else control.removeAttribute("aria-current");
    });
    if (title) title.textContent = titles[id];
    document.title = `Fleet Commander | ${titles[id]}`;
    closeDrawer();
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  controls.forEach((control) => control.addEventListener("click", () => showPage(control.dataset.pageTarget)));
  menu?.addEventListener("click", () => document.body.classList.contains("drawer-open") ? closeDrawer() : openDrawer());
  more?.addEventListener("click", () => document.body.classList.contains("drawer-open") ? closeDrawer() : openDrawer());
  backdrop?.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });
  const network = document.getElementById("network-state");
  const networkLabel = document.getElementById("network-label");
  function updateDeviceHint() {
    if (!network || !networkLabel) return;
    const online = navigator.onLine;
    network.dataset.state = online ? "online" : "offline";
    networkLabel.textContent = online ? "اتصال الجهاز متاح" : "الجهاز غير متصل";
    network.title = "مؤشر المتصفح لاتصال الجهاز فقط؛ لا يؤكد اتصال Fleet Commander بالخادم.";
  }
  window.addEventListener("online", updateDeviceHint);
  window.addEventListener("offline", updateDeviceHint);
  updateDeviceHint();
  // Prototype only: no storage, network requests, geolocation, credentials or financial calculations.
})();