export const Dashboard = {
  renderSaldo(saldo) {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = `<p>Saldo atual: R$ ${saldo}</p>`;
  }
};
