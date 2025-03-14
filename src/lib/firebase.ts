// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxnT3dwZzTwZSBd_1UJVMFW2NO3pABvPg",
  authDomain: "fels-d4004.firebaseapp.com",
  databaseURL: "https://fels-d4004-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fels-d4004",
  storageBucket: "fels-d4004.firebasestorage.app",
  messagingSenderId: "347043496532",
  appId: "1:347043496532:web:5cfcd000a9cdd71cc2e3c1",
  measurementId: "G-7KEXFYPKSK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);