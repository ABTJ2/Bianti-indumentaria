<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Performance;
use App\Models\EventoModel;
use App\Models\ProductoModel;

final class Metricas extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $requestStart = microtime(true);
        $eventModel = new EventoModel();
        $productModel = new ProductoModel();
        $start = microtime(true);
        $eventos = $eventModel->recent(600);
        Performance::measure('admin metricas eventos', $start);
        $start = microtime(true);
        $productos = $productModel->metricRows(160);
        Performance::measure('admin metricas productos livianos', $start);
        $start = microtime(true);
        $orphanCount = count($eventModel->orphanProductEventIds($productModel->existingIds()));
        Performance::measure('admin metricas huerfanas', $start);
        Performance::measure('admin metricas total', $requestStart);
        $this->view('admin/metricas/index', compact('eventos', 'productos', 'orphanCount'), 'layouts/admin');
    }

    public function limpiarHuerfanas(): void
    {
        $this->requireAuth();
        check_csrf();
        try {
            $deleted = (new EventoModel())->deleteOrphans((new ProductoModel())->existingIds());
            $_SESSION['flash_ok'] = 'Se limpiaron ' . $deleted . ' eventos huerfanos.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudieron limpiar metricas: ' . $e->getMessage();
        }
        redirect_to('admin/metricas');
    }

    public function resetear(): void
    {
        $this->requireAuth();
        check_csrf();
        try {
            $deleted = (new EventoModel())->resetCatalogMetrics();
            $_SESSION['flash_ok'] = 'Las métricas fueron reseteadas correctamente. Eventos eliminados: ' . $deleted . '.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudieron resetear las métricas: ' . $e->getMessage();
        }
        redirect_to('admin/metricas');
    }
}
