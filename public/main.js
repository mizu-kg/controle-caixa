import { auth } from './firebase/config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { CaixaDiario } from './modules/caixa.js';
import { Dashboard } from './ui/dashboard.js';

// ===================
// 🚀 Inicialização
// ===================
document.addEventListener('DOMContentLoaded', () => {
  // 🔐 Verifica autenticação do usuário
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await Dashboard.atualizarSaldo();
        await Dashboard.carregarUltimasMovimentacoes();
      } catch (error) {
        console.error("[Dashboard] Erro ao carregar dados:", error);
      }
    } else {
      console.log("[Auth] Usuário não autenticado");
      // Opcional: redirecionar para tela de login
    }
  });

  // ➡️ Botão fechar caixa
  const btnFecharCaixa = document.getElementById('btn-fechar-caixa');
  if (btnFecharCaixa) {
    btnFecharCaixa.addEventListener('click', async () => {
      const input = prompt("Informe o saldo final:");
      const saldoFinal = parseFloat(input);

      if (isNaN(saldoFinal)) {
        alert("Valor inválido. Tente novamente.");
        return;
      }

      try {
        await CaixaDiario.fecharCaixa(saldoFinal);
        alert("Caixa fechado com sucesso!");
      } catch (error) {
        console.error("[Caixa] Erro ao fechar caixa:", error);
        alert("Erro ao fechar caixa. Consulte o console.");
      }
    });
  } else {
    console.warn("[Init] Botão 'btn-fechar-caixa' não encontrado no DOM.");
  }
});
