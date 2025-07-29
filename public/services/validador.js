import { db } from '../js/firebase/config.js';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  setDoc, 
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { jsPDF } from "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

// Configurações
const CONFIG = {
  LOG_COLLECTION: "logs_validador",
  BATCH_SIZE: 100,
  DEFAULT_VALUES: {
    movimentacoes: {
      status: 'pendente',
      updatedAt: serverTimestamp()
    },
    usuarios: {
      nivelAcesso: 'colaborador'
    },
    caixa: {
      observacoes: ''
    }
  }
};

/**
 * 🔍 Valida documentos em uma coleção com tratamento de erros
 */
async function validarColecao(nomeColecao, validacoes) {
  try {
    console.log(`[Validador] Validando coleção: ${nomeColecao}`);
    
    const snapshot = await getDocs(collection(db, nomeColecao));
    const batch = writeBatch(db);
    const resultados = [];
    let processed = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const atualizacoes = {};

      for (const [campo, valorPadrao] of Object.entries(validacoes)) {
        if (data[campo] === undefined || data[campo] === null || data[campo] === '') {
          atualizacoes[campo] = typeof valorPadrao === 'function' ? valorPadrao() : valorPadrao;
        }
      }

      if (Object.keys(atualizacoes).length > 0) {
        batch.update(doc(db, nomeColecao, docSnap.id), atualizacoes);
        resultados.push({ id: docSnap.id, correcoes: atualizacoes });
        processed++;

        // Commit batch periodicamente para evitar timeout
        if (processed % CONFIG.BATCH_SIZE === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
    }

    // Commit final
    if (processed % CONFIG.BATCH_SIZE > 0) {
      await batch.commit();
    }

    // Log sumarizado
    if (resultados.length > 0) {
      await setDoc(doc(collection(db, CONFIG.LOG_COLLECTION)), {
        colecao: nomeColecao,
        totalCorrigido: resultados.length,
        timestamp: serverTimestamp()
      });
    }

    console.log(`[Validador] ${nomeColecao}: ${resultados.length} documentos corrigidos`);
    return resultados;

  } catch (error) {
    console.error(`[Validador] Erro na coleção ${nomeColecao}:`, error);
    throw new Error(`Falha na validação de ${nomeColecao}`);
  }
}

/**
 * 🔧 Valida todas as coleções configuradas
 */
export async function validarTudo() {
  try {
    console.time("[Validador] Tempo total");
    const resultados = {};

    for (const [colecao, validacoes] of Object.entries(CONFIG.DEFAULT_VALUES)) {
      resultados[colecao] = await validarColecao(colecao, validacoes);
    }

    console.timeEnd("[Validador] Tempo total");
    return resultados;

  } catch (error) {
    console.error("[Validador] Erro geral:", error);
    throw error;
  }
}

/**
 * 📊 Gera relatório formatado
 */
function formatarRelatorio(resultados) {
  return Object.entries(resultados).flatMap(([colecao, docs]) => 
    docs.flatMap(doc => 
      Object.entries(doc.correcoes).map(([campo, valor]) => ({
        colecao,
        documento: doc.id,
        campo,
        valor: typeof valor === 'object' ? JSON.stringify(valor) : valor
      }))
    )
  );
}

/**
 * 📝 Gerar relatório PDF otimizado
 */
export async function gerarRelatorioPDF(resultados) {
  try {
    const doc = new jsPDF();
    const dados = formatarRelatorio(resultados);
    
    // Cabeçalho
    doc.setFontSize(16);
    doc.text("Relatório de Validação", 105, 15, null, null, 'center');
    doc.setFontSize(10);
    
    // Corpo
    let y = 30;
    dados.forEach((item, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(`${index+1}. ${item.colecao} > ${item.documento}`, 10, y);
      doc.text(`Campo: ${item.campo} | Valor: ${item.valor}`, 15, y+5);
      y += 10;
    });

    doc.save("relatorio-validacao.pdf");
    return true;
    
  } catch (error) {
    console.error("[Validador] Erro ao gerar PDF:", error);
    throw error;
  }
}

/**
 * 📊 Gerar relatório Excel otimizado
 */
export async function gerarRelatorioCSV(resultados) {
  try {
    const dados = formatarRelatorio(resultados);
    const ws = XLSX.utils.json_to_sheet(dados);
    
    // Auto-fit columns
    const wscols = [
      {wch: 15}, // colecao
      {wch: 20}, // documento
      {wch: 20}, // campo
      {wch: 30}  // valor
    ];
    ws['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Validação");
    XLSX.writeFile(wb, "relatorio-validacao.xlsx");
    return true;
    
  } catch (error) {
    console.error("[Validador] Erro ao gerar Excel:", error);
    throw error;
  }
}

// Inicialização
console.log("[Validador] Módulo pronto para uso");
console.log("[Validador] Coleções configuradas:", Object.keys(CONFIG.DEFAULT_VALUES));