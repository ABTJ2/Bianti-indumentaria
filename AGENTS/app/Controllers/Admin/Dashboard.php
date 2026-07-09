<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\EventoModel;
use App\Models\PedidoModel;
use App\Models\ProductoModel;

final class Dashboard extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        $productos = (new ProductoModel())->admin([]);
        $eventos = (new EventoModel())->recent(1000);
        $pedidos = (new PedidoModel())->recent();
        $stats = [
            'productos' => count($productos),
            'visibles' => count(array_filter($productos, fn($p) => !empty($p['visible']))),
            'consultas' => count(array_filter($eventos, fn($e) => ($e['type'] ?? '') === 'click_whatsapp')),
            'pedidos' => count($pedidos),
        ];
        $this->view('admin/dashboard/index', compact('stats', 'productos', 'eventos'), 'layouts/admin');
    }
}
