import { auth, db } from '../firebase/config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    alert('Erro ao fazer logout: ' + error.message);
  }
});

// Formulário de cadastro
const userForm = document.getElementById('user-form');
const usersList = document.getElementById('users-list');

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const permissao = document.getElementById('permissao').value;

  if (!nome || !email || !permissao) {
    alert('Preencha todos os campos');
    return;
  }

  try {
    await addDoc(collection(db, "usuarios"), {
      nome,
      email,
      permissao,
      createdAt: serverTimestamp()
    });

    userForm.reset();
    alert('Usuário adicionado com sucesso!');
  } catch (error) {
    alert('Erro ao adicionar usuário: ' + error.message);
  }
});

// Listagem em tempo real
onSnapshot(collection(db, "usuarios"), (snapshot) => {
  usersList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement('div');
    div.className = 'list-group-item';
    div.innerHTML = `
      <strong>${data.nome}</strong> - ${data.email} <span class="badge bg-secondary">${data.permissao}</span><br/>
      <button class="btn btn-sm btn-primary mt-1" onclick="editarUsuario('${doc.id}', '${data.permissao}')">Editar Permissão</button>
      <button class="btn btn-sm btn-danger mt-1" onclick="excluirUsuario('${doc.id}')">Excluir</button>
    `;
    usersList.appendChild(div);
  });
});

// Excluir usuário
window.excluirUsuario = async (id) => {
  if (!confirm('Deseja realmente excluir este usuário?')) return;

  try {
    await deleteDoc(doc(db, "usuarios", id));
    alert('Usuário excluído.');
  } catch (error) {
    alert('Erro ao excluir: ' + error.message);
  }
};

// Editar permissão
window.editarUsuario = async (id, permissaoAtual) => {
  const novaPermissao = prompt("Nova permissão (admin, financeiro, user):", permissaoAtual);
  if (!novaPermissao) return;

  try {
    await updateDoc(doc(db, "usuarios", id), {
      permissao: novaPermissao
    });
    alert('Permissão atualizada.');
  } catch (error) {
    alert('Erro ao atualizar: ' + error.message);
  }
};
