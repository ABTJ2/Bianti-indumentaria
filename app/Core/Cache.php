<?php
namespace App\Core;

final class Cache
{
    private static array $memory = [];

    public static function remember(string $key, int $ttl, callable $callback): mixed
    {
        $key = self::normalize($key);
        if (array_key_exists($key, self::$memory)) return self::$memory[$key];

        $file = self::file($key);
        if (is_file($file)) {
            $payload = json_decode(file_get_contents($file) ?: 'null', true);
            if (is_array($payload) && ($payload['expires'] ?? 0) >= time()) {
                self::$memory[$key] = $payload['value'] ?? null;
                return self::$memory[$key];
            }
        }

        $value = $callback();
        self::$memory[$key] = $value;
        self::write($file, $value, $ttl);
        return $value;
    }

    public static function forgetPrefix(string $prefix = ''): void
    {
        self::$memory = [];
        $prefix = self::normalize($prefix);
        foreach (glob(self::dir() . DIRECTORY_SEPARATOR . '*.json') ?: [] as $file) {
            $name = basename($file, '.json');
            if ($prefix === '' || str_starts_with($name, $prefix)) @unlink($file);
        }
    }

    private static function write(string $file, mixed $value, int $ttl): void
    {
        $dir = dirname($file);
        if (!is_dir($dir) || !is_writable($dir)) return;
        $payload = ['expires' => time() + max(1, $ttl), 'value' => $value];
        @file_put_contents($file, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private static function file(string $key): string
    {
        return self::dir() . DIRECTORY_SEPARATOR . $key . '.json';
    }

    private static function dir(): string
    {
        $dir = ROOTPATH . 'storage' . DIRECTORY_SEPARATOR . 'cache';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        return $dir;
    }

    private static function normalize(string $key): string
    {
        $key = strtolower(preg_replace('/[^a-zA-Z0-9_.-]+/', '_', $key) ?: 'cache');
        return trim($key, '_') ?: 'cache';
    }
}
