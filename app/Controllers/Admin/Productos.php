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

    public function nuevo(): void
    {
        $this->requireAuth();
        $categorias = (new CategoriaModel())->normalize((new CategoriaModel())->ordered(false));
        $this->view('admin/productos/nuevo', compact('categorias'), 'layouts/admin');
    }

    public function crear(): void
    {
        $this->requireAuth();
        check_csrf();

        $titulo = trim((string)($_POST['titulo'] ?? ''));
        $precio = $_POST['precio'] ?? '';
        $precioCosto = $_POST['precio_costo'] ?? 0;
        $categoriaIds = array_values(array_unique(array_filter(array_map('intval', $_POST['categorias'] ?? []))));
        $categoriasValidas = array_map(fn($c) => (int)$c['id'], (new CategoriaModel())->ordered(false));

        if ($titulo === '') {
            $_SESSION['flash_error'] = 'El título es obligatorio.';
            redirect_to('admin/productos/nuevo');
        }
        if ($precio === '' || !is_numeric($precio) || (float)$precio < 0) {
            $_SESSION['flash_error'] = 'El precio de venta debe ser numérico.';
            redirect_to('admin/productos/nuevo');
        }
        foreach ($categoriaIds as $categoriaId) {
            if (!in_array($categoriaId, $categoriasValidas, true)) {
                $_SESSION['flash_error'] = 'La categoría seleccionada no es válida.';
                redirect_to('admin/productos/nuevo');
            }
        }
        $foto = $_FILES['portada'] ?? null;
        $fotoValida = $this->validateImageUpload($foto, false, 'admin/productos/nuevo');

        $data = [
            'categoria_id' => $categoriaIds[0] ?? null,
            'titulo' => $titulo,
            'descripcion' => trim((string)($_POST['descripcion'] ?? '')) ?: null,
            'precio' => (float)$precio,
            'precio_costo' => is_numeric($precioCosto) ? (float)$precioCosto : 0,
            'precio_venta' => (float)$precio,
            'visible' => isset($_POST['visible']),
            'disponible' => isset($_POST['disponible']),
            'portada_url' => null,
        ];

        try {
            $model = new ProductoModel();
            $created = $model->create($data);
            $id = (int)($created[0]['id'] ?? 0);
            if (!$id) throw new \RuntimeException('Supabase no devolvió el ID del producto creado.');
            $talles = array_filter(array_map('trim', preg_split('/[,;\r\n]+/', (string)($_POST['talles'] ?? ''))));
            $model->updateRelations($id, $categoriaIds, $talles);
            if ($fotoValida) {
                try {
                    $model->attachPhoto($id, $foto['tmp_name'], $foto['name'], $foto['type'], true);
                } catch (\Throwable $uploadError) {
                    try { $model->deleteWithRelations($id); } catch (\Throwable) {}
                    throw new \RuntimeException('No se creó el producto porque falló la subida de imagen: ' . $uploadError->getMessage());
                }
            }
            $_SESSION['flash_ok'] = 'Producto creado correctamente.';
            redirect_to('admin/productos');
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudo crear: ' . $e->getMessage();
            redirect_to('admin/productos/nuevo');
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
        $titulo = trim((string)($_POST['titulo'] ?? ''));
        $precio = $_POST['precio'] ?? '';
        $precioCosto = $_POST['precio_costo'] ?? 0;
        $cats = array_values(array_unique(array_filter(array_map('intval', $_POST['categorias'] ?? []))));
        $categoriasValidas = array_map(fn($c) => (int)$c['id'], (new CategoriaModel())->ordered(false));

        if ($titulo === '') {
            $_SESSION['flash_error'] = 'El título es obligatorio.';
            redirect_to('admin/productos/editar/' . $id);
        }
        if ($precio === '' || !is_numeric($precio) || (float)$precio < 0) {
            $_SESSION['flash_error'] = 'El precio de venta debe ser numérico.';
            redirect_to('admin/productos/editar/' . $id);
        }
        foreach ($cats as $categoriaId) {
            if (!in_array($categoriaId, $categoriasValidas, true)) {
                $_SESSION['flash_error'] = 'La categoría seleccionada no es válida.';
                redirect_to('admin/productos/editar/' . $id);
            }
        }
        $foto = $_FILES['portada'] ?? null;
        $fotoValida = $this->validateImageUpload($foto, false, 'admin/productos/editar/' . $id);
        $data = [
            'titulo' => $titulo,
            'descripcion' => trim((string)($_POST['descripcion'] ?? '')),
            'precio' => (float)$precio,
            'precio_venta' => (float)$precio,
            'precio_costo' => is_numeric($precioCosto) ? (float)$precioCosto : 0,
            'visible' => isset($_POST['visible']),
            'disponible' => isset($_POST['disponible']),
        ];
        try {
            $model = new ProductoModel();
            $model->updateById($id, $data);
            $talles = array_filter(array_map('trim', preg_split('/[,;\r\n]+/', (string)($_POST['talles'] ?? ''))));
            $model->updateRelations($id, $cats, $talles);
            if ($fotoValida) $model->attachPhoto($id, $foto['tmp_name'], $foto['name'], $foto['type'], true);
            $_SESSION['flash_ok'] = 'Producto actualizado.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudo guardar: ' . $e->getMessage();
        }
        redirect_to('admin/productos');
    }

    private function validateImageUpload(?array $file, bool $required, string $failRedirect): bool
    {
        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            if ($required) {
                $_SESSION['flash_error'] = 'La foto es obligatoria.';
                redirect_to($failRedirect);
            }
            return false;
        }
        if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            $_SESSION['flash_error'] = 'No se pudo leer la imagen subida.';
            redirect_to($failRedirect);
        }
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) {
            $_SESSION['flash_error'] = 'La imagen no puede superar 5 MB.';
            redirect_to($failRedirect);
        }
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];
        $mime = (string)($file['type'] ?? '');
        if (function_exists('finfo_open') && is_file($file['tmp_name'] ?? '')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $detected = $finfo ? finfo_file($finfo, $file['tmp_name']) : false;
            if ($finfo) finfo_close($finfo);
            if ($detected) $mime = $detected;
        }
        if (!in_array($mime, $allowed, true)) {
            $_SESSION['flash_error'] = 'La imagen debe ser JPG, PNG o WEBP.';
            redirect_to($failRedirect);
        }
        $_FILES['portada']['type'] = $mime;
        return true;
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
            (new ProductoModel())->deleteWithRelations($id);
            $_SESSION['flash_ok'] = 'Producto eliminado.';
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'No se pudo eliminar: ' . $e->getMessage();
        }
        redirect_to('admin/productos');
    }
}
