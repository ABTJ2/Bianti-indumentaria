<?php
namespace App\Models;

final class EventoModel extends BaseSupabaseModel
{
    protected string $table = 'eventos';

    public function recent(int $limit = 2000): array
    {
        return $this->all(['select' => '*', 'order' => 'created_at.desc', 'limit' => $limit]);
    }

    public function log(string $type, array $payload = []): array
    {
        $productId = $this->productIdFromTypeAndPayload($type, $payload);
        if ($productId !== '' && !(new ProductoModel())->find((int)$productId)) {
            return ['warning' => 'Producto inexistente. Evento no guardado.', 'skipped' => true];
        }
        return $this->sb->insert('eventos', [
            'type' => $type,
            'payload' => $payload,
            'created_at' => date('c'),
        ]);
    }

    public function topProducts(string $type = 'view_product', int $limit = 6): array
    {
        $counts = [];
        foreach ($this->recent(3000) as $e) {
            if (($e['type'] ?? '') !== $type) continue;
            $payload = is_array($e['payload'] ?? null) ? $e['payload'] : json_decode((string)($e['payload'] ?? '{}'), true);
            $id = is_array($payload) ? $this->productIdFromTypeAndPayload($type, $payload) : '';
            if ($id === '') continue;
            $counts[$id] = ($counts[$id] ?? 0) + 1;
        }
        arsort($counts);
        return array_slice($counts, 0, $limit, true);
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
        if (in_array($type, ['view_product', 'click_whatsapp'], true) && isset($payload['id'])) return (string)$payload['id'];
        return '';
    }

    public function productEvents(int $limit = 10000): array
    {
        return array_values(array_filter($this->all(['select' => '*', 'order' => 'created_at.desc', 'limit' => $limit]), fn($event) => $this->productIdFromEvent($event) !== ''));
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
}
