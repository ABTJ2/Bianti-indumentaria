// assets/js/admin-core.js
export function getAdmin() {
  try { return JSON.parse(localStorage.getItem("bianti_admin") || "null"); }
  catch { return null; }
}

export function requireAdmin() {
  const admin = getAdmin();
  if (!admin) {
    location.href = "./login.html";
    throw new Error("No autorizado");
  }
  return admin;
}

export function logout() {
  localStorage.removeItem("bianti_admin");
  location.href = "./login.html";
}

export function catalogLink() {
  return new URL("../index.html#catalogo", location.href).href;
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

// Sidebar injector (usado por ventas.html, estadisticas.html, etc.)
export async function injectSidebar() {
  const host = document.getElementById("sidebar-host") || document.getElementById("sidebar");
  if (!host) return;
  const res = await fetch("./_sidebar.html");
  host.innerHTML = await res.text();

  initSidebar();

  const btn = document.getElementById("btnLogout");
  if (btn) btn.addEventListener("click", logout);
}

export function initSidebar() {
  const pageAliases = {
    "nuevo-producto.html": "productos.html",
  };
  const rawPage = location.pathname.split("/").pop() || "dashboard.html";
  const currentPage = pageAliases[rawPage] || rawPage;
  document.querySelectorAll(".sideLink").forEach((link) => {
    const page = link.dataset.page || link.getAttribute("href")?.split("/").pop();
    const isActive = page === currentPage;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const collapsed = localStorage.getItem("bianti_sidebar_collapsed") === "1";
  document.body.classList.toggle("sidebarCollapsed", collapsed);

  const btn = document.getElementById("btnSidebarCollapse");
  if (!btn) return;
  btn.setAttribute("aria-expanded", String(!collapsed));
  btn.addEventListener("click", () => {
    const next = !document.body.classList.contains("sidebarCollapsed");
    document.body.classList.toggle("sidebarCollapsed", next);
    localStorage.setItem("bianti_sidebar_collapsed", next ? "1" : "0");
    btn.setAttribute("aria-expanded", String(!next));
  });
}
