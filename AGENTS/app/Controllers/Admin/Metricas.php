<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\EventoModel;
use App\Models\ProductoModel;
final class Metricas extends Controller
{
  public function index(): void { $this->requireAuth(); $eventos=(new EventoModel())->recent(3000); $productos=(new ProductoModel())->admin([]); $this->view('admin/metricas/index', compact('eventos','productos'), 'layouts/admin'); }
}
