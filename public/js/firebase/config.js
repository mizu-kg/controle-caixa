// public/js/firebase/config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getStorage,
  connectStorageEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpJSl4T53N3deVJjHpNqzkBJWHEigLHaU",
  authDomain: "controle-de-caixa-9a7a0.firebaseapp.com",
  projectId: "controle-de-caixa-9a7a0",
  storageBucket: "controle-de-caixa-9a7a0.appspot.com",
  messagingSenderId: "584254122315",
  appId: "1:584254122315:web:b2aa20bc5454f0f54860ce"
};

// 🔥 Inicialização dos serviços Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ⚠️ Emuladores (apenas em desenvolvimento local)
// Como não há Vite ou Next.js, substitua pela sua lógica de ambiente manual:

const emular = false; // ✅ altere para true se estiver usando emuladores locais

if (emular) {
  const emulatorHost = "localhost";

  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectStorageEmulator(storage, emulatorHost, 9199);

  console.log("[Firebase] Emuladores conectados:");
  console.log(`- Auth: http://${emulatorHost}:9099`);
  console.log(`- Firestore: http://${emulatorHost}:8080`);
  console.log(`- Storage: http://${emulatorHost}:9199`);
}

// 🔍 Exporta serviços para uso em outros módulos
export { auth, db, storage };
