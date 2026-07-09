<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\ProductoModel;
use App\Models\VentaModel;
use App\Models\PedidoModel;
final class Contabilidad extends Controller
{
  public function index(): void { $this->requireAuth(); $productos=(new ProductoModel())->admin([]); $ventaModel=new VentaModel(); $ventas=$ventaModel->ventas(); $manuales=$ventaModel->manuales(); $pedidos=(new PedidoModel())->recent(); $this->view('admin/contabilidad/index', compact('productos','ventas','manuales','pedidos'), 'layouts/admin'); }
}
