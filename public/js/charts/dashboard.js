import { db, auth } from '../firebase/config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function renderCashFlowChart() {
  const ctx = document.getElementById("cashflow-chart").getContext("2d");
  const user = auth.currentUser;

  if (!user) {
    console.warn("[Dashboard] Usuário não autenticado. Gráfico não será carregado.");
    return;
  }

  // 🔎 Consulta Firestore com segurança
  const movimentacoesRef = collection(db, "movimentacoes");
  const q = query(movimentacoesRef, where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  // ✅ Processa resultados
  const agrupados = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const date = data.data.toDate().toLocaleDateString("pt-BR");

    if (!agrupados[date]) {
      agrupados[date] = { entrada: 0, saida: 0 };
    }

    if (data.tipo === "entrada") {
      agrupados[date].entrada += data.valor;
    } else if (data.tipo === "saida") {
      agrupados[date].saida += data.valor;
    }
  });

  // 📊 Prepara dados para Chart.js
  const labels = Object.keys(agrupados).sort((a, b) => {
    const [d1, m1, y1] = a.split('/').map(Number);
    const [d2, m2, y2] = b.split('/').map(Number);
    return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
  });

  const entradas = labels.map(date => agrupados[date].entrada);
  const saidas = labels.map(date => agrupados[date].saida);

  // 🖌️ Renderiza gráfico
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Entradas',
          data: entradas,
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Saídas',
          data: saidas,
          backgroundColor: '#F44336'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'Fluxo de Caixa por Dia'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `R$ ${value.toFixed(2)}`
          }
        }
      }
    }
  });
}
