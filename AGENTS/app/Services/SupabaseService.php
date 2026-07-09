<?php
namespace App\Services;

final class SupabaseService
{
    private string $url;
    private string $key;

    public function __construct()
    {
        $this->url = rtrim((string)env_value('SUPABASE_URL', ''), '/');
        $this->key = (string)env_value('SUPABASE_ANON_KEY', '');
        if ($this->url === '' || $this->key === '') {
            throw new \RuntimeException('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en .env');
        }
    }

    public function select(string $table, array $params = []): array
    {
        $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        return $this->request('GET', "/rest/v1/{$table}" . ($query ? '?' . $query : ''));
    }

    public function insert(string $table, array $data): array
    {
        return $this->request('POST', "/rest/v1/{$table}", $data, ['Prefer: return=representation']);
    }

    public function update(string $table, array $data, array $filters): array
    {
        $query = http_build_query($filters, '', '&', PHP_QUERY_RFC3986);
        return $this->request('PATCH', "/rest/v1/{$table}?{$query}", $data, ['Prefer: return=representation']);
    }

    public function delete(string $table, array $filters): array
    {
        $query = http_build_query($filters, '', '&', PHP_QUERY_RFC3986);
        return $this->request('DELETE', "/rest/v1/{$table}?{$query}", null, ['Prefer: return=representation']);
    }

    public function upload(string $bucket, string $path, string $tmpFile, string $mime = 'application/octet-stream'): string
    {
        $endpoint = "/storage/v1/object/{$bucket}/" . ltrim($path, '/');
        $full = $this->url . $endpoint;
        $ch = curl_init($full);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => file_get_contents($tmpFile),
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $this->key,
                'Authorization: Bearer ' . $this->key,
                'Content-Type: ' . $mime,
                'x-upsert: true',
            ],
            CURLOPT_TIMEOUT => 60,
        ]);
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($body === false || $status >= 400) {
            throw new \RuntimeException("Error subiendo archivo a Supabase Storage ({$status}): " . ($body ?: $err));
        }
        return $this->url . "/storage/v1/object/public/{$bucket}/" . ltrim($path, '/');
    }

    private function request(string $method, string $endpoint, ?array $data = null, array $extraHeaders = []): array
    {
        $full = $this->url . $endpoint;
        $headers = array_merge([
            'apikey: ' . $this->key,
            'Authorization: Bearer ' . $this->key,
            'Content-Type: application/json',
            'Accept: application/json',
        ], $extraHeaders);

        $ch = curl_init($full);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 45,
        ]);
        if ($data !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        if ($body === false) throw new \RuntimeException('Supabase no respondió: ' . $err);
        $decoded = $body !== '' ? json_decode($body, true) : [];
        if ($status >= 400) {
            $msg = is_array($decoded) ? json_encode($decoded, JSON_UNESCAPED_UNICODE) : $body;
            throw new \RuntimeException("Error Supabase {$status}: {$msg}");
        }
        return is_array($decoded) ? $decoded : [];
    }
}
