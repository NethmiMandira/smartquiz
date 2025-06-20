// FirebaseConfig.tsx

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAl6oYR5cDNcWbf5lOTLwLz5J5EBOWD4QU",
  authDomain: "myfirst-9229f.firebaseapp.com",
  projectId: "myfirst-9229f",
  storageBucket: "myfirst-9229f.appspot.com",
  messagingSenderId: "248673798373",
  appId: "1:248673798373:android:a35053bb95c93623ccac0c"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Export Firebase Auth instance
export const auth = getAuth(app);

// Export Firestore instance
export const db = getFirestore(app);
