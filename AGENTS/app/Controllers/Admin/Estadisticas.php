<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\CategoriaModel;
use App\Models\ProductoModel;
final class Estadisticas extends Controller
{
  public function index(): void { $this->requireAuth(); $productos=(new ProductoModel())->admin([]); $categorias=(new CategoriaModel())->normalize((new CategoriaModel())->ordered(false)); $this->view('admin/estadisticas/index', compact('productos','categorias'), 'layouts/admin'); }
}
