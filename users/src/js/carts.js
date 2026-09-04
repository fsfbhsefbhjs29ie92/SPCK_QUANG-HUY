import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Nhận diện theme trang web (Light Porcelain / Dark Obsidian)
const isDarkMode = () => {
    const isDarkAttr = document.body.classList.contains('dark-mode') || 
                       document.body.classList.contains('dark') || 
                       document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
                       document.body.getAttribute('data-theme') === 'dark';
    if (isDarkAttr) return true;

    const bg = window.getComputedStyle(document.body).backgroundColor;
    if (bg && bg !== 'transparent') {
        const rgb = bg.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
            const brightness = (Number(rgb[0]) * 299 + Number(rgb[1]) * 587 + Number(rgb[2]) * 114) / 1000;
            return brightness < 128;
        }
    }
    return false;
};

// Nhúng bộ Style Đẳng Cấp Thượng Lưu (Aura High-Jewelry Style)
const injectLuxuryStyles = () => {
    document.getElementById('auraLuxuryStyles')?.remove();

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.id = 'auraLuxuryStyles';
    style.innerHTML = `
        /* Overlay Backdrop làm mờ sâu chuẩn điện ảnh */
        .aura-modal-backdrop {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(8, 8, 10, 0.78) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 0 !important;
            visibility: hidden !important;
            transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.35s ease !important;
        }
        .aura-modal-backdrop.active {
            opacity: 1 !important;
            visibility: visible !important;
        }

        /* Modal Box phông nền Sứ Sáng / Đá Đen Thạch Anh */
        .aura-modal-card {
            background: #FCFAF7 !important; /* Trắng ngà Champagne */
            border: 1px solid rgba(197, 160, 89, 0.35) !important;
            border-radius: 12px !important;
            padding: 42px 38px 36px 38px !important;
            max-width: 430px !important;
            width: 90% !important;
            text-align: center !important;
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.8) !important;
            transform: scale(0.92) translateY(10px) !important;
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .aura-modal-backdrop.active .aura-modal-card {
            transform: scale(1) translateY(0) !important;
        }

        .aura-modal-icon-ring {
            width: 64px !important;
            height: 64px !important;
            border-radius: 50% !important;
            border: 1px solid rgba(197, 160, 89, 0.4) !important;
            background: rgba(197, 160, 89, 0.06) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 20px !important;
            color: #C5A059 !important;
            font-size: 1.8rem !important;
            box-shadow: 0 0 20px rgba(197, 160, 89, 0.15) !important;
        }

        .aura-modal-title {
            font-family: 'Playfair Display', Georgia, serif !important;
            font-size: 1.5rem !important;
            font-weight: 500 !important;
            color: #1A1A1A !important;
            margin-bottom: 12px !important;
            letter-spacing: 0.8px !important;
        }

        .aura-modal-text {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 0.82rem !important;
            color: #666666 !important;
            line-height: 1.75 !important;
            margin-bottom: 32px !important;
            padding: 0 6px !important;
            font-weight: 400 !important;
            letter-spacing: 0.2px !important;
        }

        .aura-btn-group {
            display: flex !important;
            gap: 12px !important;
            justify-content: center !important;
        }

        /* Nút GIỮ LẠI: Ghost Gold Button viền mạ vàng Hairline */
        .aura-btn-cancel {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 0.74rem !important;
            font-weight: 600 !important;
            letter-spacing: 2.2px !important;
            text-transform: uppercase !important;
            background: transparent !important;
            color: #C5A059 !important;
            border: 1px solid rgba(197, 160, 89, 0.6) !important;
            padding: 13px 18px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            flex: 1 !important;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .aura-btn-cancel:hover {
            background: #C5A059 !important;
            color: #FFFFFF !important;
            border-color: #C5A059 !important;
            box-shadow: 0 6px 20px rgba(197, 160, 89, 0.28) !important;
            transform: translateY(-1px) !important;
        }

        /* Nút XÁC NHẬN XÓA: Ruby Burgundy đỏ quý phái */
        .aura-btn-confirm {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 0.74rem !important;
            font-weight: 600 !important;
            letter-spacing: 2.2px !important;
            text-transform: uppercase !important;
            background: #9E1B1E !important; /* Đỏ Ruby nhung */
            color: #FFFFFF !important;
            border: 1px solid #9E1B1E !important;
            padding: 13px 18px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            flex: 1 !important;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .aura-btn-confirm:hover {
            background: #C82327 !important; /* Đỏ rực ánh hồng ngọc */
            border-color: #C82327 !important;
            box-shadow: 0 6px 22px rgba(200, 35, 39, 0.45) !important;
            transform: translateY(-1px) !important;
        }

        /* TOAST THÔNG BÁO: Tinh tế, nổi nhẹ góc trên */
        .aura-toast-card {
            pointer-events: auto !important;
            background: rgba(252, 250, 247, 0.96) !important;
            border: 1px solid rgba(197, 160, 89, 0.3) !important;
            border-left: 3px solid #C5A059 !important;
            border-radius: 6px !important;
            padding: 15px 22px !important;
            box-shadow: 0 15px 35px rgba(0,0,0,0.12), 0 0 12px rgba(197, 160, 89, 0.1) !important;
            color: #1A1A1A !important;
            font-family: 'Montserrat', sans-serif !important;
            font-size: 0.82rem !important;
            letter-spacing: 0.3px !important;
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            opacity: 0 !important;
            transform: translateY(-18px) scale(0.98) !important;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .aura-toast-card.show {
            opacity: 1 !important;
            transform: translateY(0) scale(1) !important;
        }

        /* Nền tối (Dark Mode) cho Web */
        .aura-dark-mode .aura-modal-card {
            background: #111113 !important; /* Obsidian Black */
            border: 1px solid rgba(197, 160, 89, 0.4) !important;
            box-shadow: 0 35px 80px rgba(0, 0, 0, 0.85), inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
        }
        .aura-dark-mode .aura-modal-title {
            color: #F0EAE1 !important;
        }
        .aura-dark-mode .aura-modal-text {
            color: #A0A0AA !important;
        }
        .aura-dark-mode.aura-toast-card,
        .aura-dark-mode .aura-toast-card {
            background: rgba(18, 18, 20, 0.96) !important;
            border: 1px solid rgba(197, 160, 89, 0.35) !important;
            border-left: 3px solid #C5A059 !important;
            color: #F0EAE1 !important;
            box-shadow: 0 20px 45px rgba(0,0,0,0.6) !important;
        }

        .cart-item-card {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
    `;
    document.head.appendChild(style);
};

