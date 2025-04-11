import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBUr2YYXW9pg1gt6P-9e1cPH3obrW370_Y",
  authDomain: "supersix-97bd0.firebaseapp.com",
  projectId: "supersix-97bd0",
  storageBucket: "supersix-97bd0.firebasestorage.app",
  messagingSenderId: "313481663146",
  appId: "1:313481663146:web:19dbcc2d7f4b148de9b6d3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;