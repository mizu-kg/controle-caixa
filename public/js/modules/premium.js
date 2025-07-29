import { auth, db } from '../firebase/config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export async function checkPremiumAccess(requiredPlan = 'Pro') {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert('Faça login para acessar.');
        window.location.href = 'index.html';
        return reject('Usuário não logado');
      }

      try {
        const subRef = doc(db, "subscriptions", user.uid);
        const subSnap = await getDoc(subRef);

        if (!subSnap.exists()) {
          alert('Você não possui plano ativo.');
          window.location.href = 'planos.html';
          return reject('Sem assinatura');
        }

        const data = subSnap.data();
        if (data.status !== 'active') {
          alert('Seu plano está inativo.');
          window.location.href = 'planos.html';
          return reject('Plano inativo');
        }

        if (requiredPlan === 'Pro' && data.plan === 'Free') {
          alert('Este recurso é exclusivo para assinantes Pro.');
          window.location.href = 'planos.html';
          return reject('Plano insuficiente');
        }

        if (requiredPlan === 'Premium' && data.plan !== 'Premium') {
          alert('Este recurso é exclusivo para assinantes Premium.');
          window.location.href = 'planos.html';
          return reject('Plano insuficiente');
        }

        // Passou em todas as validações
        resolve(data);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        alert('Erro ao verificar assinatura. Tente novamente.');
        window.location.href = 'planos.html';
        reject(error);
      }
    });
  });
}
