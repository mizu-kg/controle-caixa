import { auth } from './firebase/config.js';
import { CaixaDiario } from './modules/caixa.js';
import { Dashboard } from './ui/dashboard.js';

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  // Verifica autenticação
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await Dashboard.atualizarSaldo();
      await Dashboard.carregarUltimasMovimentacoes();
    }
  });
  
  // Event Listeners
  document.getElementById('btn-fechar-caixa').addEventListener('click', async () => {
    const saldoFinal = parseFloat(prompt("Informe o saldo final:"));
    await CaixaDiario.fecharCaixa(saldoFinal);
    alert("Caixa fechado com sucesso!");
  });
});