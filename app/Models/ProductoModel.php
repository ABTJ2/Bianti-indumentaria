<?php
namespace App\Models;

use App\Core\Cache;
use App\Services\OfferService;

final class ProductoModel extends BaseSupabaseModel
{
    protected string $table = 'productos';

    public function catalogo(array $filters = []): array
    {
        $products = $this->catalogoBaseRows($filters);
        return $this->hydrateAndFilter($products, $filters);
    }

    public function admin(array $filters = []): array
    {
        $limit = max(1, min(200, (int)($filters['limit'] ?? 80)));
        $products = $this->all(['select' => '*', 'order' => 'id.desc', 'limit' => $limit]);
        return $this->hydrateAndFilter($products, $filters);
    }

    public function byIds(array $ids, bool $visibleOnly = true): array
    {
        $ids = $this->cleanIds($ids);
        if (!$ids) return [];
        $params = ['select' => '*', 'id' => 'in.(' . implode(',', $ids) . ')', 'order' => 'id.desc'];
        if ($visibleOnly) $params['visible'] = 'eq.true';
        $rows = $this->all($params);
        $hydrated = $this->hydrateAndFilter($rows, []);
        $byId = [];
        foreach ($hydrated as $row) $byId[(string)($row['id'] ?? '')] = $row;
        $out = [];
        foreach ($ids as $id) if (isset($byId[(string)$id])) $out[] = $byId[(string)$id];
        return $out;
    }

    public function summaryByIds(array $ids, bool $visibleOnly = true): array
    {
        $ids = $this->cleanIds($ids);
        if (!$ids) return [];
        $params = [
            'select' => '*',
            'id' => 'in.(' . implode(',', $ids) . ')',
            'order' => 'id.desc',
        ];
        if ($visibleOnly) $params['visible'] = 'eq.true';
        $rows = $this->all($params);
        $rows = $this->applyOffers(array_map(fn($p) => $this->withSummaryShape($p), $rows));
        $byId = [];
        foreach ($rows as $row) $byId[(string)($row['id'] ?? '')] = $row;
        $out = [];
        foreach ($ids as $id) if (isset($byId[(string)$id])) $out[] = $byId[(string)$id];
        return $out;
    }

    public function latestVisible(int $limit = 6): array
    {
        $limit = max(1, min(24, $limit));
        $rows = Cache::remember("bianti_productos_latest_{$limit}", 60, fn() => $this->all([
            'select' => '*',
            'visible' => 'eq.true',
            'order' => 'id.desc',
            'limit' => $limit,
        ]));
        return $this->hydrateAndFilter($rows, []);
    }

    public function latestVisibleSummary(int $limit = 6): array
    {
        $limit = max(1, min(24, $limit));
        $rows = Cache::remember("bianti_productos_latest_summary_{$limit}", 60, fn() => $this->all([
            'select' => '*',
            'visible' => 'eq.true',
            'order' => 'id.desc',
            'limit' => $limit,
        ]));
        return $this->applyOffers(array_map(fn($p) => $this->withSummaryShape($p), $rows));
    }

    public function accountingRows(): array
    {
        return Cache::remember('bianti_productos_contabilidad', 60, fn() => $this->all([
            'select' => 'id,titulo,precio,precio_venta,precio_costo,visible,disponible',
            'order' => 'id.desc',
        ]));
    }

    public function existingIds(): array
    {
        $rows = Cache::remember('bianti_productos_ids', 60, fn() => $this->all(['select' => 'id', 'order' => 'id.desc']));
        return array_map(fn($row) => (string)($row['id'] ?? ''), $rows);
    }

    public function availableTallesByCategory(): array
    {
        return Cache::remember('bianti_productos_talles_por_categoria', 60, function () {
            $rel = $this->sb->select('producto_categorias', ['select' => 'producto_id,categoria_id']);
            $talles = $this->sb->select('producto_talles', ['select' => 'producto_id,talle']);
            $catsByProduct = [];
            foreach ($rel as $row) {
                $pid = (string)($row['producto_id'] ?? '');
                if ($pid !== '') $catsByProduct[$pid][] = (string)($row['categoria_id'] ?? '');
            }
            $all = [];
            $byCategory = [];
            foreach ($talles as $row) {
                $pid = (string)($row['producto_id'] ?? '');
                $talle = trim((string)($row['talle'] ?? ''));
                if ($pid === '' || $talle === '') continue;
                $all[] = $talle;
                foreach ($catsByProduct[$pid] ?? [] as $cid) $byCategory[$cid][] = $talle;
            }
            $all = $this->uniqueSorted($all);
            foreach ($byCategory as $cid => $vals) $byCategory[$cid] = $this->uniqueSorted($vals);
            return ['all' => $all, 'byCategory' => $byCategory];
        });
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
        $productIds = $this->cleanIds(array_map(fn($p) => $p['id'] ?? null, $products));
        if (!$productIds) return [];
        $idFilter = 'in.(' . implode(',', $productIds) . ')';
        $rel = $this->sb->select('producto_categorias', ['select' => 'producto_id,categoria_id', 'producto_id' => $idFilter]);
        $fotos = $this->sb->select('producto_fotos', ['select' => 'producto_id,url,orden', 'producto_id' => $idFilter, 'order' => 'orden.asc,id.asc']);
        $talles = $this->sb->select('producto_talles', ['select' => 'producto_id,talle', 'producto_id' => $idFilter]);
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
        Cache::forgetPrefix('bianti_');
    }

