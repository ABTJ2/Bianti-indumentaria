<?php
namespace App\Core;

final class Performance
{
    private static array $marks = [];

    public static function enabled(): bool
    {
        return filter_var(env_value('DEBUG_PERFORMANCE', 'false'), FILTER_VALIDATE_BOOLEAN);
    }

    public static function mark(string $name): void
    {
        if (!self::enabled()) return;
        self::$marks[$name] = microtime(true);
        error_log('[BIANTI perf] mark ' . $name);
    }

    public static function measure(string $name, float $start): void
    {
        if (!self::enabled()) return;
        $ms = round((microtime(true) - $start) * 1000, 2);
        error_log("[BIANTI perf] {$name}: {$ms} ms");
    }

    public static function measureSince(string $name, string $mark): void
    {
        if (!self::enabled() || !isset(self::$marks[$mark])) return;
        self::measure($name, self::$marks[$mark]);
    }
}
