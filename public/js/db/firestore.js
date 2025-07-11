import { db, storage, serverTimestamp } from '../firebase/config.js';
import { 
  collection, doc, addDoc, updateDoc, 
  query, where, getDocs, getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ========== CORE FUNCTIONS ========== //
export const registrarMovimentacao = async (dados) => {
  try {
    const docRef = await addDoc(collection(db, "movimentacoes"), {
      ...dados,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pendente' // 'pendente'|'conciliado'|'cancelado'
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao registrar:", error);
    throw new Error("Falha no registro");
  }
};

// ========== COMPROVANTES ========== //
export const anexarComprovante = async (movimentacaoId, arquivo) => {
  try {
    // 1. Upload do arquivo
    const storageRef = ref(storage, `comprovantes/${movimentacaoId}/${arquivo.name}`);
    await uploadBytes(storageRef, arquivo);
    
    // 2. Obter URL pública
    const url = await getDownloadURL(storageRef);
    
    // 3. Atualizar movimentação
    await updateDoc(doc(db, "movimentacoes", movimentacaoId), {
      comprovante: {
        url,
        tipo: arquivo.type,
        nome: arquivo.name,
        dataUpload: serverTimestamp()
      }
    });
    
    return url;
  } catch (error) {
    console.error("Erro no comprovante:", error);
    throw new Error("Falha ao anexar comprovante");
  }
};

// ========== CAIXA DIÁRIO ========== //
export const abrirCaixa = async (valorInicial, usuarioId) => {
  const data = new Date().toISOString().split('T')[0];
  
  await addDoc(collection(db, "caixa"), {
    data,
    saldoInicial: Number(valorInicial),
    usuarioId,
    abertoEm: serverTimestamp(),
    fechadoEm: null,
    saldoFinal: null,
    observacoes: ""
  });
};

export const fecharCaixa = async (saldoFinal, observacoes) => {
  const data = new Date().toISOString().split('T')[0];
  const caixaRef = doc(db, "caixa", data);
  
  await updateDoc(caixaRef, {
    saldoFinal: Number(saldoFinal),
    fechadoEm: serverTimestamp(),
    observacoes,
    status: 'fechado'
  });
};

// ========== RELATÓRIOS ========== //
export const gerarFluxoCaixa = async (periodo) => {
  const q = query(
    collection(db, "movimentacoes"),
    where("data", ">=", periodo.inicio),
    where("data", "<=", periodo.fim)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};