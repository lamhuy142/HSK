// js/firebase-config.js

// 1. Khai báo cấu hình
const firebaseConfig = {
  apiKey: "AIzaSyC-TG7caE-zrdPAbo_83y5iL8IeQnN5YWQ",
  authDomain: "hsk-vocab-c2c20.firebaseapp.com",
  projectId: "hsk-vocab-c2c20",
  storageBucket: "hsk-vocab-c2c20.firebasestorage.app",
  messagingSenderId: "780455694534",
  appId: "1:780455694534:web:24f0df5df649e8c2aa87c7",
  measurementId: "G-RD6TR1NGMP",
};

// 2. Khởi tạo Firebase (Sử dụng cú pháp compat để dễ dùng cho người mới)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
