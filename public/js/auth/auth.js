// auth.js

// 🔗 Importando diretamente da CDN Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔧 Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  apiKey: "AIzaSyBpJSl4T53N3deVJjHpNqzkBJWHEigLHaU",
  authDomain: "controle-de-caixa-9a7a0.firebaseapp.com",
  projectId: "controle-de-caixa-9a7a0",
  storageBucket: "controle-de-caixa-9a7a0.appspot.com",
  messagingSenderId: "584254122315",
  appId: "1:584254122315:web:b2aa20bc5454f0f54860ce"
};

// 🔥 Inicializa Firebase e serviços
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função de Login
export const fazerLogin = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);

    if (!userCredential.user.emailVerified) {
      alert("Por favor, verifique seu e-mail antes de fazer login!");
      await signOut(auth);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessages = {
      'auth/invalid-email': 'E-mail inválido',
      'auth/user-disabled': 'Conta desativada',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.'
    };

    alert(errorMessages[error.code] || "Erro ao fazer login: " + error.message);
    return false;
  }
};

// Função de Cadastro
export const cadastrarUsuario = async (email, senha) => {
  try {
    // 1. Cria o usuário
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

    // 2. Envia e-mail de verificação
    await sendEmailVerification(userCredential.user);

    // 3. Adiciona dados básicos no Firestore
    await addDoc(collection(db, "usuarios"), {
      uid: userCredential.user.uid,
      email: email,
      dataCriacao: serverTimestamp(),
      nivelAcesso: "comum" // padrão
    });

    alert(`Cadastro realizado! Verifique ${email} para ativar sua conta.`);
    return true;

  } catch (error) {
    const errorMessages = {
      'auth/email-already-in-use': 'E-mail já cadastrado',
      'auth/invalid-email': 'E-mail inválido',
      'auth/weak-password': 'Senha deve ter 6+ caracteres'
    };

    alert(errorMessages[error.code] || "Erro ao cadastrar: " + error.message);
    return false;
  }
};

// Verifica permissões (admin)
export const verificarPermissao = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    return userDoc.exists() && userDoc.data().nivelAcesso === "admin";
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return false;
  }
};

// Exporta auth para usar no onAuthStateChanged do index.html
export { auth };
