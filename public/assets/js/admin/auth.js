const sb = window.supabaseClient;
const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const u = document.getElementById("user").value.trim();
  const p = document.getElementById("pass").value.trim();

  const { data, error } = await sb
    .from("usuarios")
    .select("id,username,rol,activo")
    .eq("username", u)
    .eq("password", p)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    console.error(error);
    msg.textContent = "Error conectando con Supabase.";
    return;
  }
  if (!data) {
    msg.textContent = "Usuario o contraseña incorrectos.";
    return;
  }

  localStorage.setItem("bianti_admin", JSON.stringify(data));
  location.href = "./dashboard.html";
});
