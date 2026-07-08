<?php
namespace App\Models;

use App\Core\Cache;

final class EventoModel extends BaseSupabaseModel
{
    protected string $table = 'eventos';
    private const METRIC_TYPES = ['view_product', 'click_whatsapp', 'view_category', 'view_catalog', 'catalogo_view', 'catalog_view', 'product_view', 'whatsapp_click'];

    public function recent(int $limit = 2000): array
    {
        $limit = max(1, min(3000, $limit));
        return Cache::remember("bianti_eventos_recent_{$limit}", 30, fn() => $this->all([
            'select' => 'id,type,payload,created_at',
            'order' => 'created_at.desc',
            'limit' => $limit,
        ]));
    }

    public function log(string $type, array $payload = []): array
    {
        $productId = $this->productIdFromTypeAndPayload($type, $payload);
        if ($productId !== '' && !(new ProductoModel())->find((int)$productId)) {
            return ['warning' => 'Producto inexistente. Evento no guardado.', 'skipped' => true];
        }
        $result = $this->sb->insert('eventos', [
            'type' => $type,
            'payload' => $payload,
            'created_at' => date('c'),
        ]);
        Cache::forgetPrefix('bianti_');
        return $result;
    }

    public function topProducts(string $type = 'view_product', int $limit = 6): array
    {
        return Cache::remember("bianti_eventos_top_{$type}_{$limit}", 30, function () use ($type, $limit) {
            $counts = [];
            foreach ($this->all(['select' => 'type,payload,created_at', 'type' => 'eq.' . $type, 'order' => 'created_at.desc', 'limit' => 600]) as $e) {
                $payload = is_array($e['payload'] ?? null) ? $e['payload'] : json_decode((string)($e['payload'] ?? '{}'), true);
                $id = is_array($payload) ? $this->productIdFromTypeAndPayload($type, $payload) : '';
                if ($id === '') continue;
                $counts[$id] = ($counts[$id] ?? 0) + 1;
            }
            arsort($counts);
            return array_slice($counts, 0, $limit, true);
        });
    }

    public function featuredProductScores(int $limit = 8): array
    {
        $limit = max(1, min(20, $limit));
        return Cache::remember("bianti_eventos_featured_scores_{$limit}", 30, function () use ($limit) {
            $scores = [];
            foreach ($this->all(['select' => 'type,payload,created_at', 'order' => 'created_at.desc', 'limit' => 1000]) as $e) {
                $type = (string)($e['type'] ?? '');
                if (!in_array($type, ['view_product', 'product_view', 'click_whatsapp', 'whatsapp_click'], true)) continue;
                $id = $this->productIdFromEvent($e);
                if ($id === '') continue;
                $weight = in_array($type, ['click_whatsapp', 'whatsapp_click'], true) ? 3 : 1;
                $scores[$id] = ($scores[$id] ?? 0) + $weight;
            }
            arsort($scores);
            return array_slice($scores, 0, $limit, true);
        });
    }

    public function productIdFromEvent(array $event): string
    {
        $payload = is_array($event['payload'] ?? null) ? $event['payload'] : json_decode((string)($event['payload'] ?? '{}'), true);
        if (!is_array($payload)) return '';
        return $this->productIdFromTypeAndPayload((string)($event['type'] ?? ''), $payload);
    }

    public function productIdFromTypeAndPayload(string $type, array $payload): string
    {
        foreach (['producto_id', 'id_producto', 'product_id'] as $key) {
            if (isset($payload[$key]) && trim((string)$payload[$key]) !== '') return (string)$payload[$key];
        }
        if (in_array($type, ['view_product', 'product_view', 'click_whatsapp', 'whatsapp_click'], true) && isset($payload['id'])) return (string)$payload['id'];
        return '';
    }

    public function productEvents(int $limit = 10000): array
    {
        $limit = max(1, min(5000, $limit));
        return array_values(array_filter($this->all(['select' => 'id,type,payload,created_at', 'order' => 'created_at.desc', 'limit' => $limit]), fn($event) => $this->productIdFromEvent($event) !== ''));
    }

    public function orphanProductEventIds(array $existingProductIds): array
    {
        $existing = array_fill_keys(array_map('strval', $existingProductIds), true);
        $ids = [];
        foreach ($this->productEvents() as $event) {
            $productId = $this->productIdFromEvent($event);
            if ($productId !== '' && !isset($existing[$productId]) && isset($event['id'])) $ids[] = (int)$event['id'];
        }
        return array_values(array_unique(array_filter($ids)));
    }

    public function deleteForProduct(int $productId): int
    {
        $deleted = 0;
        foreach ($this->productEvents() as $event) {
            if ($this->productIdFromEvent($event) !== (string)$productId || empty($event['id'])) continue;
            $this->deleteById((int)$event['id']);
            $deleted++;
        }
        return $deleted;
    }

    public function deleteOrphans(array $existingProductIds): int
    {
        $deleted = 0;
        foreach ($this->orphanProductEventIds($existingProductIds) as $id) {
            $this->deleteById($id);
            $deleted++;
        }
        return $deleted;
    }

    public function resetCatalogMetrics(): int
    {
        $deleted = 0;
        foreach (self::METRIC_TYPES as $type) {
            try {
                $rows = $this->all(['select' => 'id', 'type' => 'eq.' . $type, 'limit' => 5000]);
                foreach ($rows as $row) {
                    if (empty($row['id'])) continue;
                    $this->deleteById((int)$row['id']);
                    $deleted++;
                }
            } catch (\Throwable) {
                continue;
            }
        }
        Cache::forgetPrefix('bianti_');
        return $deleted;
    }

    public function metricTypes(): array
    {
        return self::METRIC_TYPES;
    }
}
