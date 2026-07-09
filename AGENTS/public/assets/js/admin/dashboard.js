const sb = window.supabaseClient;

async function count(table){
  const { count, error } = await sb.from(table).select("*", { count:"exact", head:true });
  if (error) throw error;
  return count || 0;
}

async function ventasHoy(){
  const today = new Date().toISOString().slice(0,10);
  const { data, error } = await sb.from("ventas").select("total").eq("fecha", today);
  if (error) throw error;
  return (data||[]).reduce((a,r)=>a+Number(r.total||0),0);
}

function moneyARS(v){
  try { return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(v); }
  catch { return `$${v}`; }
}

(async function(){
  try{
    const [p,c,v] = await Promise.all([count("productos"),count("categorias"),count("variantes")]);
    const kProd = document.getElementById("kProd") || document.getElementById("kpi_prod");
    const kCat = document.getElementById("kCat") || document.getElementById("kpi_cat");
    const kVar = document.getElementById("kVar") || document.getElementById("kpi_var");
    const kHoy = document.getElementById("kHoy") || document.getElementById("kpi_ventas");
    if (kProd) kProd.textContent = p;
    if (kCat) kCat.textContent = c;
    if (kVar) kVar.textContent = v;
    if (kHoy) kHoy.textContent = moneyARS(await ventasHoy());
  }catch(err){ console.error(err); }
})();