import { auth, db } from '../firebase/config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Verifica se usuário está logado antes de executar tudo
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Verifica plano do usuário
  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  const planoStatusEl = document.getElementById('plano-status');
  if (userSnap.exists() && userSnap.data().subscription && userSnap.data().subscription.status === 'active') {
    const plano = userSnap.data().subscription.plan;
    planoStatusEl.innerHTML = `✅ Seu plano atual: <strong>${plano}</strong>`;
  } else {
    planoStatusEl.innerHTML = `
      ⚠️ Você não possui plano ativo.
      <a href="planos.html" class="btn btn-sm btn-primary ms-2">Assinar agora</a>
    `;
  }

  // Resumo financeiro
  const lancQuery = query(collection(db, "lancamentos"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(lancQuery);

  let entradas = 0;
  let saidas = 0;
  let ultimos = [];

  snapshot.forEach(doc => {
    const l = doc.data();
    if (l.tipo === "entrada") entradas += l.valor;
    if (l.tipo === "saida") saidas += l.valor;
    ultimos.push(l);
  });

  document.getElementById('total-entradas').textContent = `R$ ${entradas.toFixed(2)}`;
  document.getElementById('total-saidas').textContent = `R$ ${saidas.toFixed(2)}`;
  document.getElementById('saldo-atual').textContent = `R$ ${(entradas - saidas).toFixed(2)}`;

  // Exibir últimos 5 lançamentos
  const ultimosLanc = ultimos.slice(0,5);
  const tbody = document.querySelector('#ultimos-lancamentos tbody');
  ultimosLanc.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${l.descricao}</td>
      <td>R$ ${l.valor.toFixed(2)}</td>
      <td>${l.tipo}</td>
      <td>${l.createdAt?.toDate().toLocaleDateString('pt-BR') || ''}</td>
    `;
    tbody.appendChild(tr);
  });

  // Últimos uploads
  const uploadQuery = query(collection(db, "uploads"), orderBy("createdAt", "desc"), limit(5));
  const uploadSnap = await getDocs(uploadQuery);

  const uploadsList = document.getElementById('ultimos-uploads');
  uploadSnap.forEach(doc => {
    const u = doc.data();
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `
      <strong>${u.nome}</strong> - ${u.categoria} <br/>
      <a href="${u.url}" target="_blank">Download</a>
    `;
    uploadsList.appendChild(li);
  });
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    alert('Erro ao fazer logout: ' + error.message);
  }
});
