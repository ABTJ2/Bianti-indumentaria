<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\PedidoModel;
final class Pedidos extends Controller
{
  public function index(): void { $this->requireAuth(); $pedidos=(new PedidoModel())->recent(); $this->view('admin/pedidos/index', compact('pedidos'), 'layouts/admin'); }
  public function estado(int $id): void { $this->requireAuth(); check_csrf(); $estado=(string)($_POST['estado']??'en_revision'); try{(new PedidoModel())->setEstado($id,$estado); $_SESSION['flash_ok']='Pedido actualizado.';}catch(\Throwable $e){$_SESSION['flash_error']='No se pudo actualizar: '.$e->getMessage();} redirect_to('admin/pedidos'); }
  public function eliminar(int $id): void { $this->requireAuth(); check_csrf(); try{(new PedidoModel())->deleteById($id); $_SESSION['flash_ok']='Pedido eliminado definitivamente.';}catch(\Throwable $e){$_SESSION['flash_error']='No se pudo eliminar: '.$e->getMessage();} redirect_to('admin/pedidos'); }
}
