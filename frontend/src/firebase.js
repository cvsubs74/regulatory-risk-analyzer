// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDeRmae7xUKqsXTKCYo0oXHowoN54SdW5w",
  authDomain: "regulatory-risk-analyzer.firebaseapp.com",
  projectId: "regulatory-risk-analyzer",
  storageBucket: "regulatory-risk-analyzer.firebasestorage.app",
  messagingSenderId: "134639725809",
  appId: "1:134639725809:web:f3630fa7eb8f5551b24d50",
  measurementId: "G-6K4433C3QY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
