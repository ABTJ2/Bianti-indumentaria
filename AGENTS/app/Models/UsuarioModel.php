<?php
namespace App\Models;

final class UsuarioModel extends BaseSupabaseModel
{
    protected string $table = 'usuarios';

    public function attempt(string $username, string $password): ?array
    {
        $rows = $this->all([
            'select' => 'id,username,rol,activo',
            'username' => 'eq.' . $username,
            'password' => 'eq.' . $password,
            'activo' => 'eq.true',
            'limit' => 1,
        ]);
        return $rows[0] ?? null;
    }
}
