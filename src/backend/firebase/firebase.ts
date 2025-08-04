// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
	apiKey: import.meta.env.FIREBASE_API_KEY,
	authDomain: "flipper-ae6d1.firebaseapp.com",
	projectId: "flipper-ae6d1",
	storageBucket: "flipper-ae6d1.firebasestorage.app",
	messagingSenderId: "905168744246",
	appId: "1:905168744246:web:f43300ddbde293aa26cd97",
	measurementId: "G-CZTY639YSW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize individual Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Apply long polling settings to fix WebChannel connection issues
// This forces the SDK to use long polling instead of WebSocket connections
// if (typeof window !== 'undefined') {
//   // Only run in browser environment
//   import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
//     // You can also try this approach if the above doesn't work:
//     // disableNetwork(db).then(() => enableNetwork(db));
//   });
// }

const storage = getStorage(app);

// Export for use in other files
export { app, auth, db, storage };
