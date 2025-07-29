// public/js/modules/planos.js

document.getElementById('btn-pro').addEventListener('click', async () => {
  await checkout('pro');
});

document.getElementById('btn-enterprise').addEventListener('click', async () => {
  await checkout('enterprise');
});

async function checkout(plan) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    const { url } = await res.json();
    window.location.href = url;
  } catch (err) {
    alert('Erro ao criar sessão de pagamento: ' + err.message);
  }
}
