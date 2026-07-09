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
            $id = (string)($payload['producto_id'] ?? $payload['id'] ?? '');
            if ($id === '') continue;
            $counts[$id] = ($counts[$id] ?? 0) + 1;
        }
        arsort($counts);
        return array_slice($counts, 0, $limit, true);
    }
}
