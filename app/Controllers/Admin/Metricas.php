<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\EventoModel;
use App\Models\ProductoModel;
final class Metricas extends Controller
{
  public function index(): void { $this->requireAuth(); $eventModel=new EventoModel(); $eventos=$eventModel->recent(3000); $productos=(new ProductoModel())->admin([]); $existingIds=array_map(fn($p)=>(string)$p['id'],$productos); $orphanCount=count($eventModel->orphanProductEventIds($existingIds)); $this->view('admin/metricas/index', compact('eventos','productos','orphanCount'), 'layouts/admin'); }
  public function limpiarHuerfanas(): void { $this->requireAuth(); check_csrf(); try{$productos=(new ProductoModel())->admin([]); $existingIds=array_map(fn($p)=>(string)$p['id'],$productos); $deleted=(new EventoModel())->deleteOrphans($existingIds); $_SESSION['flash_ok']='Se limpiaron '.$deleted.' eventos huérfanos.';}catch(\Throwable $e){$_SESSION['flash_error']='No se pudieron limpiar métricas: '.$e->getMessage();} redirect_to('admin/metricas'); }
}
