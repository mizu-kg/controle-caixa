export class Dashboard {
  static async atualizarSaldo() {
    const saldo = await CaixaDiario.calcularSaldoAtual();
    document.getElementById('saldo-display').textContent = 
      saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  static async carregarUltimasMovimentacoes() {
    const movimentacoes = await CaixaDiario.listarUltimas(10);
    const tbody = document.querySelector('#movimentacoes-table tbody');
    
    tbody.innerHTML = movimentacoes.map(mov => `
      <tr>
        <td>${new Date(mov.data).toLocaleDateString()}</td>
        <td class="${mov.tipo}">${mov.descricao}</td>
        <td>${mov.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td>${mov.comprovante ? '✅' : '❌'}</td>
      </tr>
    `).join('');
  }
}