let rawCart = JSON.parse(localStorage.getItem('LuxeUserCart')) || JSON.parse(localStorage.getItem('cart')) || JSON.parse(localStorage.getItem('giohang')) || [];
let cart = rawCart.map(i => ({
    id: i.id || i.productId || Math.random().toString(36).substr(2, 9),
    name: i.name || i.tenSP || i.title || 'Sản phẩm cao cấp',
    unitPrice: Number(i.unitPrice || i.price || i.gia || i.cost || 0),
    image: i.image || i.img || i.imageUrl || '',
    brand: i.brand || i.thuongHieu || 'AURA',
    cartQuantity: Number(i.cartQuantity || i.quantity || i.soLuong || 1),
    maxAmount: Number(i.maxAmount || 99)
}));

let currentUser = null;
try {
    currentUser = JSON.parse(localStorage.getItem('current_user'));
} catch(e) {
    currentUser = null;
}

const container = document.getElementById('cartItemsContainer');
const totalDisplay = document.getElementById('totalAmountDisplay');
const form = document.getElementById('checkoutForm');
const methodSelect = document.getElementById('paymentMethod');
const cardUI = document.getElementById('cardDetails');
const contentWrapper = document.getElementById('cartContentWrapper');
const alertContainer = document.getElementById('authAlertContainer');

