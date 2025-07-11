import { db, auth } from '../firebase/config.js';

// Exportar para PDF
export async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Captura dados do Firestore
  const userId = auth.currentUser?.uid;
  const snapshot = await db.collection("movimentacoes")
    .where("userId", "==", userId)
    .get();

  let content = "Histórico de Movimentações:\n\n";
  snapshot.forEach(doc => {
    const data = doc.data();
    content += `${data.data.toDate().toLocaleDateString()} | ${data.descricao} | R$ ${data.valor}\n`;
  });

  doc.text(content, 10, 10);
  doc.save("relatorio-caixa.pdf");
}

// Exportar para Excel
export async function exportToExcel() {
  const XLSX = window.XLSX;
  const userId = auth.currentUser?.uid;
  const snapshot = await db.collection("movimentacoes")
    .where("userId", "==", userId)
    .get();

  const data = [];
  snapshot.forEach(doc => {
    data.push({
      Data: doc.data().data.toDate().toLocaleDateString(),
      Descrição: doc.data().descricao,
      Valor: doc.data().valor,
      Tipo: doc.data().tipo
    });
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, "relatorio-caixa.xlsx");
}