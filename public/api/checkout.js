import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  const { priceId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      metadata: { userId },
      success_url: 'https://seuapp.vercel.app/success.html',
      cancel_url: 'https://seuapp.vercel.app/cancel.html',
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao criar checkout');
  }
};
