<?php
namespace App\Controllers\Admin;

use App\Core\Controller;
use App\Models\PedidoModel;
use App\Models\ProductoModel;
use App\Models\VentaModel;

final class Contabilidad extends Controller
{
    public function index(): void
    {
        $this->requireAuth();

        $productos = (new ProductoModel())->accountingRows();
        $ventaModel = new VentaModel();
        $ventas = $ventaModel->ventas();
        $manuales = $ventaModel->manuales();
        $pedidos = (new PedidoModel())->recent();

        $productMap = [];
        $inversionTotal = 0.0;
        $productosSinCosto = 0;
        foreach ($productos as $p) {
            $id = (string)($p['id'] ?? '');
            if ($id !== '') $productMap[$id] = $p;
            $costo = (float)($p['precio_costo'] ?? 0);
            if ($costo > 0) $inversionTotal += $costo;
            else $productosSinCosto++;
        }

        $ventasPedidoIds = [];
        $operaciones = [];
        foreach ($ventas as $venta) {
            $op = $this->ventaOperacion($venta, $productMap, 'venta');
            if ($op) {
                $operaciones[] = $op;
                if (!empty($venta['pedido_id'])) $ventasPedidoIds[(string)$venta['pedido_id']] = true;
                if (!empty($venta['nota']) && preg_match('/pedido\s*#?(\d+)/i', (string)$venta['nota'], $m)) $ventasPedidoIds[$m[1]] = true;
            }
        }
        foreach ($manuales as $manual) {
            $op = $this->ventaOperacion($manual, $productMap, 'manual');
            if ($op) $operaciones[] = $op;
        }
        foreach ($pedidos as $pedido) {
            if (($pedido['estado'] ?? '') !== 'vendido') continue;
            $pedidoId = (string)($pedido['id'] ?? '');
            if ($pedidoId !== '' && isset($ventasPedidoIds[$pedidoId])) continue;
            $op = $this->pedidoOperacion($pedido, $productMap);
            if ($op) $operaciones[] = $op;
        }

        $periodo = $this->periodoDesdeGet();
        $operacionesFiltradas = array_values(array_filter($operaciones, fn($op) => $this->inPeriod($op['date'], $periodo)));
        $contabilidad = $this->buildAccountingData($operacionesFiltradas, $inversionTotal, $productosSinCosto, $periodo);

        $this->view('admin/contabilidad/index', compact('productos', 'ventas', 'manuales', 'pedidos', 'periodo', 'contabilidad'), 'layouts/admin');
    }

    private function ventaOperacion(array $row, array $productMap, string $source): ?array
    {
        $cantidad = max(1, (int)($row['cantidad'] ?? 1));
        $total = $this->totalFromRow($row, ['total'], ['precio_final', 'precio', 'producto_precio'], $cantidad);
        if ($total <= 0) return null;
        $productId = (string)($row['producto_id'] ?? '');
        $producto = $productId !== '' ? ($productMap[$productId] ?? null) : null;
        $titulo = (string)($row['producto_titulo'] ?? $producto['titulo'] ?? 'Venta manual');
        $costo = $this->costFromRowOrProduct($row, $producto, $cantidad);
        return [
            'source' => $source,
            'date' => $this->safeDate($row['fecha'] ?? $row['created_at'] ?? null),
            'producto_id' => $productId,
            'titulo' => $titulo,
            'cantidad' => $cantidad,
            'total' => $total,
            'costo' => $costo,
            'ganancia' => $costo !== null ? $total - $costo : null,
        ];
    }

    private function pedidoOperacion(array $row, array $productMap): ?array
    {
        $cantidad = max(1, (int)($row['vendido_cantidad'] ?? $row['cantidad'] ?? 1));
        $total = $this->totalFromRow($row, ['vendido_total', 'total'], ['vendido_precio_final', 'precio_final', 'producto_precio'], $cantidad);
        if ($total <= 0) return null;
        $productId = (string)($row['producto_id'] ?? '');
        $producto = $productId !== '' ? ($productMap[$productId] ?? null) : null;
        $costo = $this->costFromRowOrProduct($row, $producto, $cantidad);
        return [
            'source' => 'pedido',
            'date' => $this->safeDate($row['vendido_at'] ?? $row['updated_at'] ?? $row['created_at'] ?? null),
            'producto_id' => $productId,
            'titulo' => (string)($row['producto_titulo'] ?? $producto['titulo'] ?? 'Pedido vendido'),
            'cantidad' => $cantidad,
            'total' => $total,
            'costo' => $costo,
            'ganancia' => $costo !== null ? $total - $costo : null,
        ];
    }

    private function totalFromRow(array $row, array $totalFields, array $unitFields, int $cantidad): float
    {
        foreach ($totalFields as $field) {
            if (isset($row[$field]) && is_numeric($row[$field]) && (float)$row[$field] > 0) return (float)$row[$field];
        }
        foreach ($unitFields as $field) {
            if (isset($row[$field]) && is_numeric($row[$field]) && (float)$row[$field] > 0) return (float)$row[$field] * $cantidad;
        }
        return 0.0;
    }

