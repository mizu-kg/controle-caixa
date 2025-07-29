import admin from 'firebase-admin';
import fs from 'fs';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const backup = JSON.parse(fs.readFileSync('./backup.json', 'utf8'));

    for (const [collectionName, docs] of Object.entries(backup)) {
      const batch = db.batch();
      docs.forEach(doc => {
        const docRef = db.collection(collectionName).doc(doc.id);
        batch.set(docRef, doc.data);
      });
      await batch.commit();
    }

    res.status(200).json({ message: 'Restore concluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao restaurar backup.' });
  }
}
