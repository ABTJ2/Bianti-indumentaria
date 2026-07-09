<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\CategoriaModel;
use App\Models\EventoModel;
use App\Models\ProductoModel;

final class Catalogo extends Controller
{
    public function index(): void
    {
        $catModel = new CategoriaModel();
        $prodModel = new ProductoModel();
        $eventModel = new EventoModel();

        $categorias = $catModel->normalize($catModel->ordered(true));
        $productos = $prodModel->catalogo([]);
        $topIds = array_keys($eventModel->topProducts('view_product', 6));
        $destacados = [];
        foreach ($topIds as $id) {
            foreach ($productos as $p) if ((string)$p['id'] === (string)$id) $destacados[] = $p;
        }
        if (!$destacados) $destacados = array_slice($productos, 0, 6);
        $ofertas = array_values(array_filter($productos, fn($p) => !empty($p['oferta_descuento']) || ((float)($p['precio_venta'] ?? 0) > 0 && (float)($p['precio_venta'] ?? 0) < (float)($p['precio'] ?? 0))));

        $talles = [];
        $tallesPorCategoria = [];
        foreach ($productos as $p) {
            $ptalles = array_values(array_filter($p['talles'] ?? []));
            foreach ($ptalles as $t) $talles[] = $t;
            foreach (($p['categorias_ids'] ?? []) as $cid) {
                $key = (string)$cid;
                if (!isset($tallesPorCategoria[$key])) $tallesPorCategoria[$key] = [];
                $tallesPorCategoria[$key] = array_merge($tallesPorCategoria[$key], $ptalles);
            }
        }
        $talles = array_values(array_unique($talles));
        sort($talles, SORT_NATURAL | SORT_FLAG_CASE);
        foreach ($tallesPorCategoria as $cid => $vals) {
            $vals = array_values(array_unique(array_filter($vals)));
            sort($vals, SORT_NATURAL | SORT_FLAG_CASE);
            $tallesPorCategoria[$cid] = $vals;
        }

        $this->view('catalogo/index', compact('categorias', 'destacados', 'ofertas', 'talles', 'tallesPorCategoria'), 'layouts/public');
    }

    public function categoria(int $id): void
    {
        $_GET['categoria'] = $id;
        $this->index();
    }
}
