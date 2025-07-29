/**
 * functions.js
 * Exporte funções de rotas e integrações (Stripe, Firestore, etc)
 * Requer: stripe.js, firestore.js, auth.js (opcional)
 */

const stripeRoutes = require('./stripe');
const backupRoutes = require('./backup');
const restoreRoutes = require('./restore');

module.exports = (app) => {
  // ➡️ Stripe routes
  app.use('/stripe', stripeRoutes);

  // ➡️ Backup routes
  app.use('/backup', backupRoutes);

  // ➡️ Restore routes
  app.use('/restore', restoreRoutes);

  // ➡️ Rota raiz (opcional)
  app.get('/', (req, res) => {
    res.send('API Controle de Caixa v1');
  });
};
