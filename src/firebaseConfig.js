// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = { 
    apiKey: "AIzaSyASBslRRfTH7SUcBG0QyILc8PcRUp6CwQI", 
    authDomain: "collab-code-editor-4af15.firebaseapp.com", 
    projectId: "collab-code-editor-4af15", 
    storageBucket: "collab-code-editor-4af15.firebasestorage.app", 
    messagingSenderId: "992403618975",
    appId: "1:992403618975:web:da8cec8aba72b42fef36aa"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: 'select_account'
});