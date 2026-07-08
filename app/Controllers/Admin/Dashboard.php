<?php
namespace App\Controllers\Admin;

use App\Core\Performance;
use App\Core\Controller;
use App\Models\EventoModel;
use App\Models\PedidoModel;
use App\Models\ProductoModel;

final class Dashboard extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $start = microtime(true);
        $productModel = new ProductoModel();
        $productos = $productModel->admin(['limit' => 120]);
        $stockAlerts = $productModel->lowStockProducts(12);
        $hasStock = !empty($productModel->stockColumns());
        $eventos = (new EventoModel())->recent(600);
        $pedidos = (new PedidoModel())->recent();
        $stats = [
            'productos' => count($productos),
            'visibles' => count(array_filter($productos, fn($p) => !empty($p['visible']))),
            'pedidos' => count($pedidos),
        ];
        Performance::measure('admin dashboard controlador total', $start);
        $this->view('admin/dashboard/index', compact('stats', 'productos', 'eventos', 'pedidos', 'stockAlerts', 'hasStock'), 'layouts/admin');
    }
}
