<?php
namespace App\Models;

use App\Core\Cache;

final class CategoriaModel extends BaseSupabaseModel
{
    protected string $table = 'categorias';

    public function ordered(bool $onlyVisible = false): array
    {
        return Cache::remember('bianti_categorias_' . ($onlyVisible ? 'visibles' : 'todas'), 60, function () use ($onlyVisible) {
            $params = ['select' => '*', 'order' => 'orden.asc,id.asc'];
            if ($onlyVisible) $params['visible'] = 'eq.true';
            return $this->all($params);
        });
    }

    public function normalize(array $categorias): array
    {
        $seen = [];
        $out = [];
        foreach ($categorias as $c) {
            $name = trim((string)($c['nombre'] ?? $c['titulo'] ?? ''));
            if ($name === '') continue;
            $key = mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) ?: $name);
            $key = preg_replace('/\s+/', ' ', $key);
            if (isset($seen[$key])) continue;
            $seen[$key] = true;
            $c['nombre'] = $name;
            $c['slug'] = category_slug($name);
            $c['imagen'] = $this->categoryImage($name);
            $out[] = $c;
        }
        return $out;
    }

    public function categoryImage(string $name): string
    {
        $slug = category_slug($name);
        $map = [
            'gorras-y-accesorios' => 'gorras-accesorios.png',
            'cosmetica-y-perfumeria' => 'cosmetica-perfumeria.png',
            'cosmetica-perfumeria' => 'cosmetica-perfumeria.png',
            'varios' => 'varios.png',
            'electrodomesticos' => 'electrodomesticos.png',
            'bazar-y-hogar' => 'bazar-hogar.png',
            'bazar-hogar' => 'bazar-hogar.png',
            'libreria' => 'libreria.png',
            'indumentaria' => 'indumentaria.png',
            'indumentaria-superior' => 'indumentaria.png',
            'bolsos-y-mochilas' => 'bolsos-mochilas.png',
            'jugueteria' => 'jugueteria.png',
            'indumentaria-inferior' => 'indumentaria-inferior.png',
            'ropa-interior' => 'ropa-interior-full.png',
        ];
        $customDir = PUBLICPATH . 'assets/img/categorias/custom';
        foreach (['webp','png','jpg','jpeg'] as $ext) {
            if (is_file($customDir . '/' . $slug . '.' . $ext)) return asset_url('img/categorias/custom/' . $slug . '.' . $ext);
        }
        return asset_url('img/categorias/' . ($map[$slug] ?? 'varios.png'));
    }

    public function saveLocalCover(string $name, array $file): void
    {
        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) return;
        $slug = category_slug($name);
        $mime = mime_content_type($file['tmp_name']) ?: '';
        $ext = match ($mime) { 'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', default => '' };
        if ($ext === '') return;
        $dir = PUBLICPATH . 'assets/img/categorias/custom';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        foreach (glob($dir . '/' . $slug . '.*') ?: [] as $old) @unlink($old);
        move_uploaded_file($file['tmp_name'], $dir . '/' . $slug . '.' . $ext);
        Cache::forgetPrefix('bianti_');
    }
}
