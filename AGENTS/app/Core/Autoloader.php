<?php
namespace App\Core;

final class Autoloader
{
    public static function register(): void
    {
        spl_autoload_register(function (string $class): void {
            $prefix = 'App\\';
            if (str_starts_with($class, $prefix)) {
                $relative = substr($class, strlen($prefix));
                $file = APPPATH . str_replace('\\', DIRECTORY_SEPARATOR, $relative) . '.php';
                if (is_file($file)) require $file;
            }
        });
    }
}
