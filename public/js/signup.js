import { auth } from './firebase/config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showToast('Cadastro realizado com sucesso!', 'success');
      
      // Redireciona para cadastro de empresa ao invés do dashboard
      window.location.href = 'empresa.html';
      
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
});

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
