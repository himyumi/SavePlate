/* ================================================================
   SavePlate – firebase-config.js
   ================================================================
   This file connects the app to your Firebase project.
   Project: saveplate-64df4
   ================================================================ */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCh_V-DFTXG1oMlAOVlyhKXJLDmiH_XfMc",
  authDomain: "saveplate-81-85-89.firebaseapp.com",
  projectId: "saveplate-81-85-89",
  storageBucket: "saveplate-81-85-89.firebasestorage.app",
  messagingSenderId: "215352682694",
  appId: "1:215352682694:web:8db6e8e37ba863e2efcfc7",
  measurementId: "G-79EZ567774"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);