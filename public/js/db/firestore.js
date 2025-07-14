// public/js/db/firestore.js

import { db, storage } from '../firebase/config.js';
import { 
  collection, doc, addDoc, updateDoc, getDocs, query, where, getDoc, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/**
 * Registrar movimentação (entrada/saída)
 */
export const adicionarMovimentacao = async (tipo, valor, descricao, categoria) => {
  try {
    const docRef = await addDoc(collection(db, "movimentacoes"), {
      tipo,
      valor: Number(valor),
      descricao,
      categoria,
      data: new Date(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pendente'
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar movimentação:", error);
    return null;
  }
};

/**
 * Calcular saldo atual
 */
export const calcularSaldo = async () => {
  try {
    const snapshot = await getDocs(collection(db, "movimentacoes"));
    let saldo = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.tipo === "entrada") saldo += data.valor;
      else if (data.tipo === "saida") saldo -= data.valor;
    });
    return saldo;
  } catch (error) {
    console.error("Erro ao calcular saldo:", error);
    return 0;
  }
};

/**
 * Carregar histórico completo
 */
export const carregarHistorico = async () => {
  try {
    const q = query(collection(db, "movimentacoes"), orderBy("data", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    return [];
  }
};

/**
 * Filtrar por categoria
 */
export const filtrarPorCategoria = async (categoria) => {
  try {
    const q = query(collection(db, "movimentacoes"), where("categoria", "==", categoria));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao filtrar por categoria:", error);
    return [];
  }
};

/**
 * Funções adicionais (exemplo: anexar comprovante)
 */
export const anexarComprovante = async (movimentacaoId, arquivo) => {
  try {
    const storageRef = ref(storage, `comprovantes/${movimentacaoId}/${arquivo.name}`);
    await uploadBytes(storageRef, arquivo);

    const url = await getDownloadURL(storageRef);

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
    console.error("Erro ao anexar comprovante:", error);
    return null;
  }
};
