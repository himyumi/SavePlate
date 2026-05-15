/* ================================================================
   SavePlate – firebase-config.js
   ================================================================
   SETUP STEPS:
   1. Go to https://console.firebase.google.com
   2. Click "Add project" and give it a name (e.g. "saveplate")
   3. Once created, click the </> (web) icon to register your app
   4. Copy the firebaseConfig object below and paste your values
   5. Go to Build → Authentication → Sign-in method → Enable "Email/Password"
   6. Go to Build → Firestore Database → Create database
      - Choose "Start in test mode" for development (change rules before going live)
   7. (Optional) Go to Firestore → Rules and replace with these secure rules:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId}/{document=**} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
          match /donations/{donationId} {
            allow read, write: if request.auth != null;
          }
        }
      }
   ================================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAIZ-okljSJbqDS0PoXdOI7D0Hr403K0o8",
  authDomain: "saveplate-64df4.firebaseapp.com",

  projectId: "saveplate-64df4",

  storageBucket: "saveplate-64df4.firebasestorage.app",

    messagingSenderId: "993911292635",

    appId: "1:993911292635:web:9da9e1f12cbb2227a6c2fe",

    measurementId: "G-RSWC83QKX8"

};

firebase.initializeApp(firebaseConfig);
