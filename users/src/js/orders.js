import { collection, query, where, onSnapshot, doc, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { db } from './firebase-config.js';

let unsubscribeOrders = null;
const actionLocks = new Set();

const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const isCancelledStatus = (status) => {
    if (!status) return false;
    const s = String(status).toLowerCase();
    return s.includes('cancel') || s.includes('hủy') || s === 'deleted';
};

const getStatusBadge = (status) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s.includes('pending') || s.includes('chờ')) return `<span class="badge-status" style="border: 1px solid #d4af37; color: #d4af37; background: rgba(212, 175, 55, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Chờ xử lý</span>`;
    if (s.includes('confirm') || s.includes('xác nhận')) return `<span class="badge-status" style="border: 1px solid #3498db; color: #3498db; background: rgba(52, 152, 219, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Đã xác nhận</span>`;
    if (s.includes('ship') || s.includes('giao')) return `<span class="badge-status" style="border: 1px solid #9b59b6; color: #9b59b6; background: rgba(155, 89, 182, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Đang giao hàng</span>`;
    if (s.includes('deliver') || s.includes('hoàn thành')) return `<span class="badge-status" style="border: 1px solid #2ecc71; color: #2ecc71; background: rgba(46, 204, 113, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Đã giao hàng</span>`;
    if (isCancelledStatus(status)) return `<span class="badge-status" style="border: 1px solid #e74c3c; color: #e74c3c; background: rgba(231, 76, 60, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Đã hủy</span>`;
    return `<span class="badge-status" style="border: 1px solid #95a5a6; color: #95a5a6; background: rgba(149, 165, 166, 0.08); padding: 4px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">${status}</span>`;
};

