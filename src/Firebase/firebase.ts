import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAG9GXkax6QfFdoVRbklGmhAqwWz30aQrc",
  authDomain: "sxaint-nexus.firebaseapp.com",
  projectId: "sxaint-nexus",
  storageBucket: "sxaint-nexus.firebasestorage.app",
  messagingSenderId: "627523951229",
  appId: "1:627523951229:web:ed88cc6549b68c3c942f14",
  measurementId: "G-DG94WX9WVJ",
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
