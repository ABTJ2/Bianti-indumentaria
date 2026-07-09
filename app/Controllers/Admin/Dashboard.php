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
        $requestStart = microtime(true);
        $productModel = new ProductoModel();
        $start = microtime(true);
        $productos = $productModel->dashboardRows(120);
        Performance::measure('admin dashboard productos livianos', $start);
        $stockAlerts = [];
        $hasStock = false;
        $eventos = [];
        $pedidos = [];
        $stats = [
            'productos' => count($productos),
            'visibles' => count(array_filter($productos, fn($p) => !empty($p['visible']))),
            'pedidos' => null,
            'views' => null,
            'wa' => null,
            'topProduct' => null,
            'vendidos' => null,
            'conversion' => null,
            'ingresos' => null,
            'noVendidos' => null,
        ];
        Performance::measure('admin dashboard controlador total', $requestStart);
        $this->view('admin/dashboard/index', compact('stats', 'productos', 'eventos', 'pedidos', 'stockAlerts', 'hasStock'), 'layouts/admin');
    }

    public function resumenActividad(): void
    {
        $this->requireAuth();
        $productModel = new ProductoModel();
        $productos = $productModel->dashboardRows(120);
        $eventModel = new EventoModel();
        $eventos = $eventModel->recent(180);
        $productMap = [];
        foreach ($productos as $p) $productMap[(string)($p['id'] ?? '')] = $p;

        $views = 0;
        $wa = 0;
        $top = [];
        foreach ($eventos as $event) {
            $type = (string)($event['type'] ?? '');
            $productId = $eventModel->productIdFromEvent($event);
            if ($productId === '' || !isset($productMap[$productId])) continue;
            if (in_array($type, ['view_product', 'product_view'], true)) {
                $views++;
                $top[$productId] = ($top[$productId] ?? 0) + 1;
            }
            if (in_array($type, ['click_whatsapp', 'whatsapp_click'], true)) $wa++;
        }
        arsort($top);
        $topId = array_key_first($top);
        $topProduct = $topId ? ($productMap[$topId] ?? null) : null;

        $this->json([
            'topProduct' => $topProduct['titulo'] ?? 'Sin datos',
            'wa' => $wa,
            'conversion' => ($views ? round(($wa / $views) * 100, 1) : 0) . '%',
        ]);
    }

    public function resumenVentas(): void
    {
        $this->requireAuth();
        $pedidos = (new PedidoModel())->recent();
        $vendidos = 0;
        $ingresos = 0;
        $noVendidos = 0;
        foreach ($pedidos as $pedido) {
            $estado = (string)($pedido['estado'] ?? '');
            if ($estado === 'vendido') {
                $vendidos++;
                $ingresos += (float)($pedido['vendido_total'] ?? $pedido['vendido_precio_final'] ?? $pedido['producto_precio'] ?? 0);
            }
            if ($estado === 'no_vendido') $noVendidos++;
        }

        $this->json([
            'pedidos' => count($pedidos),
            'vendidos' => $vendidos,
            'ingresos' => money_ar($ingresos),
            'noVendidos' => $noVendidos,
        ]);
    }
}
