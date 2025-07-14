// public/js/app.js

import { auth } from './firebase/config.js';
import { 
  fazerLogin, 
  cadastrarUsuario, 
  verificarPermissao 
} from './auth/auth.js';
import { 
  adicionarMovimentacao,
  calcularSaldo,
  carregarHistorico,
  filtrarPorCategoria
} from './db/firestore.js';

// Elementos DOM
const elements = {
  loginSection: document.getElementById("login-section"),
  appSection: document.getElementById("app-section"),
  adminSection: document.getElementById("admin-section"),
  loginBtn: document.getElementById("login-btn"),
  signupBtn: document.getElementById("signup-btn"),
  movimentacaoForm: document.getElementById("movimentacao-form"),
  saldoElement: document.getElementById("saldo"),
  historicoList: document.getElementById("historico-list"),
  categoryFilter: document.getElementById("filter-category")
};

// Atualiza a UI
const updateUI = {
  saldo: async () => {
    const saldo = await calcularSaldo();
    elements.saldoElement.textContent = saldo.toFixed(2);
    elements.saldoElement.style.color = saldo >= 0 ? 'green' : 'red';
  },
  
  historico: (movimentacoes) => {
    elements.historicoList.innerHTML = movimentacoes.map(item => `
      <li class="${item.tipo}">
        <span class="descricao">${item.descricao}</span>
        <span class="valor">R$ ${item.valor.toFixed(2)}</span>
        <span class="categoria">${item.categoria}</span>
        <small>${new Date(item.data).toLocaleDateString('pt-BR')}</small>
      </li>
    `).join('');
  }
};

// Configura Event Listeners
const setupEventListeners = () => {
  // Login
  elements.loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value.trim();
    
    if (!email || !senha) {
      alert("Preencha e-mail e senha!");
      return;
    }
    
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = "Entrando...";
    
    if (await fazerLogin(email, senha)) {
      elements.loginSection.style.display = "none";
      elements.appSection.style.display = "block";
      
      if (await verificarPermissao(auth.currentUser.uid)) {
        elements.adminSection.style.display = "block";
      }
      
      await updateUI.saldo();
      updateUI.historico(await carregarHistorico());
    }
    
    elements.loginBtn.disabled = false;
    elements.loginBtn.textContent = "Entrar";
  });

  // Cadastro
  elements.signupBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value.trim();
    
    if (!email || !senha) {
      alert("Preencha e-mail e senha!");
      return;
    }
    
    elements.signupBtn.disabled = true;
    elements.signupBtn.textContent = "Cadastrando...";
    
    if (await cadastrarUsuario(email, senha)) {
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    }
    
    elements.signupBtn.disabled = false;
    elements.signupBtn.textContent = "Cadastrar";
  });

  // Nova Movimentação
  elements.movimentacaoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tipo = document.getElementById("tipo").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const descricao = document.getElementById("descricao").value.trim();
    const categoria = document.getElementById("categoria").value;
    
    if (!descricao || isNaN(valor)) {
      alert("Preencha todos os campos corretamente!");
      return;
    }
    
    if (await adicionarMovimentacao(tipo, valor, descricao, categoria)) {
      elements.movimentacaoForm.reset();
      await updateUI.saldo();
      updateUI.historico(await carregarHistorico());
    }
  });

  // Filtro por Categoria
  elements.categoryFilter.addEventListener("change", async () => {
    const categoria = elements.categoryFilter.value;
    const dados = categoria === "Todas" 
      ? await carregarHistorico() 
      : await filtrarPorCategoria(categoria);
    updateUI.historico(dados);
  });
};

// Inicialização
auth.onAuthStateChanged(async (user) => {
  if (user) {
    elements.loginSection.style.display = "none";
    elements.appSection.style.display = "block";
    
    if (await verificarPermissao(user.uid)) {
      elements.adminSection.style.display = "block";
    }
    
    await updateUI.saldo();
    updateUI.historico(await carregarHistorico());
  }
});

// Inicia a aplicação
setupEventListeners();
