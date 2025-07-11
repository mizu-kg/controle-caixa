import { auth } from '../firebase/config.js';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Função de Login
export const fazerLogin = async (email, senha) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    
    if (!userCredential.user.emailVerified) {
      alert("Por favor, verifique seu e-mail antes de fazer login!");
      await auth.signOut();
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
    
    // 3. Adiciona dados básicos no Firestore (opcional)
    await addDoc(collection(db, "usuarios"), {
      uid: userCredential.user.uid,
      email: email,
      dataCriacao: serverTimestamp()
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

// Verifica permissões
export const verificarPermissao = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    return userDoc.exists() && userDoc.data().nivelAcesso === "admin";
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return false;
  }
};