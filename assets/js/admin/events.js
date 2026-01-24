// assets/js/admin/events.js
const sb = window.supabaseClient;

if (!sb) {
  console.error("❌ No existe window.supabaseClient. Revisá assets/js/supabase.js");
}

export async function trackEvent(type, payload = {}, producto_id = null, canal = "admin") {
  try {
    const { error } = await sb.from("eventos").insert([{
      type,
      payload,
      producto_id,
      canal,
      created_at: new Date().toISOString(),
    }]);

    if (error) console.error("❌ trackEvent:", error);
  } catch (e) {
    console.error("🔥 trackEvent fallo:", e);
  }
}
