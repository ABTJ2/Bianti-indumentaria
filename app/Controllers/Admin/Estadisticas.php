<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Core\Performance;
use App\Models\CategoriaModel;
use App\Models\EventoModel;
use App\Models\ProductoModel;

final class Estadisticas extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $requestStart = microtime(true);
        $start = microtime(true);
        $productos = (new ProductoModel())->metricRows(200);
        Performance::measure('admin estadisticas productos livianos', $start);
        $catModel = new CategoriaModel();
        $start = microtime(true);
        $categorias = $catModel->normalize($catModel->ordered(false));
        Performance::measure('admin estadisticas categorias', $start);
        $start = microtime(true);
        $eventos = (new EventoModel())->recent(600);
        Performance::measure('admin estadisticas eventos', $start);
        Performance::measure('admin estadisticas total', $requestStart);
        $this->view('admin/estadisticas/index', compact('productos', 'categorias', 'eventos'), 'layouts/admin');
    }

    public function resetear(): void
    {
        $this->requireAuth();
        check_csrf();
        try {
            $deleted = (new EventoModel())->resetCatalogMetrics();
            $_SESSION['flash_ok'] = 'Las estadísticas fueron reseteadas correctamente. Eventos eliminados: ' . $deleted . '.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudieron resetear las estadísticas: ' . $e->getMessage();
        }
        redirect_to('admin/estadisticas');
    }
}
