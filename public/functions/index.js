const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

admin.initializeApp();
const db = admin.firestore();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ➡️ Criar sessão de checkout
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, uid } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: 'https://seu-dominio.com/success',
      cancel_url: 'https://seu-dominio.com/cancel',
      metadata: {
        uid: uid
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    res.status(500).send(error.message);
  }
});

// ➡️ Webhook Stripe para atualização automática de status no Firestore
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ➡️ Processa eventos relevantes
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.metadata.uid;

    await db.collection('usuarios').doc(uid).update({
      plano: 'premium',
      stripe_subscription_id: session.subscription,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Usuário ${uid} atualizado para premium.`);
  }

  if (event.type === 'invoice.payment_failed') {
    const subscription = event.data.object.subscription;

    // Recupera uid pelo subscription_id salvo no Firestore
    const usersSnapshot = await db.collection('usuarios')
      .where('stripe_subscription_id', '==', subscription).get();

    usersSnapshot.forEach(async (docu) => {
      await docu.ref.update({
        plano: 'free',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Usuário ${docu.id} revertido para plano free devido a pagamento falho.`);
    });
  }

  res.json({ received: true });
});

// ➡️ Exporta como Firebase Function
exports.api = functions.https.onRequest(app);
