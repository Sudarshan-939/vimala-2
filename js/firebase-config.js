// Firebase configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBT2N-104sJVXefDOfn9WglK2CbOYihHPs",
    authDomain: "vimala-5b394.firebaseapp.com",
    projectId: "vimala-5b394",
    storageBucket: "vimala-5b394.firebasestorage.app",
    messagingSenderId: "627445811636",
    appId: "1:627445811636:web:ed941d3c2d4ee695648ae1",
    measurementId: "G-4T0D6Y7ZQS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, onAuthStateChanged };
