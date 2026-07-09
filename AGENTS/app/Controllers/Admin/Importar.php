<?php
namespace App\Controllers\Admin;
use App\Core\Controller;
final class Importar extends Controller
{
  public function index(): void { $this->requireAuth(); $this->view('admin/importar/index', [], 'layouts/admin'); }
}
