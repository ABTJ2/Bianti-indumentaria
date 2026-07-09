<?php
namespace App\Models;

use App\Core\Cache;

final class PedidoModel extends BaseSupabaseModel
{
    protected string $table = 'pedidos';
    public function recent(): array { return Cache::remember('bianti_pedidos_recent', 30, fn() => $this->all(['select' => '*', 'order' => 'created_at.desc', 'limit' => 200])); }
    public function createConsulta(array $producto, string $mensaje = ''): array
    {
        $precio = (float)($producto['precio_final'] ?? $producto['precio_venta'] ?? $producto['precio'] ?? 0);
        $data = [
            'producto_id' => (int)($producto['id'] ?? 0),
            'producto_titulo' => (string)($producto['titulo'] ?? 'Producto'),
            'producto_precio' => $precio,
            'mensaje' => $mensaje ?: 'Consulta generada desde catálogo por WhatsApp.',
            'estado' => 'en_revision',
            'origen' => 'catalogo',
            'source' => 'whatsapp',
            'created_at' => date('c'),
        ];
        return $this->insertAdaptive($data);
    }

    public function setEstado(int $id, string $estado): array
    {
        $data=['estado'=>$estado,'updated_at'=>date('c')];
        if($estado==='vendido') $data['vendido_at']=date('c');
        return $this->updateAdaptive($id,$data);
    }

    private function insertAdaptive(array $data): array
    {
        $known = $this->knownColumns();
        if ($known) $data = array_intersect_key($data, array_flip($known));
        $result = $this->retryWithoutMissingColumn(fn($payload) => $this->sb->insert($this->table, $payload), $data);
        Cache::forgetPrefix('bianti_');
        return $result;
    }

    private function updateAdaptive(int $id, array $data): array
    {
        $known = $this->knownColumns();
        if ($known) $data = array_intersect_key($data, array_flip($known));
        $result = $this->retryWithoutMissingColumn(fn($payload) => $this->sb->update($this->table, $payload, ['id' => 'eq.' . $id]), $data);
        Cache::forgetPrefix('bianti_');
        return $result;
    }

    private function knownColumns(): array
    {
        static $columns = null;
        if (is_array($columns)) return $columns;
        try {
            $rows = $this->all(['select' => '*', 'limit' => 1]);
            $columns = $rows ? array_keys($rows[0]) : [];
            return $columns;
        } catch (\Throwable) {
            $columns = [];
            return [];
        }
    }

    private function retryWithoutMissingColumn(callable $operation, array $data): array
    {
        $last = null;
        for ($i = 0; $i < 12; $i++) {
            try {
                return $operation($data);
            } catch (\Throwable $e) {
                $last = $e;
                if (!preg_match("/Could not find the '([^']+)' column|column ([a-zA-Z0-9_]+) of relation/i", $e->getMessage(), $m)) throw $e;
                $field = $m[1] ?? ($m[2] ?? '');
                if ($field === '' || !array_key_exists($field, $data)) throw $e;
                unset($data[$field]);
            }
        }
        throw $last ?: new \RuntimeException('No se pudo guardar el pedido.');
    }
}
