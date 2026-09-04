import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, writeBatch, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { db } from './firebase-config.js';

const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(amount);
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const isCancelledStatus = (status) => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s.includes('cancel') || s.includes('hủy') || s === 'deleted';
};

const getStatusBadge = (status) => {
    if (!status) return `<span class="badge-status" style="border: 1px solid #d4af37; color: #d4af37; background: rgba(212, 175, 55, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">Chờ xử lý</span>`;
    const s = status.toLowerCase();
    
    if (s.includes('pending') || s.includes('chờ')) {
        return `<span class="badge-status" style="border: 1px solid #d4af37; color: #d4af37; background: rgba(212, 175, 55, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">Chờ xử lý</span>`;
    }
    if (s.includes('confirm') || s.includes('xác nhận')) {
        return `<span class="badge-status" style="border: 1px solid #3498db; color: #3498db; background: rgba(52, 152, 219, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">Đã xác nhận</span>`;
    }
    if (s.includes('ship') || s.includes('giao')) {
        return `<span class="badge-status" style="border: 1px solid #9b59b6; color: #9b59b6; background: rgba(155, 89, 182, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">Đang giao hàng</span>`;
    }
    if (s.includes('deliver') || s.includes('hoàn thành')) {
        return `<span class="badge-status" style="border: 1px solid #2ecc71; color: #2ecc71; background: rgba(46, 204, 113, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">Đã giao hàng</span>`;
    }
    if (isCancelledStatus(status)) {
        return `<span class="badge-status" style="border: 1px solid #e74c3c; color: #e74c3c; background: rgba(231, 76, 60, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">Đã hủy</span>`;
    }
    return `<span class="badge-status" style="border: 1px solid #95a5a6; color: #95a5a6; background: rgba(149, 165, 166, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; display: inline-block;">${status}</span>`;
};

const detectUserFromStorage = () => {
    const storages = [localStorage, sessionStorage];
    for (const storage of storages) {
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            try {
                const parsed = JSON.parse(storage.getItem(key));
                if (parsed && typeof parsed === 'object') {
                    if (parsed.uid) {
                        return { uid: parsed.uid, name: parsed.displayName || parsed.username || parsed.email };
                    }
                    if (parsed.id) {
                        return { uid: parsed.id, name: parsed.username || parsed.name || parsed.email };
                    }
                }
            } catch (e) {}
        }
    }
    return null;
};

