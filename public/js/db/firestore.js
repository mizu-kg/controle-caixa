import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from "../firebase/config.js";

const db = getFirestore(app);

export { db };
