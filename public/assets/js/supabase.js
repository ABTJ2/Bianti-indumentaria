// assets/js/supabase.js
const SUPABASE_URL = "https://khlxidmskfsgdzmggctw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tfFY4GbDOIo5G3hefAYSMQ_Qyi6azRP";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
