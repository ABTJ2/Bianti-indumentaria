(async function () {
  const sb = window.supabaseClient;
  const form = document.getElementById("loginForm");
  const status = document.getElementById("loginStatus");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const submit = document.getElementById("loginSubmit");
  const togglePassword = document.getElementById("togglePassword");
  const tokenKey = "bianti_admin_token";

  function setStatus(message, type = "") {
    status.textContent = message;
    status.className = `status ${type}`.trim();
    status.classList.toggle("hidden", !message);
  }

  function setLoading(active) {
    submit.disabled = active;
    submit.classList.toggle("is-loading", active);
    submit.querySelector("span")?.replaceChildren(document.createTextNode(active ? "Ingresando..." : "Ingresar"));
  }

  async function redirectIfSessionExists() {
    const token = sessionStorage.getItem(tokenKey);
    if (!sb || !token) return;
    const { data, error } = await sb.rpc("validar_sesion_admin", { p_token: token });
    if (!error && data?.authenticated === true) location.href = "../admin/";
    if (error || data?.authenticated !== true) sessionStorage.removeItem(tokenKey);
  }

  togglePassword.addEventListener("click", () => {
    const visible = passwordInput.type === "text";
    passwordInput.type = visible ? "password" : "text";
    togglePassword.textContent = visible ? "Mostrar" : "Ocultar";
    togglePassword.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
  });

  if (!sb) {
    setStatus("No se pudo iniciar sesión. Intentá nuevamente.", "error");
    submit.disabled = true;
    return;
  }

  await redirectIfSessionExists();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setStatus("Ingresá tu usuario y contraseña.", "error");
      return;
    }

    setLoading(true);
    const { data, error } = await sb.rpc("login_admin", { p_username: username, p_password: password });
    setLoading(false);

    if (error || data?.ok !== true || !data?.token) {
      passwordInput.value = "";
      setStatus("Usuario o contraseña incorrectos.", "error");
      return;
    }

    sessionStorage.setItem(tokenKey, data.token);
    passwordInput.value = "";
    setStatus("Ingreso correcto. Redirigiendo...", "ok");
    location.href = "../admin/";
  });
})();