    private function costFromRowOrProduct(array $row, ?array $producto, int $cantidad): ?float
    {
        foreach (['costo_total', 'precio_costo_total'] as $field) {
            if (isset($row[$field]) && is_numeric($row[$field]) && (float)$row[$field] > 0) return (float)$row[$field];
        }
        foreach (['precio_costo', 'costo'] as $field) {
            if (isset($row[$field]) && is_numeric($row[$field]) && (float)$row[$field] > 0) return (float)$row[$field] * $cantidad;
        }
        $costoProducto = (float)($producto['precio_costo'] ?? 0);
        return $costoProducto > 0 ? $costoProducto * $cantidad : null;
    }

    private function buildAccountingData(array $operaciones, float $inversionTotal, int $productosSinCosto, array $periodo): array
    {
        $ingresos = 0.0;
        $costoRecuperado = 0.0;
        $ganancia = 0.0;
        $sinCosto = 0;
        $porMesIngresos = [];
        $porMesVentas = [];
        $porMesGanancia = [];
        $top = [];

        foreach ($operaciones as $op) {
            $month = substr($op['date'], 0, 7);
            $ingresos += $op['total'];
            $porMesIngresos[$month] = ($porMesIngresos[$month] ?? 0) + $op['total'];
            $porMesVentas[$month] = ($porMesVentas[$month] ?? 0) + 1;
            if ($op['costo'] !== null) {
                $costoRecuperado += $op['costo'];
                $ganancia += (float)$op['ganancia'];
                $porMesGanancia[$month] = ($porMesGanancia[$month] ?? 0) + (float)$op['ganancia'];
                $key = $op['producto_id'] !== '' ? $op['producto_id'] : mb_strtolower($op['titulo']);
                $top[$key]['titulo'] = $op['titulo'];
                $top[$key]['ganancia'] = ($top[$key]['ganancia'] ?? 0) + (float)$op['ganancia'];
                $top[$key]['cantidad'] = ($top[$key]['cantidad'] ?? 0) + $op['cantidad'];
            } else {
                $sinCosto++;
            }
        }

        usort($top, fn($a, $b) => ((float)$b['ganancia']) <=> ((float)$a['ganancia']));
        $activa = max(0, $inversionTotal - $costoRecuperado);
        $operacionesCount = count($operaciones);
        $months = $this->chartMonths($operaciones, $periodo);

        return [
            'kpis' => [
                'inversion_total' => $inversionTotal,
                'inversion_recuperada' => $costoRecuperado,
                'inversion_activa' => $activa,
                'ingresos' => $ingresos,
                'ganancia_real' => $ganancia,
                'caja_total' => $ingresos,
                'caja_libre' => max(0, $ingresos - $activa),
                'operaciones' => $operacionesCount,
                'ticket_promedio' => $operacionesCount ? $ingresos / $operacionesCount : 0,
            ],
            'warnings' => [
                'productos_sin_costo' => $productosSinCosto,
                'operaciones_sin_costo' => $sinCosto,
            ],
            'charts' => [
                'ingresos_mes' => $this->series($months, $porMesIngresos),
                'ventas_mes' => $this->series($months, $porMesVentas),
                'ganancia_mes' => $this->series($months, $porMesGanancia),
                'inversion' => [
                    ['label' => 'Recuperada', 'value' => $costoRecuperado],
                    ['label' => 'Pendiente', 'value' => $activa],
                ],
                'top_ganancia' => array_slice($top, 0, 8),
            ],
        ];
    }

    private function periodoDesdeGet(): array
    {
        $tipo = (string)($_GET['periodo'] ?? 'anio');
        $today = new \DateTimeImmutable('today');
        if ($tipo === 'rango') {
            $from = $this->dateOrNull($_GET['desde'] ?? null) ?? $today->modify('-12 months');
            $to = $this->dateOrNull($_GET['hasta'] ?? null) ?? $today;
            if ($from > $to) [$from, $to] = [$to, $from];
            return ['tipo' => $tipo, 'from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d')];
        }
        $from = match ($tipo) {
            'mes' => $today->modify('first day of this month'),
            'trimestre' => $today->modify('-3 months'),
            'semestre' => $today->modify('-6 months'),
            'todo' => new \DateTimeImmutable('2000-01-01'),
            default => $today->modify('-12 months'),
        };
        if (!in_array($tipo, ['mes', 'trimestre', 'semestre', 'anio', 'todo'], true)) $tipo = 'anio';
        return ['tipo' => $tipo, 'from' => $from->format('Y-m-d'), 'to' => $today->format('Y-m-d')];
    }

    private function inPeriod(string $date, array $periodo): bool
    {
        $day = substr($date, 0, 10);
        return $day >= $periodo['from'] && $day <= $periodo['to'];
    }

    private function chartMonths(array $operaciones, array $periodo): array
    {
        if (!$operaciones) return [];
        $months = [];
        foreach ($operaciones as $op) $months[substr($op['date'], 0, 7)] = true;
        $months = array_keys($months);
        sort($months);
        return array_slice($months, -12);
    }

    private function series(array $months, array $values): array
    {
        return array_map(fn($month) => ['label' => $month, 'value' => (float)($values[$month] ?? 0)], $months);
    }

    private function safeDate(mixed $value): string
    {
        $time = strtotime((string)$value);
        return $time ? date('Y-m-d', $time) : date('Y-m-d');
    }

    private function dateOrNull(mixed $value): ?\DateTimeImmutable
    {
        if (!$value) return null;
        $time = strtotime((string)$value);
        return $time ? new \DateTimeImmutable(date('Y-m-d', $time)) : null;
    }
}
