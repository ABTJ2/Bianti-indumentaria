<?php
namespace App\Models;

use App\Services\OfferService;

final class ProductoModel extends BaseSupabaseModel
{
    protected string $table = 'productos';

    public function catalogo(array $filters = []): array
    {
        $products = $this->all(['select' => '*', 'visible' => 'eq.true', 'order' => 'id.desc']);
        return $this->hydrateAndFilter($products, $filters);
    }

    public function admin(array $filters = []): array
    {
        $products = $this->all(['select' => '*', 'order' => 'id.desc']);
        return $this->hydrateAndFilter($products, $filters);
    }

    public function hydratedFind(int $id): ?array
    {
        $p = $this->find($id);
        if (!$p) return null;
        $rows = $this->hydrateAndFilter([$p], []);
        return $rows[0] ?? $p;
    }

    public function hydrateAndFilter(array $products, array $filters = []): array
    {
        $rel = $this->sb->select('producto_categorias', ['select' => '*']);
        $fotos = $this->sb->select('producto_fotos', ['select' => '*', 'order' => 'orden.asc,id.asc']);
        $talles = $this->sb->select('producto_talles', ['select' => '*']);
        $cats = (new CategoriaModel())->ordered(false);
        $catMap = [];
        foreach ($cats as $c) $catMap[(string)$c['id']] = $c;

        $relBy = $fotoBy = $talleBy = [];
        foreach ($rel as $r) $relBy[(string)$r['producto_id']][] = $r;
        foreach ($fotos as $f) $fotoBy[(string)$f['producto_id']][] = $f;
        foreach ($talles as $t) $talleBy[(string)$t['producto_id']][] = $t['talle'] ?? '';

        $out = [];
        foreach ($products as $p) {
            $pid = (string)($p['id'] ?? '');
            $catIds = [];
            $catNames = [];
            foreach ($relBy[$pid] ?? [] as $r) {
                $cid = (string)($r['categoria_id'] ?? '');
                if ($cid === '') continue;
                $catIds[] = $cid;
                if (!empty($catMap[$cid]['nombre'])) $catNames[] = $catMap[$cid]['nombre'];
            }
            if (!$catIds && !empty($p['categoria_id'])) {
                $cid = (string)$p['categoria_id'];
                $catIds[] = $cid;
                if (!empty($catMap[$cid]['nombre'])) $catNames[] = $catMap[$cid]['nombre'];
            }
            $p['categorias_ids'] = array_values(array_unique($catIds));
            $p['categorias'] = array_values(array_unique(array_filter($catNames)));
            $p['fotos'] = $fotoBy[$pid] ?? [];
            $p['talles'] = array_values(array_unique(array_filter($talleBy[$pid] ?? [])));
            $p['portada'] = $this->cover($p);
            $out[] = $p;
        }
        $out = $this->applyOffers($out);
        return $this->applyFilters($out, $filters);
    }

    public function applyOffers(array $rows): array
    {
        $offers = (new OfferService())->byProduct();
        foreach ($rows as &$p) {
            $pid = (string)($p['id'] ?? '');
            $base = (float)($p['precio'] ?? $p['precio_venta'] ?? 0);
            $p['precio_base'] = $base;
            $p['precio_final'] = (float)($p['precio_venta'] ?? $p['precio'] ?? 0);
            if (isset($offers[$pid])) {
                $d = max(0, min(95, (float)($offers[$pid]['descuento'] ?? 0)));
                if ($base > 0 && $d > 0) {
                    $p['oferta_descuento'] = $d;
                    $p['precio_final'] = round($base * (1 - ($d / 100)), 2);
                    $p['oferta_hasta'] = $offers[$pid]['hasta'] ?? '';
                }
            }
        }
        unset($p);
        return $rows;
    }

