<section class="page-head"><h1>Importar productos</h1><p>Importador masivo con vista previa, validación y carga por ZIP + CSV.</p></section>
<div class="panel">
  <div class="drop">
    <div class="import-row">
      <div><div><strong>Archivo ZIP</strong></div><div class="muted">Debe incluir un archivo <b>.csv</b> y las imágenes dentro del ZIP.</div></div>
      <input id="zipFile" type="file" accept=".zip,application/zip" />
    </div>
    <div class="muted">Estructura esperada: <b>productos_bianti_carga_masiva.csv</b> + carpeta <b>fotos_renombradas/</b>.</div>
  </div>
  <div class="import-actions msg">
    <div id="status" class="muted"></div><div class="import-buttons"><button class="btn" id="btnLimpiar" type="button">Limpiar</button><button class="btn primary" id="btnImportar" type="button" disabled>Importar</button></div>
  </div>
</div>
<div id="summaryPanel" class="panel" hidden><div class="kpi-grid"><div class="kpi"><strong id="countValidos">0</strong><span>Listos para importar</span></div><div class="kpi"><strong id="countErrores">0</strong><span>Con errores</span></div><div class="kpi"><strong id="countOmitidos">0</strong><span>Omitidos</span></div><div class="kpi"><strong id="countImagenes">0</strong><span>Imágenes encontradas</span></div></div></div>
<div id="previewPanel" class="panel" hidden><div class="panel-title-row"><div><strong>Vista previa</strong><div id="csvInfo" class="muted"></div></div><div class="muted">Revisá errores antes de importar.</div></div><div class="tableWrap table-responsive"><table class="table admin-table" id="previewTable"></table></div></div>
<div id="resultPanel" class="panel" hidden><div class="panel-title-row"><strong>Resultado final</strong><button class="btn" id="btnDescargarErrores" type="button" hidden>Descargar errores CSV</button></div><div id="resultSummary" class="muted"></div><div id="resultErrors" class="list"></div></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
<script src="<?= asset_url('js/supabase.js') ?>"></script>
<script type="module" src="<?= asset_url('js/admin/importar-productos.js') ?>"></script>
