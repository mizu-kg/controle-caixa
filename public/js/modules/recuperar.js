import { auth } from './firebase/config.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('recuperar-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('recuperar-email').value.trim();

    if (!email) {
      showToast('Digite um email válido.', 'error');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Email de recuperação enviado com sucesso!', 'success');
      form.reset();
    } catch (error) {
      showToast('Erro ao enviar recuperação: ' + error.message, 'error');
    }
  });
});

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