// Hàm Hủy Đơn Hàng (Đã tách chuẩn Phase Đọc & Phase Ghi để hoàn kho thành công)
window.handleUserCancel = async (orderId, btnElement) => {
    if (actionLocks.has(orderId)) return;

    actionLocks.add(orderId);
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Đang hủy...`;
    }

    try {
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, "orders", orderId);
            const orderSnap = await transaction.get(orderRef);

            if (!orderSnap.exists()) return;

            const orderData = orderSnap.data();
            if (isCancelledStatus(orderData.status)) return;

            const items = Array.isArray(orderData.items) ? orderData.items : [];

            // BƯỚC 1: ĐỌC TẤT CẢ DỮ LIỆU SẢN PHẨM TRƯỚC (READ PHASE)
            const productReads = [];
            for (const item of items) {
                const productId = item.id || item.productId || item._id;
                if (productId) {
                    const productRef = doc(db, "products", productId);
                    productReads.push({
                        item,
                        productRef,
                        promise: transaction.get(productRef)
                    });
                }
            }

            const productSnaps = await Promise.all(productReads.map(p => p.promise));

            // BƯỚC 2: THỰC HIỆN CẬP NHẬT TẤT CẢ SẢN PHẨM SAU (WRITE PHASE)
            productReads.forEach((p, index) => {
                const productSnap = productSnaps[index];
                if (productSnap.exists()) {
                    const pData = productSnap.data();
                    const qty = Number(p.item.cartQuantity || p.item.quantity || p.item.qty || 1);
                    const currentStock = Number(pData.amount ?? pData.stock ?? pData.quantity ?? 0);

                    transaction.update(p.productRef, {
                        amount: currentStock + qty
                    });
                }
            });

            // BƯỚC 3: CẬP NHẬT ĐƠN HÀNG
            transaction.update(orderRef, {
                status: "Cancelled",
                stockDeducted: false,
                updatedAt: new Date()
            });
        });
    } catch (e) {
        console.error("Lỗi khi hủy đơn & hoàn kho:", e);
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerHTML = `<i class="bi bi-trash3 me-1"></i> Hủy Đơn`;
        }
    } finally {
        actionLocks.delete(orderId);
    }
};

// Hàm Xóa Đơn Hàng Khỏi Lịch Sử
window.handleUserDelete = async (orderId, btnElement) => {
    if (actionLocks.has(orderId)) return;

    actionLocks.add(orderId);
    if (btnElement) btnElement.disabled = true;

    try {
        await deleteDoc(doc(db, "orders", orderId));
    } catch (e) {
        console.error("Lỗi khi xóa đơn:", e);
        if (btnElement) btnElement.disabled = false;
    } finally {
        actionLocks.delete(orderId);
    }
};

const listenUserOrders = (uid) => {
    const ordersContainer = document.getElementById('ordersContainer');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    const authRequiredMessage = document.getElementById('authRequiredMessage');

    if (authRequiredMessage) authRequiredMessage.classList.add('d-none');
    if (unsubscribeOrders) unsubscribeOrders();

    const ordersQuery = query(collection(db, "orders"), where("uid", "==", uid));

    unsubscribeOrders = onSnapshot(ordersQuery, (querySnapshot) => {
        if (querySnapshot.empty) {
            ordersContainer.innerHTML = '';
            if (noOrdersMessage) noOrdersMessage.classList.remove('d-none');
            return;
        }

        if (noOrdersMessage) noOrdersMessage.classList.add('d-none');

        const ordersList = [];
        querySnapshot.forEach((docSnap) => {
            ordersList.push({ ...docSnap.data(), id: docSnap.id });
        });

        ordersList.sort((a, b) => {
            const timeA = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const timeB = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
        });

        ordersContainer.innerHTML = '';
        ordersList.forEach((order) => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-group-card aura-fade-in';
            const safeId = order.id ? String(order.id) : 'N/A';
            orderCard.id = `order-card-${safeId}`;

            let tableRowsHTML = '';
            if (Array.isArray(order.items)) {
                order.items.forEach((item) => {
                    const fallbackImg = "https://placehold.co/400x400/131419/E2C286?text=AURA";
                    const itemTotal = (item.cartQuantity || item.quantity || 1) * (item.unitPrice || item.price || 0);
                    tableRowsHTML += `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${item.image || fallbackImg}" class="order-item-thumb" alt="${item.name || 'Sản phẩm'}">
                                    <div>
                                        <div class="font-playfair" style="font-weight: 600; font-size: 0.95rem;">${item.name || 'Sản phẩm trang sức'}</div>
                                        <div class="font-montserrat text-secondary" style="font-size: 0.8rem;">Thương hiệu: ${item.brand || 'AURA'}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="font-montserrat text-center" style="font-size: 0.88rem;">${formatVND(item.unitPrice || item.price || 0)}</td>
                            <td class="font-montserrat text-center" style="font-size: 0.88rem;">${item.cartQuantity || item.quantity || 1}</td>
                            <td class="font-montserrat text-end text-gold" style="font-weight: 600; font-size: 0.9rem;">${formatVND(itemTotal)}</td>
                        </tr>
                    `;
                });
            }

            let actionButtonsHTML = '';
            const isCancelled = isCancelledStatus(order.status);
            const currentStatus = order.status || 'Pending';

            if ((currentStatus === 'Pending' || currentStatus === 'Chờ xử lý') && !isCancelled) {
                actionButtonsHTML = `
                    <button class="btn btn-cancel-order font-montserrat" onclick="handleUserCancel('${safeId}', this)">
                        <i class="bi bi-trash3 me-1"></i> Hủy Đơn
                    </button>
                `;
            } else if (isCancelled) {
                actionButtonsHTML = `
                    <button class="btn btn-sm btn-outline-danger font-montserrat px-3" onclick="handleUserDelete('${safeId}', this)" title="Xóa khỏi danh sách">
                        <i class="bi bi-x-lg"></i>
                    </button>
                `;
            }

            orderCard.innerHTML = `
                <div class="order-group-header">
                    <div class="font-montserrat">
                        <span class="text-gold" style="font-weight: 600; font-size: 0.85rem; letter-spacing: 1px;">MÃ ĐƠN HÀNG: #${safeId.toUpperCase()}</span>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);" class="mt-1">Thời gian đặt: ${formatDate(order.createdAt)}</div>
                    </div>
                    <div>${getStatusBadge(currentStatus)}</div>
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
                                ${tableRowsHTML || '<tr><td colspan="4" class="text-center text-muted py-3">Không tìm thấy chi tiết sản phẩm</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <div class="mt-4 pt-3 border-top border-secondary border-opacity-10 font-montserrat" style="font-size: 0.88rem;">
                        <strong class="text-gold">Thông Tin Nhận Hàng:</strong> ${order.customerName || order.username || 'Khách hàng'} (${order.customerPhone || order.phone || 'SĐT'}) — <span style="color: var(--text-secondary);">${order.customerAddress || order.address || 'Chưa có địa chỉ'}</span>
                    </div>
                </div>

                <div class="order-group-footer">
                    <div class="font-montserrat" style="font-size: 0.9rem;">
                        Phương thức: <span style="color: var(--text-secondary);">${order.paymentMethod || 'COD'}</span> — Tổng đơn hàng: 
                        <strong class="text-gold font-montserrat" style="font-size: 1.2rem; margin-left: 6px;">
                            ${formatVND(order.totalAmount || 0)}
                        </strong>
                    </div>
                    <div>${actionButtonsHTML}</div>
                </div>
            `;
            ordersContainer.appendChild(orderCard);
        });
    }, (error) => {
        console.error("Lỗi kết nối Firestore:", error);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            listenUserOrders(user.uid);
        } else {
            const authRequiredMessage = document.getElementById('authRequiredMessage');
            if (authRequiredMessage) authRequiredMessage.classList.remove('d-none');
        }
    });
});