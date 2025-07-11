// public/js/firebase/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getAuth,
  connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
  getFirestore,
  connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
  getStorage,
  connectStorageEmulator
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// Configuração do Firebase (substitua se necessário)
const firebaseConfig = {
  apiKey: "AIzaSyBpJSl4T53N3deVJjHpNqzkBJWHEigLHaU",
  authDomain: "controle-de-caixa-9a7a0.firebaseapp.com",
  projectId: "controle-de-caixa-9a7a0",
  storageBucket: "controle-de-caixa-9a7a0.appspot.com",
  messagingSenderId: "584254122315",
  appId: "1:584254122315:web:b2aa20bc5454f0f54860ce"
};

// Inicialização dos serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configuração de emuladores (apenas desenvolvimento)
if (import.meta.env.MODE === 'development') {
  const emulatorHost = "localhost";
  
  // Conecta emuladores
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectStorageEmulator(storage, emulatorHost, 9199);
  
  console.log("[Firebase] Modo desenvolvimento ativo");
  console.log("[Firebase] Emuladores conectados:");
  console.log(`- Auth: http://${emulatorHost}:9099`);
  console.log(`- Firestore: http://${emulatorHost}:8080`);
  console.log(`- Storage: http://${emulatorHost}:9199`);
}

// Debug seguro (apenas desenvolvimento)
if (import.meta.env.MODE === 'development') {
  window._firebase = {
    auth,
    db,
    storage,
    helpers: {
      limparDados: async () => {
        // Função para limpar dados de teste
      }
    }
  };
  console.log("[Firebase] Debug habilitado (acesse via _firebase)");
}

export { auth, db, storage };