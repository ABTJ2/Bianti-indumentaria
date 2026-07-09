<?php
namespace App\Models;
final class PedidoModel extends BaseSupabaseModel
{
    protected string $table = 'pedidos';
    public function recent(): array { return $this->all(['select' => '*', 'order' => 'created_at.desc', 'limit' => 200]); }
    public function setEstado(int $id, string $estado): array
    {
        $data=['estado'=>$estado,'updated_at'=>date('c')];
        if($estado==='vendido') $data['vendido_at']=date('c');
        return $this->updateById($id,$data);
    }
}
