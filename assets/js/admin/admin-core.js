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
  return `${location.origin}/index.html#catalogo`;
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}
