// Import các hàm cốt lõi từ Firebase SDK (Modular v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Thông tin cấu hình dự án Firebase của bạn
const firebaseConfig = {
    apiKey: "AIzaSyDdNdxRYXyuQ6zlY4cqpNN1qIMrRhH9z_0",
    authDomain: "mk-jsi31-a4e4f.firebaseapp.com",
    projectId: "mk-jsi31-a4e4f",
    storageBucket: "mk-jsi31-a4e4f.firebasestorage.app",
    messagingSenderId: "881227981986",
    appId: "1:881227981986:web:d66c49d80c8ab2579623fb"
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Cloud Firestore và export để các file khác (như script.js) có thể gọi
export const db = getFirestore(app);