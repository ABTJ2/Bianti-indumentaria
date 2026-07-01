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
    "editar-producto.html": "productos.html",
    "importar-productos.html": "importar-productos.html",
  };

  const rawPage = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  const currentPage = pageAliases[rawPage] || rawPage;

  let activated = false;
  document.querySelectorAll(".sideLink").forEach((link) => {
    const hrefPage = (link.getAttribute("href") || "").split("/").pop().split(/[?#]/)[0].toLowerCase();
    const dataPage = (link.dataset.page || hrefPage || "").toLowerCase();
    const page = pageAliases[dataPage] || dataPage;
    const isActive = !activated && page === currentPage;

    link.classList.toggle("active", isActive);
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
      activated = true;
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const collapsed = localStorage.getItem("bianti_sidebar_collapsed") === "1";
  document.body.classList.toggle("sidebarCollapsed", collapsed);

  const btn = document.getElementById("btnSidebarCollapse");
  if (!btn) return;
  btn.setAttribute("aria-expanded", String(!collapsed));
  btn.onclick = () => {
    const next = !document.body.classList.contains("sidebarCollapsed");
    document.body.classList.toggle("sidebarCollapsed", next);
    localStorage.setItem("bianti_sidebar_collapsed", next ? "1" : "0");
    btn.setAttribute("aria-expanded", String(!next));
  };
}

export function showToast(message, type = "info") {
  let host = document.getElementById("adminToastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "adminToastHost";
    host.className = "toastHost";
    document.body.appendChild(host);
  }

  const toast = document.createElement("div");
  toast.className = `adminToast ${type}`;
  toast.textContent = message;
  host.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("leaving");
    window.setTimeout(() => toast.remove(), 220);
  }, 2800);
}

export function confirmDialog({
  title = "Confirmar acción",
  message = "¿Querés continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modalOverlay systemModalOverlay";
    overlay.setAttribute("aria-hidden", "false");

    overlay.innerHTML = `
      <div class="modal systemModal" role="dialog" aria-modal="true">
        <div class="systemModalIcon ${danger ? "danger" : ""}">${danger ? "!" : "i"}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="row systemModalActions">
          <button class="btn" type="button" data-cancel>${escapeHtml(cancelText)}</button>
          <button class="btn ${danger ? "danger" : "primary"}" type="button" data-confirm>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      resolve(value);
    };
    const onKey = (event) => {
      if (event.key === "Escape") close(false);
      if (event.key === "Enter") close(true);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-cancel]")) close(false);
      if (event.target.closest("[data-confirm]")) close(true);
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    overlay.querySelector("[data-confirm]")?.focus();
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  }[ch]));
}
