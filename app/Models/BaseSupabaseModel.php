<?php
namespace App\Models;

use App\Core\Cache;
use App\Services\SupabaseService;

abstract class BaseSupabaseModel
{
    protected SupabaseService $sb;
    protected string $table = '';

    public function __construct()
    {
        $this->sb = new SupabaseService();
    }

    public function all(array $params = []): array
    {
        $params['select'] ??= '*';
        return $this->sb->select($this->table, $params);
    }

    public function find(int $id): ?array
    {
        $rows = $this->sb->select($this->table, ['select' => '*', 'id' => 'eq.' . $id, 'limit' => 1]);
        return $rows[0] ?? null;
    }

    public function create(array $data): array
    {
        $result = $this->sb->insert($this->table, $data);
        $this->forgetPerformanceCache();
        return $result;
    }

    public function updateById(int $id, array $data): array
    {
        $result = $this->sb->update($this->table, $data, ['id' => 'eq.' . $id]);
        $this->forgetPerformanceCache();
        return $result;
    }

    public function deleteById(int $id): array
    {
        $result = $this->sb->delete($this->table, ['id' => 'eq.' . $id]);
        $this->forgetPerformanceCache();
        return $result;
    }

    protected function forgetPerformanceCache(): void
    {
        if (in_array($this->table, ['productos', 'categorias', 'pedidos', 'ventas', 'ventas_manuales', 'eventos'], true)) {
            Cache::forgetPrefix('bianti_');
        }
    }
}
