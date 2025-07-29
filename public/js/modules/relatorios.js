import { auth, db } from '../firebase/config.js';
import {
  collection,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let allRecords = []; // todos os registros carregados
let filteredRecords = []; // após filtro
let currentPage = 1;
const rowsPerPage = 10;
let currentSort = { field: 'data', order: 'desc' };

// Elementos DOM
const tbody = document.querySelector('#relatorio-table tbody');
const totalEntradasEl = document.getElementById('total-entradas');
const totalSaidasEl = document.getElementById('total-saidas');
const saldoEl = document.getElementById('saldo');
const chartCanvas = document.getElementById('relatorios-chart');
const paginationEl = document.getElementById('pagination');
const toastContainer = document.getElementById('toast-container');

const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const typeFilter = document.getElementById('type-filter');
const applyFiltersBtn = document.getElementById('apply-filters');
const exportPdfBtn = document.getElementById('export-pdf');
const exportExcelBtn = document.getElementById('export-excel');
const logoutBtn = document.getElementById('logout-btn');

let chartInstance = null;

// --- Autenticação e segurança ---
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'index.html'; // não autenticado, volta para login
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    showToast('Erro ao fazer logout: ' + error.message, 'danger');
  }
});

// --- Buscar dados ---
async function fetchData() {
  try {
    const q = query(
      collection(db, 'lancamentos'),
      orderBy('data', 'desc')
    );
    const querySnapshot = await getDocs(q);
    allRecords = [];
    querySnapshot.forEach(doc => {
      allRecords.push({ id: doc.id, ...doc.data() });
    });
    applyFilters();
  } catch (error) {
    showToast('Erro ao buscar lançamentos: ' + error.message, 'danger');
  }
}

// --- Aplicar filtros ---
function applyFilters() {
  let filtered = allRecords;

  // Filtrar por data
  const startDateVal = startDateInput.value ? new Date(startDateInput.value) : null;
  const endDateVal = endDateInput.value ? new Date(endDateInput.value) : null;

  if (startDateVal) filtered = filtered.filter(r => r.data.toDate() >= startDateVal);
  if (endDateVal) filtered = filtered.filter(r => r.data.toDate() <= endDateVal);

  // Filtrar por tipo
  const typeVal = typeFilter.value;
  if (typeVal !== 'all') filtered = filtered.filter(r => r.tipo === typeVal);

  filteredRecords = filtered;
  currentPage = 1;

  updateSummary();
  renderTable();
  renderPagination();
  renderChart();
}

