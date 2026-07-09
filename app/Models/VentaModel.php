<?php
namespace App\Models;

use App\Core\Cache;

final class VentaModel extends BaseSupabaseModel
{
    protected string $table = 'ventas';
    public function ventas(): array { return Cache::remember('bianti_ventas', 60, fn() => $this->all(['select' => '*', 'order' => 'fecha.desc,id.desc', 'limit' => 500])); }
    public function manuales(): array { return Cache::remember('bianti_ventas_manuales', 60, fn() => $this->sb->select('ventas_manuales', ['select' => '*', 'order' => 'fecha.desc,id.desc', 'limit' => 500])); }
}
