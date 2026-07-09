<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\ProductoModel;
use App\Services\OfferService;
final class Ofertas extends Controller
{
  public function index(): void { $this->requireAuth(); $productos=(new ProductoModel())->admin($_GET); $offers=(new OfferService())->all(); $active=(new OfferService())->byProduct(); $this->view('admin/ofertas/index', compact('productos','offers','active'), 'layouts/admin'); }
  public function guardar(): void { $this->requireAuth(); check_csrf(); $pid=(int)($_POST['producto_id']??0); $descuento=max(0,min(95,(float)($_POST['descuento']??0))); $dias=max(1,(int)($_POST['dias']??2)); if(!$pid || !$descuento){$_SESSION['flash_error']='Elegí producto y porcentaje.'; redirect_to('admin/ofertas');} (new OfferService())->save(['producto_id'=>$pid,'descuento'=>$descuento,'desde'=>date('Y-m-d'),'hasta'=>date('Y-m-d',strtotime('+'.$dias.' days')),'active'=>true,'created_at'=>date('c')]); $_SESSION['flash_ok']='Oferta aplicada.'; redirect_to('admin/ofertas'); }
  public function eliminar(int $id): void { $this->requireAuth(); check_csrf(); (new OfferService())->delete((string)$id); $_SESSION['flash_ok']='Oferta quitada.'; redirect_to('admin/ofertas'); }
}
