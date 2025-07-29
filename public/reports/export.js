// public/js/export.js

import { db, auth } from '../js/firebase/config.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Exportar movimentações para PDF usando jsPDF
 */
export async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const userId = auth.currentUser?.uid;
  if (!userId) {
    alert("Usuário não autenticado.");
    return;
  }

  // Captura dados do Firestore
  const q = query(
    collection(db, "movimentacoes"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  let content = "Histórico de Movimentações:\n\n";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const dateStr = data.data?.toDate().toLocaleDateString('pt-BR') || '-';
    content += `${dateStr} | ${data.descricao} | R$ ${data.valor.toFixed(2)}\n`;
  });

  doc.text(content, 10, 10);
  doc.save("relatorio-caixa.pdf");
}

/**
 * Exportar movimentações para Excel usando SheetJS
 */
export async function exportToExcel() {
  const XLSX = window.XLSX;
  const userId = auth.currentUser?.uid;
  if (!userId) {
    alert("Usuário não autenticado.");
    return;
  }

  const q = query(
    collection(db, "movimentacoes"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  const data = [];
  snapshot.forEach(docSnap => {
    const mov = docSnap.data();
    data.push({
      Data: mov.data?.toDate().toLocaleDateString('pt-BR') || '-',
      Descrição: mov.descricao,
      Valor: mov.valor,
      Tipo: mov.tipo
    });
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, "relatorio-caixa.xlsx");
}
