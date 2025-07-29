import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { jsPDF } from "jspdf";

const db = getFirestore();
const bucket = getStorage().bucket();

export const relatorioMensal = onRequest(async (req, res) => {
  const now = new Date();
  const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth();
  const ano = mesAnterior === 12 ? now.getFullYear() - 1 : now.getFullYear();

  // Consultas
  const uploadsSnap = await db.collection('uploads')
    .where('createdAt', '>=', new Date(`${ano}-${mesAnterior}-01`))
    .where('createdAt', '<', new Date(`${ano}-${mesAnterior+1}-01`))
    .get();

  const lancSnap = await db.collection('lancamentos')
    .where('createdAt', '>=', new Date(`${ano}-${mesAnterior}-01`))
    .where('createdAt', '<', new Date(`${ano}-${mesAnterior+1}-01`))
    .get();

  let entradas = 0, saidas = 0;
  lancSnap.forEach(doc => {
    const l = doc.data();
    if (l.tipo === "entrada") entradas += l.valor;
    if (l.tipo === "saida") saidas += l.valor;
  });

  // Gera PDF
  const doc = new jsPDF();
  doc.text(`Relatório ${mesAnterior}/${ano}`, 10, 10);
  doc.text(`Uploads: ${uploadsSnap.size}`, 10, 20);
  doc.text(`Entradas: R$ ${entradas.toFixed(2)}`, 10, 30);
  doc.text(`Saídas: R$ ${saidas.toFixed(2)}`, 10, 40);
  doc.text(`Saldo: R$ ${(entradas - saidas).toFixed(2)}`, 10, 50);

  const buffer = doc.output('arraybuffer');

  const file = bucket.file(`relatorios/relatorio_${mesAnterior}_${ano}.pdf`);
  await file.save(Buffer.from(buffer));

  await db.collection('relatorios_mensais').add({
    mes: `${mesAnterior}/${ano}`,
    uploads: uploadsSnap.size,
    entradas,
    saidas,
    saldo: entradas - saidas,
    pdf_url: file.publicUrl(),
    createdAt: new Date()
  });

  res.send('Relatório mensal gerado com sucesso.');
});
