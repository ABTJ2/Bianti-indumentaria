<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\CategoriaModel;
use App\Models\EventoModel;
use App\Models\ProductoModel;

final class Estadisticas extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $productos = (new ProductoModel())->admin(['limit' => 120]);
        $catModel = new CategoriaModel();
        $categorias = $catModel->normalize($catModel->ordered(false));
        $eventos = (new EventoModel())->recent(1000);
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
