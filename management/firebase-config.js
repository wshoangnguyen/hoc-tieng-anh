// file: firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    orderBy, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    increment 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBqm6-fzVVqA5DUYZ6Ke_fX9N6ON5pBzVE",
    authDomain: "quanly-hocvien.firebaseapp.com",
    projectId: "quanly-hocvien",
    storageBucket: "quanly-hocvien.firebasestorage.app",
    messagingSenderId: "1095021882397",
    appId: "1:1095021882397:web:68038ec5ac0e593ca02af4"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export tất cả để dùng chung
export { 
    app, auth, db,
    doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, 
    updateDoc, deleteDoc, serverTimestamp, increment 
};