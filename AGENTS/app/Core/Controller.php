<?php
namespace App\Core;

abstract class Controller
{
    protected function view(string $view, array $data = [], string $layout = 'layouts/admin'): void
    {
        extract($data, EXTR_SKIP);
        $viewFile = APPPATH . 'Views/' . $view . '.php';
        if (!is_file($viewFile)) {
            http_response_code(500);
            echo "Vista no encontrada: " . e($view);
            return;
        }
        ob_start();
        require $viewFile;
        $content = ob_get_clean();

        $layoutFile = APPPATH . 'Views/' . $layout . '.php';
        if (is_file($layoutFile)) require $layoutFile;
        else echo $content;
    }

    protected function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    protected function requireAuth(): void
    {
        if (empty($_SESSION['bianti_user'])) redirect_to('admin/login');
    }

    protected function user(): ?array
    {
        return $_SESSION['bianti_user'] ?? null;
    }
}
