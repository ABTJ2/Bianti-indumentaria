<?php
namespace App\Models;

final class VentaModel extends BaseSupabaseModel
{
    protected string $table = 'ventas';
    public function ventas(): array { return $this->all(['select' => '*', 'order' => 'fecha.desc,id.desc']); }
    public function manuales(): array { return $this->sb->select('ventas_manuales', ['select' => '*', 'order' => 'fecha.desc,id.desc']); }
}
