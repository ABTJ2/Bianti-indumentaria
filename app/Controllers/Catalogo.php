<?php
namespace App\Controllers;

use App\Core\Performance;
use App\Core\Controller;
use App\Models\CategoriaModel;
use App\Models\EventoModel;
use App\Models\ProductoModel;
use App\Services\OfferService;

final class Catalogo extends Controller
{
    public function index(): void
    {
        $requestStart = microtime(true);
        Performance::mark('catalogo_request_start');
        $catModel = new CategoriaModel();
        $prodModel = new ProductoModel();
        $eventModel = new EventoModel();

        $start = microtime(true);
        $categorias = $catModel->normalize($catModel->ordered(true));
        Performance::measure('catalogo categorias', $start);

        $start = microtime(true);
        $topIds = array_keys($eventModel->featuredProductScores(8));
        $destacados = $topIds ? $prodModel->summaryByIds($topIds, true, true) : [];
        if (count($destacados) < 8) {
            $seen = array_fill_keys(array_map(fn($p) => (string)($p['id'] ?? ''), $destacados), true);
            foreach ($prodModel->latestVisibleSummary(8, true) as $fallback) {
                $id = (string)($fallback['id'] ?? '');
                if ($id === '' || isset($seen[$id])) continue;
                $destacados[] = $fallback;
                $seen[$id] = true;
                if (count($destacados) >= 8) break;
            }
        }
        $destacados = array_slice($destacados, 0, 8);
        Performance::measure('catalogo destacados', $start);

        $start = microtime(true);
        $offerIds = array_slice(array_keys((new OfferService())->byProduct()), 0, 12);
        $ofertas = $offerIds ? $prodModel->summaryByIds($offerIds, true) : [];
        Performance::measure('catalogo ofertas', $start);

        $start = microtime(true);
        $tallesData = $prodModel->availableTallesByCategory();
        $talles = $tallesData['all'] ?? [];
        $tallesPorCategoria = $tallesData['byCategory'] ?? [];
        Performance::measure('catalogo talles', $start);

        Performance::measure('catalogo controlador total', $requestStart);
        $this->view('catalogo/index', compact('categorias', 'destacados', 'ofertas', 'talles', 'tallesPorCategoria'), 'layouts/public');
    }

    public function categoria(int $id): void
    {
        $_GET['categoria'] = $id;
        $this->index();
    }
}
