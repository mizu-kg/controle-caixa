/**
 * stripe.js
 * Rotas de pagamento (checkout, webhook) para planos de assinatura
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_SUA_SECRET_KEY_AQUI');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// ✅ Rota para criar sessão de checkout
router.post('/create-checkout-session', async (req, res) => {
  const { uid, priceId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'https://seusite.com/success.html',
      cancel_url: 'https://seusite.com/cancel.html',
      metadata: { uid },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Webhook Stripe para atualizar Firestore automaticamente
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const endpointSecret = 'whsec_SUA_WEBHOOK_SECRET_AQUI';
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.sendStatus(400);
  }

  // 🔄 Processa evento de pagamento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.metadata.uid;

    await db.collection('users').doc(uid).update({
      plano: 'premium',
      stripeSubscriptionId: session.subscription,
      assinaturaAtiva: true,
    });

    console.log(`Assinatura ativada para UID: ${uid}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
