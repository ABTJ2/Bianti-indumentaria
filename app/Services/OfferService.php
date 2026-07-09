<?php
namespace App\Services;

use App\Core\Cache;

final class OfferService
{
    private string $file;
    public function __construct()
    {
        $dir = ROOTPATH . 'storage';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        $this->file = $dir . DIRECTORY_SEPARATOR . 'ofertas.json';
        if (!is_file($this->file)) file_put_contents($this->file, json_encode([], JSON_PRETTY_PRINT));
    }
    public function all(): array
    {
        $data = json_decode(file_get_contents($this->file) ?: '[]', true);
        return is_array($data) ? $data : [];
    }
    public function active(): array
    {
        $now = time();
        return array_values(array_filter($this->all(), function ($o) use ($now) {
            if (empty($o['active'])) return false;
            if (empty($o['hasta'])) return true;
            $until = strtotime((string)$o['hasta']);
            return $until === false || $until >= $now;
        }));
    }
    public function byProduct(): array
    {
        $map = [];
        foreach ($this->active() as $o) $map[(string)$o['producto_id']] = $o;
        return $map;
    }
    public function save(array $offer): void
    {
        $all = $this->all();
        $pid = (string)$offer['producto_id'];
        $all = array_values(array_filter($all, fn($o) => (string)($o['producto_id'] ?? '') !== $pid));
        $all[] = $offer;
        file_put_contents($this->file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        Cache::forgetPrefix('bianti_');
    }
    public function delete(string $productoId): void
    {
        $all = array_values(array_filter($this->all(), fn($o) => (string)($o['producto_id'] ?? '') !== (string)$productoId));
        file_put_contents($this->file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        Cache::forgetPrefix('bianti_');
    }
}
