import { db, auth } from '../firebase/config.js';

export async function renderCashFlowChart() {
  const ctx = document.getElementById("cashflow-chart").getContext("2d");
  const userId = auth.currentUser?.uid;
  const snapshot = await db.collection("movimentacoes")
    .where("userId", "==", userId)
    .get();

  const labels = [];
  const entradas = [];
  const saidas = [];

  // Agrupa por data (simplificado)
  snapshot.forEach(doc => {
    const data = doc.data();
    const date = data.data.toDate().toLocaleDateString();
    if (!labels.includes(date)) labels.push(date);
    
    if (data.tipo === "entrada") {
      entradas[labels.indexOf(date)] = (entradas[labels.indexOf(date)] || 0) + data.valor;
    } else {
      saidas[labels.indexOf(date)] = (saidas[labels.indexOf(date)] || 0) + data.valor;
    }
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Entradas', data: entradas, backgroundColor: '#4CAF50' },
        { label: 'Saídas', data: saidas, backgroundColor: '#F44336' }
      ]
    },
    options: { responsive: true }
  });
}