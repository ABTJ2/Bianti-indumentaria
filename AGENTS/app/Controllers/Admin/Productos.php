<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\CategoriaModel;
use App\Models\ProductoModel;

final class Productos extends Controller
{
    public function index(): void
    {
        $this->requireAuth();
        try {
            $productos = (new ProductoModel())->admin($_GET);
            $categorias = (new CategoriaModel())->normalize((new CategoriaModel())->ordered(false));
            $this->view('admin/productos/index', compact('productos', 'categorias'), 'layouts/admin');
        } catch (\Throwable $e) {
            $error = $e->getMessage();
            $productos = [];
            $categorias = [];
            $this->view('admin/productos/index', compact('productos', 'categorias', 'error'), 'layouts/admin');
        }
    }

    public function editar(int $id): void
    {
        $this->requireAuth();
        $producto = (new ProductoModel())->hydratedFind($id);
        $categorias = (new CategoriaModel())->ordered(false);
        if (!$producto) redirect_to('admin/productos');
        $this->view('admin/productos/editar', compact('producto', 'categorias'), 'layouts/admin');
    }

    public function guardar(int $id): void
    {
        $this->requireAuth();
        check_csrf();
        $data = [
            'titulo' => trim((string)($_POST['titulo'] ?? '')),
            'descripcion' => trim((string)($_POST['descripcion'] ?? '')),
            'precio' => (float)($_POST['precio'] ?? 0),
            'precio_costo' => (float)($_POST['precio_costo'] ?? 0),
            'visible' => isset($_POST['visible']),
            'disponible' => isset($_POST['disponible']),
        ];
        try {
            $model = new ProductoModel();
            $model->updateById($id, $data);
            $cats = array_map('intval', $_POST['categorias'] ?? []);
            $talles = array_filter(array_map('trim', preg_split('/[,;
]+/', (string)($_POST['talles'] ?? ''))));
            $model->updateRelations($id, $cats, $talles);
            $_SESSION['flash_ok'] = 'Producto actualizado.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudo guardar: ' . $e->getMessage();
        }
        redirect_to('admin/productos');
    }

    public function toggle(int $id): void
    {
        $this->requireAuth();
        check_csrf();
        $field = $_POST['field'] ?? '';
        if (!in_array($field, ['visible', 'disponible'], true)) redirect_to('admin/productos');
        $value = ($_POST['value'] ?? '0') === '1';
        try {
            (new ProductoModel())->updateById($id, [$field => $value]);
            $_SESSION['flash_ok'] = 'Producto actualizado.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudo actualizar: ' . $e->getMessage();
        }
        redirect_to('admin/productos?' . http_build_query(array_diff_key($_GET, ['_url'=>1])));
    }

    public function eliminar(int $id): void
    {
        $this->requireAuth();
        check_csrf();
        try {
            (new ProductoModel())->deleteById($id);
            $_SESSION['flash_ok'] = 'Producto eliminado.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudo eliminar: ' . $e->getMessage();
        }
        redirect_to('admin/productos');
    }
}