// --- Atualiza resumo financeiro ---
function updateSummary() {
  const totalEntradas = filteredRecords
    .filter(r => r.tipo === 'entrada')
    .reduce((acc, cur) => acc + Number(cur.valor), 0);
  const totalSaidas = filteredRecords
    .filter(r => r.tipo === 'saida')
    .reduce((acc, cur) => acc + Number(cur.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  totalEntradasEl.textContent = `R$ ${totalEntradas.toFixed(2).replace('.', ',')}`;
  totalSaidasEl.textContent = `R$ ${totalSaidas.toFixed(2).replace('.', ',')}`;
  saldoEl.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
  saldoEl.style.color = saldo < 0 ? 'red' : 'green';
}

// --- Renderizar tabela ---
function renderTable() {
  tbody.innerHTML = '';

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRecords = filteredRecords.slice(start, end);

  for (const rec of pageRecords) {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${rec.descricao}</td>
      <td>${Number(rec.valor).toFixed(2).replace('.', ',')}</td>
      <td class="${rec.tipo === 'entrada' ? 'text-success' : 'text-danger'}">${rec.tipo}</td>
      <td>${rec.data.toDate().toLocaleDateString('pt-BR')}</td>
    `;

    tbody.appendChild(tr);
  }
}

// --- Renderizar paginação ---
function renderPagination() {
  paginationEl.innerHTML = '';
  const pageCount = Math.ceil(filteredRecords.length / rowsPerPage);
  if(pageCount <= 1) return;

  for (let i = 1; i <= pageCount; i++) {
    const li = document.createElement('li');
    li.classList.add('page-item');
    if (i === currentPage) li.classList.add('active');

    const a = document.createElement('a');
    a.classList.add('page-link');
    a.href = '#';
    a.textContent = i;
    a.addEventListener('click', e => {
      e.preventDefault();
      currentPage = i;
      renderTable();
      renderPagination();
    });

    li.appendChild(a);
    paginationEl.appendChild(li);
  }
}

// --- Ordenação da tabela ---
document.querySelectorAll('#relatorio-table th[data-sort]').forEach(th => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    const field = th.getAttribute('data-sort');
    if (currentSort.field === field) {
      currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.field = field;
      currentSort.order = 'asc';
    }
    sortData();
    renderTable();
    renderPagination();
  });
});

function sortData() {
  filteredRecords.sort((a, b) => {
    let valA = a[currentSort.field];
    let valB = b[currentSort.field];

    if (currentSort.field === 'data') {
      valA = a.data.toDate();
      valB = b.data.toDate();
    } else if (currentSort.field === 'valor') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }

    if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
    return 0;
  });
}

// --- Renderizar gráfico ---
function renderChart() {
  if (chartInstance) chartInstance.destroy();

  // Agrupar por data (dia)
  const grouped = {};
  filteredRecords.forEach(r => {
    const dateStr = r.data.toDate().toLocaleDateString('pt-BR');
    if (!grouped[dateStr]) grouped[dateStr] = { entrada: 0, saida: 0 };
    grouped[dateStr][r.tipo] += Number(r.valor);
  });

  const labels = Object.keys(grouped).sort((a,b) => {
    const d1 = new Date(a.split('/').reverse().join('-'));
    const d2 = new Date(b.split('/').reverse().join('-'));
    return d1 - d2;
  });

  const entradaData = labels.map(date => grouped[date].entrada);
  const saidaData = labels.map(date => grouped[date].saida);

  const ctx = chartCanvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Entradas', data: entradaData, backgroundColor: 'rgba(40, 167, 69, 0.7)' },
        { label: 'Saídas', data: saidaData, backgroundColor: 'rgba(220, 53, 69, 0.7)' },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => 'R$ ' + value.toFixed(2).replace('.', ',')
          }
        }
      }
    }
  });
}

// --- Exportar PDF ---
exportPdfBtn.addEventListener('click', () => {
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(({ jsPDF }) => {
    const doc = new jsPDF.jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório Financeiro', 14, 22);

    const headers = [['Descrição', 'Valor (R$)', 'Tipo', 'Data']];
    const data = filteredRecords.map(r => [
      r.descricao,
      Number(r.valor).toFixed(2).replace('.', ','),
      r.tipo,
      r.data.toDate().toLocaleDateString('pt-BR')
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 30,
      styles: { fontSize: 10 },
    });

    doc.save('relatorio.pdf');
    showToast('PDF exportado com sucesso!', 'success');
  });
});

// --- Exportar Excel ---
exportExcelBtn.addEventListener('click', () => {
  const wb = XLSX.utils.book_new();
  const ws_data = [
    ['Descrição', 'Valor (R$)', 'Tipo', 'Data'],
    ...filteredRecords.map(r => [
      r.descricao,
      Number(r.valor).toFixed(2).replace('.', ','),
      r.tipo,
      r.data.toDate().toLocaleDateString('pt-BR')
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, 'relatorio.xlsx');
  showToast('Excel exportado com sucesso!', 'success');
});

// --- Função Toast ---
function showToast(message, type = 'info') {
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  toastContainer.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// --- Botão aplicar filtros ---
applyFiltersBtn.addEventListener('click', applyFilters);

// --- Inicializar ---
fetchData();