const ensureToastContainer = () => {
    let toastWrapper = document.getElementById('luxeToastContainer');
    if (!toastWrapper) {
        toastWrapper = document.createElement('div');
        toastWrapper.id = 'luxeToastContainer';
        toastWrapper.style.cssText = `
            position: fixed !important;
            top: 25px !important;
            right: 25px !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            max-width: 400px !important;
            width: 90% !important;
            pointer-events: none !important;
        `;
        document.body.appendChild(toastWrapper);
    }
    return toastWrapper;
};

const showLuxeToast = (message, type = 'success', showLoginBtn = false) => {
    const toastWrapper = ensureToastContainer();
    const toastEl = document.createElement('div');
    toastEl.className = 'aura-toast-card';

    if (isDarkMode()) {
        toastEl.classList.add('aura-dark-mode');
    }

    const iconHtml = type === 'error' 
        ? `<i class="bi bi-exclamation-circle text-danger fs-5 flex-shrink-0"></i>` 
        : `<i class="bi bi-check2-circle fs-5 flex-shrink-0" style="color:#C5A059;"></i>`;
    
    let actionBtnHtml = showLoginBtn ? `
        <div class="mt-1">
            <a href="account.html" style="font-size: 0.76rem; color: #C5A059; font-weight: 600; text-decoration: underline; letter-spacing: 0.5px;">Đăng nhập VIP ngay</a>
        </div>
    ` : '';

    toastEl.innerHTML = `
        ${iconHtml}
        <div class="flex-grow-1">
            <div style="font-weight: 500; line-height: 1.45;">${message}</div>
            ${actionBtnHtml}
        </div>
    `;

    toastWrapper.appendChild(toastEl);

    requestAnimationFrame(() => toastEl.classList.add('show'));

    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 350);
    }, 3800);
};