// Khách hàng bấm Hủy đơn (Nếu đơn đã trừ kho thì cộng lại vào kho)
window.handleUserCancel = async (orderId) => {
    try {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const batch = writeBatch(db);

            if (orderData.stockDeducted && Array.isArray(orderData.items)) {
                orderData.items.forEach(item => {
                    const productId = item.id;
                    const qty = Number(item.cartQuantity || item.quantity || item.qty || 1);
                    if (productId) {
                        const productRef = doc(db, "products", productId);
                        batch.update(productRef, {
                            amount: increment(qty)
                        });
                    }
                });
                batch.update(orderRef, { status: "Cancelled", stockDeducted: false });
            } else {
                batch.update(orderRef, { status: "Cancelled" });
            }

            await batch.commit();
        } else {
            await updateDoc(orderRef, { status: "Cancelled" });
        }
        
        const badgeEl = document.getElementById(`status-badge-${orderId}`);
        if (badgeEl) badgeEl.innerHTML = getStatusBadge('Cancelled');

        const actionEl = document.getElementById(`action-btn-${orderId}`);
        if (actionEl) {
            actionEl.innerHTML = `
                <button class="btn btn-sm btn-outline-danger font-montserrat px-3" onclick="handleUserDelete('${orderId}')" title="Xóa khỏi danh sách">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;
        }
    } catch (e) {
        console.error("Lỗi khi hủy đơn:", e);
        alert("Không thể hủy đơn hàng lúc này!");
    }
};

window.handleUserDelete = async (orderId) => {
    try {
        await deleteDoc(doc(db, "orders", orderId));
        const card = document.getElementById(`order-card-${orderId}`);
        if (card) card.remove();
        
        const ordersContainer = document.getElementById('ordersContainer');
        if (ordersContainer && ordersContainer.children.length === 0) {
            const noOrdersMessage = document.getElementById('noOrdersMessage');
            if (noOrdersMessage) noOrdersMessage.classList.remove('d-none');
        }
    } catch (e) {
        console.error("Lỗi khi xóa đơn:", e);
        alert("Không thể xóa đơn hàng!");
    }
};

const loadUserOrders = async (uid) => {
    const ordersContainer = document.getElementById('ordersContainer');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    const authRequiredMessage = document.getElementById('authRequiredMessage');

    if (authRequiredMessage) authRequiredMessage.classList.add('d-none');

    try {
        const ordersQuery = query(collection(db, "orders"), where("uid", "==", uid));
        const querySnapshot = await getDocs(ordersQuery);

        if (querySnapshot.empty) {
            if (noOrdersMessage) noOrdersMessage.classList.remove('d-none');
            return;
        }

        const ordersList = [];
        querySnapshot.forEach((docSnap) => {
            ordersList.push({ id: docSnap.id, ...docSnap.data() });
        });

        ordersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        ordersContainer.innerHTML = '';
        ordersList.forEach((order) => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-group-card aura-fade-in';
            orderCard.id = `order-card-${order.id}`;

            let tableRowsHTML = '';
            if (Array.isArray(order.items)) {
                order.items.forEach((item) => {
                    const fallbackImg = "https://placehold.co/400x400/131419/E2C286?text=AURA";
                    const itemTotal = (item.cartQuantity || 1) * (item.unitPrice || 0);
                    tableRowsHTML += `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${item.image || fallbackImg}" class="order-item-thumb" alt="${item.name}">
                                    <div>
                                        <div class="font-playfair" style="font-weight: 600; font-size: 0.95rem;">${item.name}</div>
                                        <div class="font-montserrat text-secondary" style="font-size: 0.8rem;">Thương hiệu: ${item.brand || 'AURA'}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="font-montserrat text-center" style="font-size: 0.88rem;">${formatVND(item.unitPrice || 0)}</td>
                            <td class="font-montserrat text-center" style="font-size: 0.88rem;">${item.cartQuantity || 1}</td>
                            <td class="font-montserrat text-end text-gold" style="font-weight: 600; font-size: 0.9rem;">${formatVND(itemTotal)}</td>
                        </tr>
                    `;
                });
            }

            let actionButtonsHTML = '';
            const isCancelled = isCancelledStatus(order.status);

            if (order.status === 'Pending' && !isCancelled) {
                actionButtonsHTML = `
                    <button class="btn btn-cancel-order font-montserrat" onclick="handleUserCancel('${order.id}')">
                        <i class="bi bi-trash3 me-1"></i> Hủy Đơn
                    </button>
                `;
            } else if (isCancelled) {
                actionButtonsHTML = `
                    <button class="btn btn-sm btn-outline-danger font-montserrat px-3" onclick="handleUserDelete('${order.id}')" title="Xóa khỏi danh sách">
                        <i class="bi bi-x-lg"></i>
                    </button>
                `;
            }

            orderCard.innerHTML = `
                <div class="order-group-header">
                    <div class="font-montserrat">
                        <span class="text-gold" style="font-weight: 600; font-size: 0.85rem; letter-spacing: 1px;">MÃ ĐƠN HÀNG: #${order.id.toUpperCase()}</span>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);" class="mt-1">Thời gian đặt: ${formatDate(order.createdAt)}</div>
                    </div>
                    <div id="status-badge-${order.id}">${getStatusBadge(order.status)}</div>
                </div>

                <div class="order-group-body">
                    <div class="order-items-table-wrapper">
                        <table class="order-items-table font-montserrat">
                            <thead>
                                <tr>
                                    <th style="min-width: 220px;">Tác Phẩm Trang Sức</th>
                                    <th class="text-center" style="min-width: 120px;">Đơn Giá</th>
                                    <th class="text-center" style="min-width: 80px;">Số Lượng</th>
                                    <th class="text-end" style="min-width: 130px;">Thành Tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHTML}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-4 pt-3 border-top border-secondary border-opacity-10 font-montserrat" style="font-size: 0.88rem;">
                        <strong class="text-gold">Thông Tin Nhận Hàng:</strong> ${order.customerName || ''} (${order.customerPhone || ''}) — <span style="color: var(--text-secondary);">${order.customerAddress || ''}</span>
                        ${order.note ? `<br><i style="color: var(--text-secondary); font-size: 0.82rem;">Ghi chú: ${order.note}</i>` : ''}
                    </div>
                </div>

                <div class="order-group-footer">
                    <div class="font-montserrat" style="font-size: 0.9rem;">
                        Phương thức: <span style="color: var(--text-secondary);">${order.paymentMethod || 'COD'}</span> — Tổng đơn hàng: 
                        <strong class="text-gold font-montserrat" style="font-size: 1.2rem; margin-left: 6px;">
                            ${formatVND(order.totalAmount || 0)}
                        </strong>
                    </div>
                    <div id="action-btn-${order.id}">
                        ${actionButtonsHTML}
                    </div>
                </div>
            `;
            ordersContainer.appendChild(orderCard);
        });

    } catch (error) {
        console.error("Lỗi khi tải lịch sử đơn hàng:", error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const authRequiredMessage = document.getElementById('authRequiredMessage');
    const auth = getAuth();
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadUserOrders(user.uid);
        } else {
            const storageUser = detectUserFromStorage();
            if (storageUser && storageUser.uid) {
                loadUserOrders(storageUser.uid);
            } else {
                if (authRequiredMessage) authRequiredMessage.classList.remove('d-none');
            }
        }
    });
});