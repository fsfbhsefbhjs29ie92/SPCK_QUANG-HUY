import { db } from './firebase-config.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Khởi tạo Auth instance dựa trên app hiện tại từ firebase-config
// (Giả định app được khởi tạo chung thông qua db hoặc cấu hình chuẩn)
const auth = getAuth();

document.addEventListener('DOMContentLoaded', async () => {
    // Các phần tử giao diện
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const accountSection = document.getElementById('accountSection');

    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    const loginFeedback = document.getElementById('loginFeedback');
    const regFeedback = document.getElementById('regFeedback');

    // Thông tin hiển thị tài khoản
    const accUsernameDisplay = document.getElementById('accUsernameDisplay');
    const accEmailDisplay = document.getElementById('accEmailDisplay');
    const accPhoneDisplay = document.getElementById('accPhoneDisplay');
    const accDobDisplay = document.getElementById('accDobDisplay');
    const accLastLoginDisplay = document.getElementById('accLastLoginDisplay');

    // Hàm chuyển đổi hiển thị giữa 3 phần (Login - Register - Account)
    function switchSection(target) {
        loginSection.classList.add('d-none');
        registerSection.classList.add('d-none');
        accountSection.classList.add('d-none');

        if (target === 'login') loginSection.classList.remove('d-none');
        if (target === 'register') registerSection.classList.remove('d-none');
        if (target === 'account') accountSection.classList.remove('d-none');
    }

    // 1. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP MẶC ĐỊNH KHI MỞ TRANG
    function checkInitialAuth() {
        const currentUserStr = localStorage.getItem('current_user');
        if (currentUserStr) {
            try {
                const currentUser = JSON.parse(currentUserStr);
                displayAccountInfo(currentUser);
                switchSection('account');
            } catch (e) {
                localStorage.removeItem('current_user');
                switchSection('login');
            }
        } else {
            switchSection('login');
        }
    }

    checkInitialAuth();

    // Sự kiện nút chuyển qua lại form
    switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        regFeedback.textContent = '';
        registerForm.reset();
        switchSection('register');
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginFeedback.textContent = '';
        loginForm.reset();
        switchSection('login');
    });

    // Hàm hiển thị thông tin tài khoản lên màn hình
    function displayAccountInfo(user) {
        accUsernameDisplay.textContent = user.username || 'Thành Viên VIP';
        accEmailDisplay.textContent = user.email || '-';
        accPhoneDisplay.textContent = user.sdt || '-';
        accDobDisplay.textContent = user.dob || '-';
        accLastLoginDisplay.textContent = user.last_login ? new Date(user.last_login).toLocaleString('vi-VN') : '-';
    }

    // 2. XỬ LÝ ĐĂNG KÝ
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        regFeedback.style.color = '#C5A059';
        regFeedback.textContent = 'Đang xác thực thông tin độc quyền...';

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const sdt = document.getElementById('regPhone').value.trim();
        const dob = document.getElementById('regDob').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const termsChecked = document.getElementById('regTerms').checked;

        // Validation: Username ít nhất 3 ký tự
        if (username.length < 3) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Tên tài khoản phải có ít nhất 3 ký tự.';
            return;
        }

        // Validation: Email đúng định dạng
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Địa chỉ email không đúng định dạng.';
            return;
        }

        // Validation: SĐT Việt Nam (03, 05, 07, 08, 09 và đủ 10 số)
        // Thay đổi Regex cũ thành Regex mới này:
        // Chấp nhận mọi số bắt đầu bằng 0, tổng cộng 10 số
        const phoneRegex = /^0[0-9]{9}$/;

        if (!phoneRegex.test(sdt)) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Số điện thoại phải bắt đầu bằng số 0 và đủ 10 chữ số.';
            return;
        }

        // Validation: DOB đảm bảo ít nhất 13 tuổi
        if (!dob) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Vui lòng chọn ngày sinh.';
            return;
        }
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 13) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Quý khách phải từ đủ 13 tuổi trở lên.';
            return;
        }

        // Validation: Password ít nhất 6 ký tự, có hoa, thường, số
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Mật khẩu ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số.';
            return;
        }

        // Validation: Confirm password
        if (password !== confirmPassword) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Mật khẩu xác nhận không khớp.';
            return;
        }

        // Validation: Checkbox terms
        if (!termsChecked) {
            regFeedback.style.color = '#ff6b6b';
            regFeedback.textContent = 'Quý khách phải đồng ý với điều khoản dịch vụ.';
            return;
        }

        try {
            // Kiểm tra trùng lặp username trong Firestore (collection 'users')
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                regFeedback.style.color = '#ff6b6b';
                regFeedback.textContent = 'Tên tài khoản này đã thuộc về thành viên khác.';
                return;
            }

            // Tạo tài khoản trên Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userData = {
                uid: user.uid,
                username: username,
                email: email,
                sdt: sdt,
                dob: dob,
                created_at: new Date().toISOString()
            };

            // Lưu thông tin vào Firestore
            await setDoc(doc(db, "users", user.uid), userData);

            // Lưu danh sách users vào localStorage
            let localUsers = JSON.parse(localStorage.getItem('users_list')) || [];
            localUsers.push(userData);
            localStorage.setItem('users_list', JSON.stringify(localUsers));

            regFeedback.style.color = '#C5A059';
            regFeedback.textContent = 'Đăng ký thành công tuyệt tác! Đang chuyển hướng sang đăng nhập...';

            setTimeout(() => {
                registerForm.reset();
                regFeedback.textContent = '';
                switchSection('login');
            }, 1500);

        } catch (error) {
            console.error("Lỗi đăng ký:", error);
            regFeedback.style.color = '#ff6b6b';
            if (error.code === 'auth/email-already-in-use') {
                regFeedback.textContent = 'Email này đã được đăng ký trước đó.';
            } else {
                regFeedback.textContent = 'Đã có lỗi xảy ra: ' + error.message;
            }
        }
    });

    // 3. XỬ LÝ ĐĂNG NHẬP THƯỜNG
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginFeedback.style.color = '#C5A059';
        loginFeedback.textContent = 'Đang xác thực phiên đăng nhập...';

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || password.length < 6) {
            loginFeedback.style.color = '#ff6b6b';
            loginFeedback.textContent = 'Thông tin đăng nhập không hợp lệ.';
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Lấy thông tin bổ sung từ Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            let userInfo = {
                uid: user.uid,
                email: user.email,
                username: user.email.split('@')[0],
                sdt: '',
                dob: ''
            };

            if (userDoc.exists()) {
                userInfo = { ...userInfo, ...userDoc.data() };
            }

            const loginTime = new Date().toISOString();
            userInfo.last_login = loginTime;

            // Lưu current_user vào localStorage
            localStorage.setItem('current_user', JSON.stringify(userInfo));

            loginFeedback.style.color = '#C5A059';
            loginFeedback.textContent = 'Đăng nhập thành công. Chào mừng Quý khách trở lại.';

            setTimeout(() => {
                loginForm.reset();
                loginFeedback.textContent = '';
                displayAccountInfo(userInfo);
                switchSection('account');
            }, 1000);

        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            loginFeedback.style.color = '#ff6b6b';
            loginFeedback.textContent = 'Email hoặc mật khẩu không chính xác.';
        }
    });

    // 4. XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            loginFeedback.style.color = '#C5A059';
            loginFeedback.textContent = 'Đang kết nối cổng xác thực Google...';

            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                // Kiểm tra xem đã có trong Firestore chưa, nếu chưa thì tạo mới record mặc định
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                let userInfo;
                if (userDoc.exists()) {
                    userInfo = userDoc.data();
                } else {
                    userInfo = {
                        uid: user.uid,
                        username: user.displayName || user.email.split('@')[0],
                        email: user.email,
                        sdt: user.phoneNumber || 'Chưa cập nhật',
                        dob: 'Chưa cập nhật',
                        created_at: new Date().toISOString()
                    };
                    await setDoc(userDocRef, userInfo);
                }

                const loginTime = new Date().toISOString();
                userInfo.last_login = loginTime;

                localStorage.setItem('current_user', JSON.stringify(userInfo));

                loginFeedback.style.color = '#C5A059';
                loginFeedback.textContent = 'Xác thực Google thành công.';

                setTimeout(() => {
                    loginFeedback.textContent = '';
                    displayAccountInfo(userInfo);
                    switchSection('account');
                }, 1000);

            } catch (error) {
                console.error("Lỗi Google Auth:", error);
                loginFeedback.style.color = '#ff6b6b';
                loginFeedback.textContent = 'Không thể đăng nhập bằng Google: ' + error.message;
            }
        });
    }

    // 5. XỬ LÝ ĐĂNG XUẤT
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('current_user');
            loginForm.reset();
            switchSection('login');
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
        }
    });
});