<?php
namespace App\Controllers;

use App\Core\Controller;
use App\Models\UsuarioModel;

final class Auth extends Controller
{
    public function login(): void
    {
        $this->view('auth/login', ['title' => 'Login | BIANTI'], 'layouts/auth');
    }

    public function attempt(): void
    {
        check_csrf();
        $user = trim((string)($_POST['user'] ?? ''));
        $pass = trim((string)($_POST['pass'] ?? ''));
        try {
            $data = (new UsuarioModel())->attempt($user, $pass);
            if (!$data) {
                $_SESSION['flash_error'] = 'Usuario o contraseña incorrectos.';
                redirect_to('admin/login');
            }
            $_SESSION['bianti_user'] = $data;
            redirect_to('admin/dashboard');
        } catch (\Throwable $e) {
            $_SESSION['flash_error'] = 'Error conectando con Supabase: ' . $e->getMessage();
            redirect_to('admin/login');
        }
    }

    public function logout(): void
    {
        unset($_SESSION['bianti_user']);
        redirect_to('admin/login');
    }
}
