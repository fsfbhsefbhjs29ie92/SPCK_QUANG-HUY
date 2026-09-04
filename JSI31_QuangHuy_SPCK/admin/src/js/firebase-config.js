import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyDdNdRxYuQ6z1y4cqNN1qIMrRhH9z_0",
    authDomain: "mk-jsi31-a4e4f.firebaseapp.com",
    projectId: "mk-jsi31-a4e4f",
    storageBucket: "mk-jsi31-a4e4f.firebasestorage.app",
    messagingSenderId: "881227981986",
    appId: "1:881227981986:web:d66c49d80c8ab2579623fb"
};

// Khởi tạo ứng dụng Firebase và xuất (export) biến db ra để order.js sử dụng
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);