<?php
// BIANTI - Front Controller estilo CodeIgniter/MVC.
// Corre en XAMPP sin dependencias externas.
declare(strict_types=1);

session_start();

define('ROOTPATH', dirname(__DIR__) . DIRECTORY_SEPARATOR);
define('APPPATH', ROOTPATH . 'app' . DIRECTORY_SEPARATOR);
define('PUBLICPATH', __DIR__ . DIRECTORY_SEPARATOR);

require APPPATH . 'Core/functions.php';
require APPPATH . 'Core/Autoloader.php';

\App\Core\Autoloader::register();
\App\Core\Env::load(ROOTPATH . '.env');

$router = new \App\Core\Router();
require APPPATH . 'Config/Routes.php';
$router->dispatch();
