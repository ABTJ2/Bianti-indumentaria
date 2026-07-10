(function () {
  const html = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[ch]));
  const money = (value) => {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toLocaleString("es-AR", { style: "currency", currency: "ARS" }) : "$0";
  };

  function host(id, className) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      if (className) el.className = className;
      document.body.appendChild(el);
    }
    return el;
  }

  function modal({ title = "BIANTI", message = "", confirmText = "Aceptar", cancelText = "Cancelar", danger = false, hideCancel = false, body = "" } = {}) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "bianti-modal-overlay";
      overlay.innerHTML = `<div class="bianti-modal" role="dialog" aria-modal="true"><div class="modal-brand"><img src="${pathToLogo()}" alt=""><strong>BIANTI INDUMENTARIA</strong></div><h2>${html(title)}</h2>${message ? `<p>${html(message)}</p>` : ""}${body ? `<div class="modal-body">${body}</div>` : ""}<div class="modal-actions">${hideCancel ? "" : `<button class="btn btn-outline" type="button" data-cancel>${html(cancelText)}</button>`}<button class="btn ${danger ? "btn-danger" : "btn-primary"}" type="button" data-ok>${html(confirmText)}</button></div></div>`;
      const close = (value) => { overlay.remove(); document.removeEventListener("keydown", onKey); resolve(value); };
      const onKey = (event) => { if (event.key === "Escape") close(false); if (event.key === "Enter") close(true); };
      overlay.addEventListener("click", (event) => { if (event.target === overlay || event.target.closest("[data-cancel]")) close(false); if (event.target.closest("[data-ok]")) close(true); });
      document.addEventListener("keydown", onKey);
      host("bianti-modal-host").appendChild(overlay);
      overlay.querySelector("[data-ok]")?.focus();
    });
  }

  function notice(title, message, options = {}) { return modal({ title, message, confirmText: options.confirmText || "Entendido", hideCancel: true, danger: !!options.danger }); }
  function toast(message, type = "info") {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;
    host("toast-host", "toast-host").appendChild(item);
    window.setTimeout(() => item.remove(), 3200);
  }
  function empty(message = "Sin datos para mostrar.") { return `<div class="empty">${html(message)}</div>`; }
  function loader(message = "Cargando...") { return `<div class="status">${html(message)}</div>`; }
  function pathToLogo() { return location.pathname.includes("/admin/") || location.pathname.includes("/login/") ? "../assets/img/logo.png" : "./assets/img/logo.png"; }

  window.BiantiUI = { html, esc: html, money, modal, confirm: modal, notice, toast, empty, loader };
})();
