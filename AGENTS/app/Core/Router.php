<?php
namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $pattern, string $action): void { $this->add('GET', $pattern, $action); }
    public function post(string $pattern, string $action): void { $this->add('POST', $pattern, $action); }

    private function add(string $method, string $pattern, string $action): void
    {
        $pattern = trim($pattern, '/');
        $regex = preg_replace('#\(:num\)#', '([0-9]+)', $pattern);
        $regex = preg_replace('#\(:any\)#', '([^/]+)', $regex);
        $this->routes[] = [$method, '#^' . $regex . '$#', $action, $pattern];
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $path = current_path();
        if ($path === 'public') $path = '';

        foreach ($this->routes as [$routeMethod, $regex, $action]) {
            if ($routeMethod !== $method) continue;
            if (preg_match($regex, $path, $matches)) {
                array_shift($matches);
                $this->call($action, $matches);
                return;
            }
        }

        http_response_code(404);
        echo '<h1>404</h1><p>Ruta no encontrada: ' . e($path) . '</p>';
    }

    private function call(string $action, array $params): void
    {
        [$class, $method] = explode('::', $action);
        $class = 'App\\Controllers\\' . $class;
        if (!class_exists($class)) {
            http_response_code(500);
            echo 'Controlador no encontrado: ' . e($class);
            return;
        }
        $controller = new $class();
        if (!method_exists($controller, $method)) {
            http_response_code(500);
            echo 'Método no encontrado: ' . e($method);
            return;
        }
        $controller->$method(...$params);
    }
}
