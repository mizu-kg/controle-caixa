import { CaixaDiario } from '../modules/caixa.js';

export class Dashboard {
  /**
   * Atualiza o saldo atual do caixa no DOM
   */
  static async atualizarSaldo() {
    try {
      const saldo = await CaixaDiario.calcularSaldoAtual();
      const saldoDisplay = document.getElementById('saldo-display');

      if (saldoDisplay) {
        saldoDisplay.textContent = saldo.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        saldoDisplay.style.color = saldo >= 0 ? 'green' : 'red';
      } else {
        console.warn("[Dashboard] Elemento 'saldo-display' não encontrado.");
      }
    } catch (error) {
      console.error("[Dashboard] Erro ao atualizar saldo:", error);
    }
  }

  /**
   * Carrega e exibe as últimas movimentações no dashboard
   */
  static async carregarUltimasMovimentacoes(limite = 10) {
    try {
      const movimentacoes = await CaixaDiario.listarUltimas(limite);
      const tbody = document.querySelector('#movimentacoes-table tbody');

      if (!tbody) {
        console.warn("[Dashboard] Tabela de movimentações não encontrada.");
        return;
      }

      if (movimentacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Nenhuma movimentação registrada.</td></tr>`;
        return;
      }

      tbody.innerHTML = movimentacoes.map(mov => `
        <tr>
          <td>${new Date(mov.data).toLocaleDateString()}</td>
          <td class="${mov.tipo}">${mov.descricao}</td>
          <td>${mov.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          <td>${mov.comprovante ? '✅' : '❌'}</td>
        </tr>
      `).join('');
    } catch (error) {
      console.error("[Dashboard] Erro ao carregar movimentações:", error);
    }
  }
}
