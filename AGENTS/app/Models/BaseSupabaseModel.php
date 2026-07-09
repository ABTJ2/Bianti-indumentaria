<?php
namespace App\Models;

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
        return $this->sb->insert($this->table, $data);
    }

    public function updateById(int $id, array $data): array
    {
        return $this->sb->update($this->table, $data, ['id' => 'eq.' . $id]);
    }

    public function deleteById(int $id): array
    {
        return $this->sb->delete($this->table, ['id' => 'eq.' . $id]);
    }
}
