import { auth, db } from '../firebase/config.js';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('lancamento-form');
  const list = document.getElementById('lancamentos-list');

  // ✅ Middleware premium
  const hasPremium = await checkPremiumAccess();
  if (!hasPremium) {
    alert('Função premium disponível apenas para planos Pro ou superiores.');
    window.location.href = 'planos.html';
    return;
  }

  const lancamentosRef = collection(db, 'lancamentos');

  // Listener de lançamentos em tempo real
  const q = query(lancamentosRef, orderBy('data', 'desc'));
  onSnapshot(q, (snapshot) => {
    list.innerHTML = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.descricao} - R$ ${data.valor.toFixed(2)} [${data.tipo}]`;
      list.appendChild(li);
    });
  });

  // Salvando novo lançamento
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;

    try {
      await addDoc(lancamentosRef, {
        descricao,
        valor,
        tipo,
        data: new Date()
      });
      form.reset();
      showToast('Lançamento salvo!', 'success');
    } catch (error) {
      showToast('Erro ao salvar: ' + error.message, 'error');
    }
  });
});

// ✅ Função para verificar assinatura premium
async function checkPremiumAccess() {
  const user = auth.currentUser;
  if (!user) return false;

  const userDoc = await getDoc(doc(db, "usuarios", user.uid));
  const data = userDoc.data();
  return data?.plano === 'pro' || data?.plano === 'enterprise';
}

// Função toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
