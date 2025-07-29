// public/js/dashboard.js

import { auth } from './firebase/config.js';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Função para atualizar saldo (exemplo estático)
function updateBalance() {
  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = 'R$ 1.234,56'; // Altere conforme dados reais
}

// Função para listar movimentações (exemplo estático)
function listTransactions() {
  const listEl = document.getElementById('transaction-list');
  const dummyTransactions = [
    { desc: 'Venda Produto A', value: 150.00 },
    { desc: 'Compra Material', value: -50.00 },
    { desc: 'Serviço Prestado', value: 200.00 },
  ];
  listEl.innerHTML = '';
  dummyTransactions.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `${t.desc}: R$ ${t.value.toFixed(2)}`;
    li.className = t.value >= 0 ? 'transaction-income' : 'transaction-expense';
    listEl.appendChild(li);
  });
}

// Função para configurar o logout
function setupLogout() {
  const btnLogout = document.getElementById('logout-btn');
  btnLogout.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = '/index.html';
    } catch (error) {
      alert('Erro ao sair: ' + error.message);
    }
  });
}

// Verifica se usuário está logado para liberar acesso
onAuthStateChanged(auth, (user) => {
  if (user) {
    updateBalance();
    listTransactions();
    setupLogout();
  } else {
    // Redireciona para login se não estiver autenticado
    window.location.href = '/index.html';
  }
});
