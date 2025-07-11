import { 
  registrarMovimentacao, 
  anexarComprovante,
  abrirCaixa,
  fecharCaixa
} from '../db/firestore.js';

export class CaixaDiario {
  static async registrarVenda(venda) {
    const movId = await registrarMovimentacao({
      tipo: 'entrada',
      categoria: 'venda',
      valor: venda.total,
      formaPagamento: venda.formaPagamento,
      descricao: `Venda ${venda.numero}`
    });
    
    if (venda.comprovante) {
      await anexarComprovante(movId, venda.comprovante);
    }
    
    return movId;
  }

  static async registrarDespesa(despesa) {
    const movId = await registrarMovimentacao({
      tipo: 'saida',
      categoria: despesa.tipo,
      valor: despesa.valor,
      descricao: despesa.descricao
    });
    
    if (despesa.comprovante) {
      await anexarComprovante(movId, despesa.comprovante);
    }
    
    return movId;
  }

  static async reconciliacaoAutomatica() {
    // Implementar lógica de conciliação bancária
  }
}