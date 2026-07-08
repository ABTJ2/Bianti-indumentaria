<?php
/** @var \App\Core\Router $router */
$router->get('', 'Catalogo::index');
$router->get('catalogo', 'Catalogo::index');
$router->get('categoria/(:num)', 'Catalogo::categoria');

$router->get('api/catalogo/productos', 'Api::productos');
$router->post('api/eventos', 'Api::evento');
$router->post('api/pedidos', 'Api::pedido');

$router->get('admin', 'Admin\\Dashboard::index');
$router->get('admin/login', 'Auth::login');
$router->post('admin/login', 'Auth::attempt');
$router->get('admin/logout', 'Auth::logout');

$router->get('admin/dashboard', 'Admin\\Dashboard::index');
$router->get('admin/productos', 'Admin\\Productos::index');
$router->get('admin/productos/nuevo', 'Admin\\Productos::nuevo');
$router->post('admin/productos/guardar', 'Admin\\Productos::crear');
$router->get('admin/productos/editar/(:num)', 'Admin\\Productos::editar');
$router->post('admin/productos/guardar/(:num)', 'Admin\\Productos::guardar');
$router->post('admin/productos/toggle/(:num)', 'Admin\\Productos::toggle');
$router->post('admin/productos/eliminar/(:num)', 'Admin\\Productos::eliminar');
$router->get('admin/categorias', 'Admin\\Categorias::index');
$router->get('admin/importar-productos', 'Admin\\Importar::index');
$router->get('admin/pedidos', 'Admin\\Pedidos::index');
$router->get('admin/pedidos/detalle/(:num)', 'Admin\\Pedidos::detalle');
$router->get('admin/metricas', 'Admin\\Metricas::index');
$router->get('admin/estadisticas', 'Admin\\Estadisticas::index');
$router->get('admin/contabilidad', 'Admin\\Contabilidad::index');
$router->get('admin/ofertas', 'Admin\\Ofertas::index');

$router->post('admin/categorias/crear', 'Admin\Categorias::crear');
$router->post('admin/categorias/actualizar/(:num)', 'Admin\Categorias::actualizar');
$router->post('admin/categorias/eliminar/(:num)', 'Admin\Categorias::eliminar');
$router->post('admin/pedidos/estado/(:num)', 'Admin\Pedidos::estado');
$router->post('admin/pedidos/eliminar/(:num)', 'Admin\Pedidos::eliminar');
$router->post('admin/metricas/limpiar-huerfanas', 'Admin\Metricas::limpiarHuerfanas');
$router->post('admin/metricas/resetear', 'Admin\Metricas::resetear');
$router->post('admin/estadisticas/resetear', 'Admin\Estadisticas::resetear');
$router->post('admin/ofertas/guardar', 'Admin\Ofertas::guardar');
$router->post('admin/ofertas/eliminar/(:num)', 'Admin\Ofertas::eliminar');