const createConfirmModal = () => {
    document.getElementById('auraConfirmModal')?.remove();

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'auraConfirmModal';
    modalBackdrop.className = 'aura-modal-backdrop';

    if (isDarkMode()) {
        modalBackdrop.classList.add('aura-dark-mode');
    }

    modalBackdrop.innerHTML = `
        <div class="aura-modal-card">
            <div class="aura-modal-icon-ring">
                <i class="bi bi-shield-exclamation"></i>
            </div>
            <h5 class="aura-modal-title">Xác Nhận Gỡ Sản Phẩm</h5>
            <p class="aura-modal-text">
                Quý khách có chắc chắn muốn gỡ sản phẩm này khỏi giỏ hàng không? Sản phẩm sẽ bị loại bỏ khỏi danh sách đơn hàng hiện tại.
            </p>
            <div class="aura-btn-group">
                <button id="auraModalCancelBtn" class="aura-btn-cancel">GIỮ LẠI</button>
                <button id="auraModalConfirmBtn" class="aura-btn-confirm">XÁC NHẬN XÓA</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalBackdrop);
    return modalBackdrop;
};

window.updateQty = (id, delta) => {
    let item = cart.find(i => i.id === id);
    if(item) {
        item.cartQuantity += delta;
        if(item.cartQuantity < 1) item.cartQuantity = 1;
        if(item.cartQuantity > item.maxAmount) {
            showLuxeToast('Sản phẩm đã đạt giới hạn số lượng trong kho.', 'error');
            item.cartQuantity = item.maxAmount;
        }
        localStorage.setItem('LuxeUserCart', JSON.stringify(cart));
        renderCart();
    }
};

window.removeItem = (id, btnEl) => {
    const modal = createConfirmModal();
    
    requestAnimationFrame(() => modal.classList.add('active'));

    const cancelBtn = document.getElementById('auraModalCancelBtn');
    const confirmBtn = document.getElementById('auraModalConfirmBtn');

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    cancelBtn.onclick = closeModal;

    confirmBtn.onclick = () => {
        closeModal();

        const cardEl = btnEl ? btnEl.closest('.cart-item-card') : null;

        if (cardEl) {
            cardEl.style.opacity = '0';
            cardEl.style.transform = 'translateX(-25px) scale(0.96)';

            setTimeout(() => {
                cardEl.style.maxHeight = '0px';
                cardEl.style.paddingTop = '0px';
                cardEl.style.paddingBottom = '0px';
                cardEl.style.marginTop = '0px';
                cardEl.style.marginBottom = '0px';
                cardEl.style.border = 'none';
                cardEl.style.overflow = 'hidden';
            }, 180);

            setTimeout(() => {
                cart = cart.filter(i => i.id !== id);
                localStorage.setItem('LuxeUserCart', JSON.stringify(cart));
                renderCart();
                showLuxeToast('Đã gỡ sản phẩm khỏi giỏ hàng.', 'success');
            }, 450);
        } else {
            cart = cart.filter(i => i.id !== id);
            localStorage.setItem('LuxeUserCart', JSON.stringify(cart));
            renderCart();
            showLuxeToast('Đã gỡ sản phẩm khỏi giỏ hàng.', 'success');
        }
    };
};

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

const renderCart = () => {
    if (alertContainer) alertContainer.innerHTML = '';
    
    if (!currentUser && !window._hasWarnedLogin) {
        window._hasWarnedLogin = true;
        showLuxeToast('Quý khách vui lòng đăng nhập tài khoản VIP để đặt hàng.', 'error', true);
    }
    
    if (contentWrapper) contentWrapper.classList.remove('d-none');
    
    if (container) {
        container.innerHTML = cart.length ? cart.map(i => `
            <div class="cart-item-card d-flex flex-column flex-sm-row align-items-center p-3 mb-3">
                <div class="img-wrap me-sm-4 mb-3 mb-sm-0 flex-shrink-0 d-flex justify-content-center align-items-center" style="width: 90px; height: 90px;">
                    <img src="${i.image}" class="img-fluid" style="max-height:100%; object-fit:contain;">
                </div>
                <div class="flex-grow-1 w-100">
                    <h5 class="item-title mb-1 fs-5">${i.name}</h5>
                    <p class="luxury-muted small mb-3">Thương hiệu: ${i.brand}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="input-group input-group-sm" style="width:110px">
                            <button class="btn btn-outline-secondary qty-btn" onclick="updateQty('${i.id}', -1)">-</button>
                            <input type="text" class="form-control text-center cart-qty-input" value="${i.cartQuantity}" readonly>
                            <button class="btn btn-outline-secondary qty-btn" onclick="updateQty('${i.id}', 1)">+</button>
                        </div>
                        <div class="d-flex align-items-center">
                            <span class="fw-bold cart-total-price me-3 fs-5">${formatVND(i.unitPrice * i.cartQuantity)}</span>
                            <button class="btn btn-link text-danger p-0 fs-5" onclick="removeItem('${i.id}', this)"><i class="bi bi-x-lg"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div class="text-center py-5 cart-item-card rounded">
                <p class="luxury-muted fs-5 mb-0">Giỏ hàng của quý khách đang trống.</p>
            </div>
        `;
    }
    
    let total = cart.reduce((sum, i) => sum + (i.unitPrice * i.cartQuantity), 0);
    if (totalDisplay) totalDisplay.innerText = formatVND(total);
};

const initForm = () => {
    if(currentUser) {
        const nameField = document.getElementById('cName');
        const phoneField = document.getElementById('cPhone');
        const emailField = document.getElementById('cEmail');
        
        if(nameField) nameField.value = currentUser.username || currentUser.name || '';
        if(phoneField) phoneField.value = currentUser.sdt || currentUser.phone || '';
        if(emailField) emailField.value = currentUser.email || '';
    }

    if(methodSelect) {
        methodSelect.addEventListener('change', (e) => {
            if(cardUI) {
                if(e.target.value === 'CARD') {
                    cardUI.classList.remove('d-none');
                } else {
                    cardUI.classList.add('d-none');
                }
            }
        });
    }

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentUser) {
                showLuxeToast('Quý khách chưa đăng nhập! Vui lòng đăng nhập tài khoản VIP.', 'error', true);
                return;
            }

            if(cart.length === 0) {
                showLuxeToast('Giỏ hàng của quý khách đang trống!', 'error');
                return;
            }

            const phoneInput = document.getElementById('cPhone').value.trim();
            const vnPhoneRegex = /^0[35789]\d{8}$/;
            if (!vnPhoneRegex.test(phoneInput)) {
                showLuxeToast('Số điện thoại không hợp lệ! Nhập đúng 10 chữ số di động VN.', 'error');
                document.getElementById('cPhone')?.focus();
                return;
            }

            const paymentMethodVal = methodSelect.value;

            if (paymentMethodVal === 'CARD') {
                const cardInputs = cardUI ? cardUI.querySelectorAll('input') : [];
                if (cardInputs.length < 3) {
                    showLuxeToast('Quý khách vui lòng nhập đầy đủ thông tin thẻ.', 'error');
                    return;
                }

                const cardNumberVal = cardInputs[0].value.trim();
                const cardExpVal = cardInputs[1].value.trim();
                const cardCvcVal = cardInputs[2].value.trim();

                const cardNumberRegex = /^\d{16}$/;
                const cardExpRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
                const cardCvcRegex = /^\d{3,4}$/;

                if (!cardNumberRegex.test(cardNumberVal.replace(/\s+/g, ''))) {
                    showLuxeToast('Số thẻ không hợp lệ (16 chữ số).', 'error');
                    cardInputs[0].focus();
                    return;
                }
                if (!cardExpRegex.test(cardExpVal)) {
                    showLuxeToast('Ngày hết hạn không hợp lệ (MM/YY).', 'error');
                    cardInputs[1].focus();
                    return;
                }
                if (!cardCvcRegex.test(cardCvcVal)) {
                    showLuxeToast('Mã CVC không hợp lệ (3-4 chữ số).', 'error');
                    cardInputs[2].focus();
                    return;
                }
            }

            const customerNameVal = document.getElementById('cName').value.trim();
            const customerAddressVal = document.getElementById('cAddress').value.trim();
            const emailVal = document.getElementById('cEmail').value.trim();
            const noteVal = document.getElementById('cNote').value.trim();

            const orderData = {
                createdAt: Date.now(),
                customerAddress: customerAddressVal,
                customerName: customerNameVal,
                customerPhone: phoneInput,
                email: emailVal,
                items: cart.map(i => ({
                    brand: i.brand,
                    cartQuantity: Number(i.cartQuantity),
                    id: i.id,
                    image: i.image,
                    maxAmount: Number(i.maxAmount),
                    name: i.name,
                    unitPrice: Number(i.unitPrice)
                })),
                note: noteVal,
                paymentMethod: paymentMethodVal,
                status: "Pending",
                totalAmount: cart.reduce((sum, i) => sum + (i.unitPrice * i.cartQuantity), 0),
                uid: currentUser.uid || currentUser.email || "",
                username: currentUser.username || currentUser.name || customerNameVal
            };

            try {
                await addDoc(collection(db, "orders"), orderData);
                showLuxeToast('Đặt hàng thành công! Cảm ơn quý khách.', 'success');
                localStorage.removeItem('LuxeUserCart');
                localStorage.removeItem('cart');
                localStorage.removeItem('giohang');
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 1500);
            } catch (error) {
                console.error("Lỗi khi lưu đơn hàng: ", error);
                showLuxeToast('Có lỗi xảy ra khi xử lý đơn hàng.', 'error');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    injectLuxuryStyles();
    renderCart();
    initForm();
});
