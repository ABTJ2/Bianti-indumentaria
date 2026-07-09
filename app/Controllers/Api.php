<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\EventoModel;
use App\Models\PedidoModel;
use App\Models\ProductoModel;

final class Api extends Controller
{
    public function productos(): void
    {
        try {
            $rows = (new ProductoModel())->catalogo($_GET);
            $this->json(['ok' => true, 'productos' => $rows]);
        } catch (\Throwable $e) {
            $this->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function evento(): void
    {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $type = (string)($body['type'] ?? 'event');
        $payload = is_array($body['payload'] ?? null) ? $body['payload'] : [];
        try {
            $result = (new EventoModel())->log($type, $payload);
            $this->json(['ok' => empty($result['skipped']), 'warning' => $result['warning'] ?? null]);
        } catch (\Throwable $e) {
            $this->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function pedido(): void
    {
        $body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
        $productoId = (int)($body['producto_id'] ?? $body['id'] ?? 0);
        try {
            if ($productoId <= 0) {
                $this->json(['ok' => false, 'error' => 'producto_id es obligatorio'], 422);
                return;
            }
            $producto = (new ProductoModel())->hydratedFind($productoId);
            if (!$producto) throw new \RuntimeException('Producto inexistente.');
            $created = (new PedidoModel())->createConsulta($producto, trim((string)($body['mensaje'] ?? '')));
            $this->json(['ok' => true, 'pedido' => $created[0] ?? null]);
        } catch (\Throwable $e) {
            $this->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
