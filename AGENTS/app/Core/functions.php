<?php
function env_value(string $key, ?string $default = null): ?string
{
    return \App\Core\Env::get($key, $default);
}

function e($value): string
{
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function base_url(string $path = ''): string
{
    $script = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    if (str_ends_with($script, '/public')) $base = $script;
    else $base = rtrim($script, '/') . '/public';
    $base = rtrim($base, '/');
    return $base . '/' . ltrim($path, '/');
}

function site_url(string $path = ''): string
{
    return base_url($path);
}

function asset_url(string $path): string
{
    return base_url('assets/' . ltrim($path, '/'));
}

function money_ar($value): string
{
    $n = is_numeric($value) ? (float)$value : 0;
    return '$ ' . number_format($n, 2, ',', '.');
}

function current_path(): string
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
    $candidates = array_unique([
        rtrim($scriptDir, '/'),
        rtrim(str_replace('/public', '', $scriptDir), '/'),
        rtrim($scriptDir . '/public', '/'),
    ]);
    foreach ($candidates as $base) {
        if ($base !== '' && $base !== '/' && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base));
            break;
        }
    }
    $uri = preg_replace('#/index\.php#', '', $uri);
    return trim($uri, '/') ?: '';
}

function redirect_to(string $path): void
{
    header('Location: ' . site_url($path));
    exit;
}

function csrf_field(): string
{
    if (empty($_SESSION['_csrf'])) $_SESSION['_csrf'] = bin2hex(random_bytes(16));
    return '<input type="hidden" name="_csrf" value="' . e($_SESSION['_csrf']) . '">';
}

function check_csrf(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $ok = isset($_POST['_csrf'], $_SESSION['_csrf']) && hash_equals($_SESSION['_csrf'], (string)$_POST['_csrf']);
        if (!$ok) {
            http_response_code(419);
            echo 'Token de seguridad inválido. Volvé atrás y recargá la página.';
            exit;
        }
    }
}

function category_slug(string $name): string
{
    $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
    $s = strtolower($s ?: $name);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}
