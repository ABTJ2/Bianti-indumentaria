<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\EventoModel;
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
            (new EventoModel())->log($type, $payload);
            $this->json(['ok' => true]);
        } catch (\Throwable $e) {
            $this->json(['ok' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
