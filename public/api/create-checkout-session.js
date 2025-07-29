/**
 * create-checkout-session.js
 * Cria sessão de checkout Stripe para upgrade de assinatura
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_SUA_SECRET_KEY_AQUI');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

router.post('/', async (req, res) => {
  const { uid, priceId } = req.body;

  if (!uid || !priceId) {
    return res.status(400).json({ error: 'UID e priceId são obrigatórios.' });
  }

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

module.exports = router;