    public function attachPhoto(int $id, string $tmpFile, string $originalName, string $mime, bool $cover = true): string
    {
        $filename = $this->safeFileName($originalName);
        $path = 'productos/' . $id . '/' . time() . '-' . bin2hex(random_bytes(4)) . '-' . $filename;
        $url = $this->sb->upload('productos', $path, $tmpFile, $mime);
        $orden = $cover ? 0 : $this->nextPhotoOrder($id);
        $this->sb->insert('producto_fotos', ['producto_id' => $id, 'url' => $url, 'orden' => $orden]);
        if ($cover) $this->updateById($id, ['portada_url' => $url]);
        Cache::forgetPrefix('bianti_');
        return $url;
    }

    private function nextPhotoOrder(int $id): int
    {
        $rows = $this->sb->select('producto_fotos', ['select' => 'orden', 'producto_id' => 'eq.' . $id, 'order' => 'orden.desc', 'limit' => 1]);
        return (int)($rows[0]['orden'] ?? 0) + 1;
    }

    private function safeFileName(string $name): string
    {
        $name = strtolower((string)preg_replace('/[^a-zA-Z0-9.\-_]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) ?: $name));
        $name = trim(preg_replace('/-+/', '-', $name), '-.');
        return $name ?: 'producto.jpg';
    }

    public function deleteWithRelations(int $id): void
    {
        $this->sb->delete('producto_fotos', ['producto_id' => 'eq.' . $id]);
        $this->sb->delete('producto_talles', ['producto_id' => 'eq.' . $id]);
        $this->sb->delete('producto_categorias', ['producto_id' => 'eq.' . $id]);
        try { $this->sb->delete('variantes', ['producto_id' => 'eq.' . $id]); } catch (\Throwable) {}
        (new EventoModel())->deleteForProduct($id);
        (new OfferService())->delete((string)$id);
        $this->deleteById($id);
        Cache::forgetPrefix('bianti_');
    }

    public function cover(array $p): string
    {
        if (!empty($p['portada_url'])) return (string)$p['portada_url'];
        if (!empty($p['imagen_url'])) return (string)$p['imagen_url'];
        if (!empty($p['foto_url'])) return (string)$p['foto_url'];
        if (!empty($p['fotos'][0]['url'])) return (string)$p['fotos'][0]['url'];
        return '';
    }

    private function catalogoBaseRows(array $filters): array
    {
        $params = ['select' => '*', 'visible' => 'eq.true', 'order' => 'id.desc', 'limit' => 120];
        $q = trim((string)($filters['q'] ?? ''));
        if ($q !== '') {
            $safe = str_replace(['*', ',', '(', ')'], ' ', $q);
            $params['or'] = '(titulo.ilike.*' . $safe . '*,descripcion.ilike.*' . $safe . '*)';
        }

        $ids = null;
        $categoria = trim((string)($filters['categoria'] ?? ''));
        if ($categoria !== '') {
            $rel = $this->sb->select('producto_categorias', ['select' => 'producto_id', 'categoria_id' => 'eq.' . (int)$categoria, 'limit' => 300]);
            $ids = $this->cleanIds(array_map(fn($row) => $row['producto_id'] ?? null, $rel));
        }
        $talle = trim((string)($filters['talle'] ?? ''));
        if ($talle !== '') {
            $rel = $this->sb->select('producto_talles', ['select' => 'producto_id', 'talle' => 'eq.' . $talle, 'limit' => 300]);
            $talleIds = $this->cleanIds(array_map(fn($row) => $row['producto_id'] ?? null, $rel));
            $ids = is_array($ids) ? array_values(array_intersect($ids, $talleIds)) : $talleIds;
        }
        if (is_array($ids)) {
            if (!$ids) return [];
            $params['id'] = 'in.(' . implode(',', array_slice($ids, 0, 300)) . ')';
        }
        return $this->all($params);
    }

    private function cleanIds(array $ids): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids), fn($id) => $id > 0)));
        return $ids;
    }

    private function uniqueSorted(array $values): array
    {
        $values = array_values(array_unique(array_filter(array_map('trim', $values))));
        sort($values, SORT_NATURAL | SORT_FLAG_CASE);
        return $values;
    }

    private function withSummaryShape(array $p): array
    {
        $p['categorias_ids'] = [];
        $p['categorias'] = [];
        $p['fotos'] = [];
        $p['talles'] = [];
        $p['portada'] = $this->cover($p);
        return $p;
    }
}
