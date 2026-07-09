<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
use App\Models\CategoriaModel;
final class Categorias extends Controller
{
  public function index(): void { $this->requireAuth(); $model=new CategoriaModel(); $categorias=$model->normalize($model->ordered(false)); $this->view('admin/categorias/index', compact('categorias'), 'layouts/admin'); }
  public function crear(): void { $this->requireAuth(); check_csrf(); $model=new CategoriaModel(); $nombre=trim((string)($_POST['nombre']??'')); if($nombre===''){$_SESSION['flash_error']='El nombre es obligatorio.'; redirect_to('admin/categorias');} try{$model->create(['nombre'=>$nombre,'orden'=>(int)($_POST['orden']??0),'visible'=>isset($_POST['visible']),'usa_talles'=>isset($_POST['usa_talles'])]); if(!empty($_FILES['portada']))$model->saveLocalCover($nombre,$_FILES['portada']); $_SESSION['flash_ok']='Categoría creada.';}catch(\Throwable $e){$_SESSION['flash_error']='No se pudo crear: '.$e->getMessage();} redirect_to('admin/categorias'); }
  public function actualizar(int $id): void { $this->requireAuth(); check_csrf(); $model=new CategoriaModel(); $nombre=trim((string)($_POST['nombre']??'')); try{$model->updateById($id,['nombre'=>$nombre,'orden'=>(int)($_POST['orden']??0),'visible'=>isset($_POST['visible']),'usa_talles'=>isset($_POST['usa_talles'])]); if(!empty($_FILES['portada']))$model->saveLocalCover($nombre,$_FILES['portada']); $_SESSION['flash_ok']='Categoría actualizada.';}catch(\Throwable $e){$_SESSION['flash_error']='No se pudo actualizar: '.$e->getMessage();} redirect_to('admin/categorias'); }
  public function eliminar(int $id): void { $this->requireAuth(); check_csrf(); try{(new CategoriaModel())->deleteById($id); $_SESSION['flash_ok']='Categoría eliminada.';}catch(\Throwable $e){$_SESSION['flash_error']='No se pudo eliminar: '.$e->getMessage();} redirect_to('admin/categorias'); }
}
