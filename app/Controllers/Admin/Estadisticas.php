<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\CategoriaModel;
use App\Models\EventoModel;
use App\Models\ProductoModel;
final class Estadisticas extends Controller
{
  public function index(): void { $this->requireAuth(); $productos=(new ProductoModel())->admin([]); $categorias=(new CategoriaModel())->normalize((new CategoriaModel())->ordered(false)); $eventos=(new EventoModel())->recent(3000); $this->view('admin/estadisticas/index', compact('productos','categorias','eventos'), 'layouts/admin'); }
}
