<section class="page-head"><h1>Importar productos</h1><p>Importador masivo con vista previa, validación y carga por ZIP + CSV.</p></section>
<div class="panel">
  <div class="drop">
    <div class="row" style="align-items:center;justify-content:space-between;gap:14px;display:flex;flex-wrap:wrap">
      <div><div style="font-weight:900">Archivo ZIP</div><div class="muted">Debe incluir un archivo <b>.csv</b> y las imágenes dentro del ZIP.</div></div>
      <input id="zipFile" type="file" accept=".zip,application/zip" />
    </div>
    <div class="muted" style="margin-top:10px;">Estructura esperada: <b>productos_bianti_carga_masiva.csv</b> + carpeta <b>fotos_renombradas/</b>.</div>
  </div>
  <div class="row msg" style="justify-content:space-between;align-items:center;gap:10px;display:flex;flex-wrap:wrap;margin-top:14px">
    <div id="status" class="muted"></div><div class="row" style="gap:10px;display:flex"><button class="btn" id="btnLimpiar" type="button">Limpiar</button><button class="btn primary" id="btnImportar" type="button" disabled>Importar</button></div>
  </div>
</div>
<div id="summaryPanel" class="panel" style="margin-top:14px;display:none;"><div class="kpi-grid"><div class="kpi"><strong id="countValidos">0</strong><span>Listos para importar</span></div><div class="kpi"><strong id="countErrores">0</strong><span>Con errores</span></div><div class="kpi"><strong id="countOmitidos">0</strong><span>Omitidos</span></div><div class="kpi"><strong id="countImagenes">0</strong><span>Imágenes encontradas</span></div></div></div>
<div id="previewPanel" class="panel" style="margin-top:14px;display:none;"><div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:12px;"><div><div style="font-weight:900">Vista previa</div><div id="csvInfo" class="muted"></div></div><div class="muted">Revisá errores antes de importar.</div></div><div class="tableWrap table-responsive"><table class="table admin-table" id="previewTable"></table></div></div>
<div id="resultPanel" class="panel" style="margin-top:14px;display:none;"><div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px;"><div style="font-weight:900;">Resultado final</div><button class="btn" id="btnDescargarErrores" type="button" style="display:none;">Descargar errores CSV</button></div><div id="resultSummary" class="muted"></div><div id="resultErrors" class="list" style="margin-top:12px;"></div></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
<script src="<?= asset_url('js/supabase.js') ?>"></script>
<script type="module" src="<?= asset_url('js/admin/importar-productos.js') ?>"></script>
