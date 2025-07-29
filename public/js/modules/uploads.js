import { auth, db, storage } from '../firebase/config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Middleware premium ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
  const hasPremium = await checkPremiumAccess();
  if (!hasPremium) {
    alert('Função premium disponível apenas para assinantes.');
    window.location.href = 'planos.html';
    return;
  }
});

// ✅ Função de verificação do plano
async function checkPremiumAccess() {
  const user = auth.currentUser;
  if (!user) return false;

  const userDoc = await getDoc(doc(db, "usuarios", user.uid));
  const data = userDoc.data();
  return data?.plano === 'pro' || data?.plano === 'enterprise';
}

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    alert('Erro ao fazer logout: ' + error.message);
  }
});

// Upload
const uploadForm = document.getElementById('upload-form');
const uploadsList = document.getElementById('uploads-list');

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = document.getElementById('file').files[0];
  const descricao = document.getElementById('descricao').value.trim();
  const categoria = document.getElementById('categoria').value;

  if (!file || !descricao || !categoria) {
    alert('Preencha todos os campos.');
    return;
  }

  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);

  try {
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "uploads"), {
      url,
      nome: file.name,
      descricao,
      categoria,
      userId: auth.currentUser.uid,
      storagePath: storageRef.fullPath,
      createdAt: serverTimestamp()
    });

    uploadForm.reset();
    alert('Upload realizado com sucesso!');
  } catch (error) {
    alert('Erro ao enviar arquivo: ' + error.message);
  }
});

// Listar uploads com filtros e pesquisa
const q = query(collection(db, "uploads"), orderBy("createdAt", "desc"));
let uploadsCache = [];

onSnapshot(q, (snapshot) => {
  uploadsCache = [];
  snapshot.forEach(doc => {
    uploadsCache.push({ id: doc.id, ...doc.data() });
  });
  renderUploads();
});

// Filtros
document.getElementById('filter-categoria').addEventListener('change', renderUploads);
document.getElementById('filter-date').addEventListener('change', renderUploads);
document.getElementById('search-input').addEventListener('input', renderUploads);

function renderUploads() {
  const list = document.getElementById('uploads-list');
  list.innerHTML = "";

  const search = document.getElementById('search-input').value.toLowerCase();
  const filtroCategoria = document.getElementById('filter-categoria').value;
  const filtroData = document.getElementById('filter-date').value;

  const filtered = uploadsCache.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(search) || item.descricao.toLowerCase().includes(search);
    const matchesCategoria = filtroCategoria ? item.categoria === filtroCategoria : true;
    const matchesData = filtroData ? (item.createdAt?.toDate().toISOString().slice(0,7) === filtroData) : true;
    return matchesSearch && matchesCategoria && matchesData;
  });

  window.filteredUploadsForExport = filtered;

  if (filtered.length === 0) {
    list.innerHTML = '<p>Nenhum resultado encontrado.</p>';
    return;
  }

  filtered.forEach(data => {
    const dataFormatada = data.createdAt?.toDate().toLocaleDateString('pt-BR') || 'Sem data';
    const div = document.createElement('div');
    div.className = 'list-group-item';
    div.innerHTML = `
      <strong>${data.nome}</strong> <span class="badge bg-secondary">${data.categoria}</span><br/>
      <span id="desc-${data.id}">${data.descricao}</span><br/>
      <small>${dataFormatada}</small><br/>
      <a href="${data.url}" target="_blank" class="btn btn-sm btn-success mt-1">Download</a>
      <button class="btn btn-sm btn-primary mt-1" onclick="editarUpload('${data.id}')">Editar</button>
      <button class="btn btn-sm btn-danger mt-1" onclick="excluirUpload('${data.id}', '${data.storagePath}')">Excluir</button>
    `;
    list.appendChild(div);
  });
}

// Exclusão segura
window.excluirUpload = async (id, storagePath) => {
  if (!confirm('Deseja realmente excluir este arquivo?')) return;

  try {
    await deleteDoc(doc(db, "uploads", id));
    await deleteObject(ref(storage, storagePath));
    alert('Arquivo excluído com sucesso.');
  } catch (error) {
    alert('Erro ao excluir: ' + error.message);
  }
};

// Edição de descrição e categoria
window.editarUpload = async (id) => {
  const novoDescricao = prompt("Nova descrição:");
  const novaCategoria = prompt("Nova categoria (Fiscal, RH, Compras, Outros):");

  if (!novoDescricao || !novaCategoria) {
    alert('Edição cancelada ou inválida.');
    return;
  }

  try {
    await updateDoc(doc(db, "uploads", id), {
      descricao: novoDescricao,
      categoria: novaCategoria
    });
    alert('Arquivo atualizado com sucesso.');
  } catch (error) {
    alert('Erro ao atualizar: ' + error.message);
  }
};

// Exportar PDF filtrado
window.exportarPdfUploads = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Relatório de Uploads Filtrados", 14, 22);

  const columns = ["Nome", "Descrição", "Categoria", "Data"];
  const rows = window.filteredUploadsForExport.map(u => [
    u.nome,
    u.descricao,
    u.categoria,
    u.createdAt?.toDate().toLocaleDateString('pt-BR') || 'Sem data'
  ]);

  if (rows.length === 0) {
    alert("Nenhum upload para exportar.");
    return;
  }

  // @ts-ignore
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 30
  });

  doc.save("relatorio_uploads_filtrados.pdf");
};
