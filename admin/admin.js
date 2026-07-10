(async function () {
  const sb = window.supabaseClient;
  const ui = window.BiantiUI;
  const helpers = window.BiantiHelpers;
  const modules = window.BiantiAdminModules = window.BiantiAdminModules || {};
  const state = { productos: [], categorias: [], rels: [], talles: [], fotos: [], pedidos: [], eventos: [], ventas: [], ventasManuales: [] };
  const loadedScripts = new Set();
  const tokenKey = "bianti_admin_token";
  const sidebarKey = "bianti_sidebar_collapsed";
  const moduleMap = {
    dashboard: "dashboard",
    productos: "productos",
    importar: "importar",
    categorias: "categorias",
    pedidos: "pedidos",
    ofertas: "ofertas",
    metricas: "metricas",
    estadisticas: "estadisticas",
    contabilidad: "contabilidad"
  };

  const sectionLabels = {
    dashboard: "Panel principal",
    productos: "Productos",
    importar: "Importar productos",
    categorias: "Categorías",
    pedidos: "Pedidos",
    ofertas: "Ofertas",
    metricas: "Métricas",
    estadisticas: "Estadísticas",
    contabilidad: "Contabilidad"
  };

  const byId = (id) => document.getElementById(id);
  const content = byId("adminContent");
  const loader = byId("moduleLoader");
  const globalStatus = byId("globalStatus");
  const layout = document.querySelector(".admin-layout");
  const validation = document.createElement("div");
  validation.className = "admin-session-check";
  validation.textContent = "Verificando sesión...";
  layout.style.visibility = "hidden";
  document.body.appendChild(validation);

  function setGlobal(message, type = "") {
    globalStatus.textContent = message;
    globalStatus.className = `status ${type}`.trim();
    globalStatus.classList.toggle("hidden", !message);
  }

  async function requireAdmin() {
    const token = sessionStorage.getItem(tokenKey);
    if (!token) { location.href = "../login/"; return false; }
    if (!sb) {
      sessionStorage.removeItem(tokenKey);
      location.href = "../login/";
      return false;
    }
    const { data, error } = await sb.rpc("validar_sesion_admin", { p_token: token });
    if (error || data?.authenticated !== true) {
      if (error) console.error(error);
      sessionStorage.removeItem(tokenKey);
      location.href = "../login/";
      return false;
    }
    return true;
  }

  function bindLayout() {
    const sidebar = byId("sidebar");
    const scrim = byId("scrim");
    const hamb = byId("hamb");
    const sideToggle = byId("sidebarToggle");
    const topToggle = byId("topSidebarToggle");
    const desktopQuery = window.matchMedia("(min-width: 901px)");

    const close = () => {
      sidebar.classList.remove("open");
      scrim.classList.remove("show");
      document.body.classList.remove("drawer-open");
    };

    const applyCollapsed = (collapsed) => {
      document.body.classList.toggle("sidebar-collapsed", collapsed && desktopQuery.matches);
      [sideToggle, topToggle].forEach((btn) => {
        if (!btn) return;
        btn.setAttribute("aria-label", collapsed ? "Expandir menú" : "Contraer menú");
        btn.title = collapsed ? "Expandir menú" : "Contraer menú";
      });
    };

    const stored = localStorage.getItem(sidebarKey) === "1";
    applyCollapsed(stored);

    const toggleCollapsed = () => {
      if (!desktopQuery.matches) return;
      const next = !document.body.classList.contains("sidebar-collapsed");
      localStorage.setItem(sidebarKey, next ? "1" : "0");
      applyCollapsed(next);
    };

    hamb.addEventListener("click", () => {
      sidebar.classList.add("open");
      scrim.classList.add("show");
      document.body.classList.add("drawer-open");
    });
    sideToggle.addEventListener("click", toggleCollapsed);
    topToggle.addEventListener("click", toggleCollapsed);
    scrim.addEventListener("click", close);
    desktopQuery.addEventListener("change", () => applyCollapsed(localStorage.getItem(sidebarKey) === "1"));

    byId("sideNav").addEventListener("click", (event) => {
      const btn = event.target.closest(".sideLink[data-section]");
      if (!btn) return;
      openModule(btn.dataset.section);
      close();
    });
    byId("btnLogout").addEventListener("click", async () => {
      const token = sessionStorage.getItem(tokenKey);
      try { if (token && sb) await sb.rpc("logout_admin", { p_token: token }); } catch (error) { console.warn(error?.message || error); }
      sessionStorage.removeItem(tokenKey);
      location.href = "../login/";
    });
  }

  async function loadScriptOnce(src) {
    if (loadedScripts.has(src)) return;
    await helpers.loadScript(src);
    loadedScripts.add(src);
  }

  async function openModule(name) {
    const moduleName = moduleMap[name] || "dashboard";
    const base = `../modules/${moduleName}/${moduleName}`;
    document.querySelectorAll(".sideLink[data-section]").forEach((el) => el.classList.toggle("active", el.dataset.section === moduleName));
    byId("topSectionName").textContent = sectionLabels[moduleName] || "Administración";
    location.hash = moduleName;
    loader.classList.remove("hidden");
    content.innerHTML = "";
    try {
      const response = await fetch(`${base}.html`, { cache: "no-store" });
      if (!response.ok) throw new Error(`No se pudo cargar ${moduleName}.html`);
      content.innerHTML = await response.text();
      await loadScriptOnce(`${base}.js`);
      const mod = modules[moduleName];
      if (!mod?.init) throw new Error(`El módulo ${moduleName} no expone init().`);
      await mod.init({ root: content, sb, ui, helpers, state, go: openModule });
      setGlobal("");
    } catch (error) {
      console.error(error);
      setGlobal(error.message || "No se pudo cargar el módulo.", "error");
      content.innerHTML = helpers.empty("No se pudo cargar este módulo.");
    } finally {
      loader.classList.add("hidden");
    }
  }

  if (!await requireAdmin()) return;
  validation.remove();
  layout.style.visibility = "";
  bindLayout();
  await openModule((location.hash || "#dashboard").replace("#", ""));
})();
