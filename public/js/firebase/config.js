import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBpJSl4T53N3deVJjHpNqzkBJWHEigLHaU",
  authDomain: "controle-de-caixa-9a7a0.firebaseapp.com",
  projectId: "controle-de-caixa-9a7a0",
  storageBucket: "controle-de-caixa-9a7a0.appspot.com",
  messagingSenderId: "584254122315",
  appId: "1:584254122315:web:b2aa20bc5454f0f54860ce"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
