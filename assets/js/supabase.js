// assets/js/supabase.js
const SUPABASE_URL = "https://ptleunsqwhsndauiaxex.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RaQK8PBVnfiwXq-Du3bDRg_KLtdhMVc";

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
