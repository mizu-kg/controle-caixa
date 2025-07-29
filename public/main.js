import { auth } from './firebase/config.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  // Cadastro
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Cadastro realizado com sucesso!', 'success');
        window.location.href = 'dashboard.html';
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login realizado com sucesso!', 'success');
        window.location.href = 'dashboard.html';
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }
});

// Função toast simples
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
