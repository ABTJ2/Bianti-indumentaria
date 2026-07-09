<?php
namespace App\Services;

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
        $today = date('Y-m-d');
        return array_values(array_filter($this->all(), fn($o) => !empty($o['active']) && (empty($o['hasta']) || $o['hasta'] >= $today)));
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
    }
    public function delete(string $productoId): void
    {
        $all = array_values(array_filter($this->all(), fn($o) => (string)($o['producto_id'] ?? '') !== (string)$productoId));
        file_put_contents($this->file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
