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
    document.getElementById("kpi_prod").textContent = p;
    document.getElementById("kpi_cat").textContent = c;
    document.getElementById("kpi_var").textContent = v;
    document.getElementById("kpi_ventas").textContent = moneyARS(await ventasHoy());
  }catch(err){ console.error(err); }
})();