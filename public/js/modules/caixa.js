export const Caixa = {
  async getSaldo(db) {
    const docRef = db.collection('caixa').doc('saldo');
    const doc = await docRef.get();
    return doc.exists ? doc.data().valor : 0;
  },

  async adicionarEntrada(db, valor) {
    // lógica para adicionar entrada no caixa
  }
};
