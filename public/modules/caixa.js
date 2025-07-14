import { 
  registrarMovimentacao, 
  anexarComprovante,
  abrirCaixa,
  fecharCaixa
} from '../db/firestore.js';

/**
 * Classe responsável pelo controle diário de caixa.
 */
export class CaixaDiario {

  /**
   * Registra uma venda como entrada no caixa.
   * @param {Object} venda - Dados da venda
   * @param {number} venda.total - Valor total da venda
   * @param {string} venda.formaPagamento - Forma de pagamento
   * @param {string|number} venda.numero - Número/identificação da venda
   * @param {File} [venda.comprovante] - Comprovante opcional
   * @returns {Promise<string>} ID do documento de movimentação
   */
  static async registrarVenda(venda) {
    try {
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

      console.log(`[CaixaDiario] Venda registrada: ${movId}`);
      return movId;
    } catch (error) {
      console.error("[CaixaDiario] Erro ao registrar venda:", error);
      throw error;
    }
  }

  /**
   * Registra uma despesa como saída no caixa.
   * @param {Object} despesa - Dados da despesa
   * @param {number} despesa.valor - Valor da despesa
   * @param {string} despesa.tipo - Tipo/categoria da despesa
   * @param {string} despesa.descricao - Descrição detalhada
   * @param {File} [despesa.comprovante] - Comprovante opcional
   * @returns {Promise<string>} ID do documento de movimentação
   */
  static async registrarDespesa(despesa) {
    try {
      const movId = await registrarMovimentacao({
        tipo: 'saida',
        categoria: despesa.tipo,
        valor: despesa.valor,
        descricao: despesa.descricao
      });

      if (despesa.comprovante) {
        await anexarComprovante(movId, despesa.comprovante);
      }

      console.log(`[CaixaDiario] Despesa registrada: ${movId}`);
      return movId;
    } catch (error) {
      console.error("[CaixaDiario] Erro ao registrar despesa:", error);
      throw error;
    }
  }

  /**
   * Conciliação automática de movimentações bancárias.
   * Implementação futura.
   */
  static async reconciliacaoAutomatica() {
    console.warn("[CaixaDiario] Função de conciliação automática ainda não implementada.");
    // Exemplo de lógica futura:
    // 1. Buscar extrato bancário
    // 2. Comparar com movimentações registradas
    // 3. Marcar conciliações automáticas
  }

  /**
   * Abre o caixa do dia com saldo inicial.
   * @param {number} valorInicial - Valor inicial do caixa
   * @param {string} usuarioId - ID do usuário que abriu o caixa
   */
  static async abrirCaixaDiario(valorInicial, usuarioId) {
    try {
      await abrirCaixa(valorInicial, usuarioId);
      console.log("[CaixaDiario] Caixa diário aberto com sucesso.");
    } catch (error) {
      console.error("[CaixaDiario] Erro ao abrir caixa:", error);
      throw error;
    }
  }

  /**
   * Fecha o caixa do dia com saldo final e observações.
   * @param {number} saldoFinal - Valor final do caixa
   * @param {string} observacoes - Observações de fechamento
   */
  static async fecharCaixaDiario(saldoFinal, observacoes) {
    try {
      await fecharCaixa(saldoFinal, observacoes);
      console.log("[CaixaDiario] Caixa diário fechado com sucesso.");
    } catch (error) {
      console.error("[CaixaDiario] Erro ao fechar caixa:", error);
      throw error;
    }
  }
}