    public function applyFilters(array $rows, array $filters): array
    {
        $q = mb_strtolower(trim((string)($filters['q'] ?? '')));
        $cat = trim((string)($filters['categoria'] ?? ''));
        $visible = trim((string)($filters['visible'] ?? ''));
        $disponible = trim((string)($filters['disponible'] ?? ''));
        $foto = trim((string)($filters['foto'] ?? ''));
        $min = ($filters['min'] ?? '') !== '' ? (float)$filters['min'] : null;
        $max = ($filters['max'] ?? '') !== '' ? (float)$filters['max'] : null;
        $talle = mb_strtolower(trim((string)($filters['talle'] ?? '')));

        $rows = array_filter($rows, function ($p) use ($q, $cat, $visible, $disponible, $foto, $min, $max, $talle) {
            if ($q !== '') {
                $syn = [
                    'pantalon' => 'pantalones jogging jogger jean calza calzas short shorts bermuda',
                    'pantalón' => 'pantalones jogging jogger jean calza calzas short shorts bermuda',
                    'calza' => 'calzas pantalon pantalones',
                    'remera' => 'camiseta chomba musculosa blusa top',
                    'perfume' => 'perfumes fragancia roll on cosmetica cosmética crema',
                    'mochila' => 'mochilas bolso bolsos cartera carteras',
                    'bazar' => 'hogar taza vaso mate termo cocina',
                    'juguete' => 'jugueteria juguetería infantil niño niña',
                ];
                $expanded = $q . ' ' . ($syn[$q] ?? '');
                $hay = mb_strtolower(($p['titulo'] ?? '') . ' ' . ($p['descripcion'] ?? '') . ' ' . implode(' ', $p['categorias'] ?? []) . ' ' . implode(' ', $p['talles'] ?? []));
                $matchQ = false;
                foreach (array_filter(explode(' ', $expanded)) as $word) {
                    if ($word !== '' && str_contains($hay, $word)) { $matchQ = true; break; }
                }
                if (!$matchQ) return false;
            }
            if ($cat !== '' && !in_array($cat, array_map('strval', $p['categorias_ids'] ?? []), true)) return false;
            if ($talle !== '') {
                $matchTalle = false;
                foreach (($p['talles'] ?? []) as $pt) {
                    if (mb_strtolower((string)$pt) === $talle) { $matchTalle = true; break; }
                }
                if (!$matchTalle) return false;
            }
            if ($visible === '1' && empty($p['visible'])) return false;
            if ($visible === '0' && !empty($p['visible'])) return false;
            if ($disponible === '1' && empty($p['disponible'])) return false;
            if ($disponible === '0' && !empty($p['disponible'])) return false;
            if ($foto === '1' && !$this->cover($p)) return false;
            if ($foto === '0' && $this->cover($p)) return false;
            $precio = (float)($p['precio_final'] ?? $p['precio_venta'] ?? $p['precio'] ?? 0);
            if ($min !== null && $precio < $min) return false;
            if ($max !== null && $precio > $max) return false;
            return true;
        });

        $sort = $filters['sort'] ?? 'recientes';
        usort($rows, function ($a, $b) use ($sort) {
            return match ($sort) {
                'precio_asc' => ((float)($a['precio_final'] ?? $a['precio_venta'] ?? $a['precio'] ?? 0)) <=> ((float)($b['precio_final'] ?? $b['precio_venta'] ?? $b['precio'] ?? 0)),
                'precio_desc' => ((float)($b['precio_final'] ?? $b['precio_venta'] ?? $b['precio'] ?? 0)) <=> ((float)($a['precio_final'] ?? $a['precio_venta'] ?? $a['precio'] ?? 0)),
                'titulo_asc' => strcmp((string)($a['titulo'] ?? ''), (string)($b['titulo'] ?? '')),
                'titulo_desc' => strcmp((string)($b['titulo'] ?? ''), (string)($a['titulo'] ?? '')),
                default => ((int)($b['id'] ?? 0)) <=> ((int)($a['id'] ?? 0)),
            };
        });
        return array_values($rows);
    }

    public function updateRelations(int $id, array $categoriaIds, array $talles): void
    {
        $this->sb->delete('producto_categorias', ['producto_id' => 'eq.' . $id]);
        foreach (array_values(array_unique(array_filter($categoriaIds))) as $cid) {
            $this->sb->insert('producto_categorias', ['producto_id' => $id, 'categoria_id' => (int)$cid, 'created_at' => date('c')]);
        }
        $this->sb->delete('producto_talles', ['producto_id' => 'eq.' . $id]);
        foreach (array_values(array_unique(array_filter($talles))) as $talle) {
            $this->sb->insert('producto_talles', ['producto_id' => $id, 'talle' => (string)$talle, 'created_at' => date('c')]);
        }
    }

    public function cover(array $p): string
    {
        if (!empty($p['portada_url'])) return (string)$p['portada_url'];
        if (!empty($p['imagen_url'])) return (string)$p['imagen_url'];
        if (!empty($p['foto_url'])) return (string)$p['foto_url'];
        if (!empty($p['fotos'][0]['url'])) return (string)$p['fotos'][0]['url'];
        return '';
    }
}
