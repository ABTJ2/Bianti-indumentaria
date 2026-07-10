(function () {
  const cfg = window.BIANTI_CONFIG || {};
  const url = String(cfg.SUPABASE_URL || "").trim();
  const key = String(cfg.SUPABASE_ANON_KEY || "").trim();
  window.BIANTI = window.BIANTI || {};
  window.BIANTI.WHATSAPP = cfg.WHATSAPP || cfg.WHATSAPP_NUMBER || "";

  if (!window.supabase || !url || !key || key.toLowerCase().includes("service_role")) {
    window.supabaseClient = null;
    window.BIANTI_CONFIG_ERROR = !window.supabase
      ? "No se pudo conectar con el servicio. Intentá nuevamente."
      : "No se pudo cargar la información. Intentá nuevamente.";
    console.error(window.BIANTI_CONFIG_ERROR);
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("#catalogStatus,#globalStatus,#loginStatus").forEach((el) => {
        el.textContent = window.BIANTI_CONFIG_ERROR;
        el.className = "status error";
        el.classList.remove("hidden");
      });
    });
    return;
  }

  window.supabaseClient = window.supabase.createClient(url, key);
})();
