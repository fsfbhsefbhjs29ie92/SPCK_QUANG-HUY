import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

let allOrders = [];

const formatVND = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

const formatDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput.toDate === 'function' ? dateInput.toDate() : new Date(dateInput);
    return isNaN(date.getTime()) ? dateInput : date.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const getStatusBadgeClass = (status) => {
    switch(status) {
        case 'Pending': return 'status-pending';
        case 'Confirmed': return 'status-confirmed';
        case 'Shipping': return 'status-shipping';
        case 'Delivered': return 'status-delivered';
        case 'Returning': return 'status-returned';
        case 'Canceled': case 'Cancelled': return 'status-canceled';
        default: return 'status-pending';
    }
};

const renderOrders = (orders) => {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không tìm thấy đơn hàng nào trong hệ thống.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const itemsHtml = (o.items || []).map(item => {
            const itemName = item.name || item.title || item.productName || 'Sản phẩm không có tên';
            const itemPrice = Number(item.price || item.unitPrice || item.cost || 0);
            const itemQty = Number(item.cartQuantity || item.quantity || item.qty || 1);
            const itemImg = item.image || item.img || item.photo || 'https://placehold.co/400';

            return `
                <div class="d-flex align-items-center mb-1 text-muted" style="font-size: 0.82rem;">
                    <img src="${itemImg}" alt="${itemName}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;" class="me-2 border border-secondary" onerror="this.src='https://placehold.co/400'">
                    <span class="text-light fw-medium text-truncate" style="max-width: 180px;" title="${itemName}">${itemName}</span>
                    <span class="ms-auto text-warning fw-bold">x${itemQty} (${formatVND(itemPrice)})</span>
                </div>
            `;
        }).join('');

        const customerName = o.customerName || o.name || o.username || o.fullName || 'Khách vãng lai';
        const customerPhone = o.phone || o.customerPhone || o.tel || o.phoneNumber || 'Chưa cập nhật SĐT';
        const customerAddress = o.address || o.customerAddress || o.shippingAddress || o.location || 'Chưa có địa chỉ';
        const totalAmount = Number(o.totalAmount || o.total || o.amount || 0);
        const orderStatus = o.status || 'Pending';

        return `
            <tr>
                <td>
                    <strong class="text-info">#${o.id ? o.id.substring(0, 8).toUpperCase() : 'N/A'}</strong><br>
                    <small class="text-muted">TT: ${o.paymentMethod || 'COD'}</small>
                </td>
                <td>
                    <div class="fw-bold text-light">${customerName}</div>
                    <div class="small text-muted"><i class="bi bi-telephone me-1"></i>${customerPhone}</div>
                    <div class="small text-muted text-truncate" style="max-width: 180px;" title="${customerAddress}"><i class="bi bi-geo-alt me-1"></i>${customerAddress}</div>
                </td>
                <td>
                    <div class="mb-2">${itemsHtml || '<span class="text-muted small">Không có chi tiết sản phẩm</span>'}</div>
                    <div class="text-danger fw-bold border-top border-secondary pt-1">Tổng tiền: ${formatVND(totalAmount)}</div>
                </td>
                <td>${formatDate(o.createdAt)}</td>
                <td>
                    <select class="form-select form-select-sm status-select ${getStatusBadgeClass(orderStatus)}" data-id="${o.id}">
                        <option value="Pending" ${orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Confirmed" ${orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Shipping" ${orderStatus === 'Shipping' ? 'selected' : ''}>Shipping</option>
                        <option value="Returning" ${orderStatus === 'Returning' ? 'selected' : ''}>Returning</option>
                        <option value="Delivered" ${orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Canceled" ${orderStatus === 'Canceled' || orderStatus === 'Cancelled' ? 'selected' : ''}>Canceled</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.saveStatus('${o.id}')">
                        <i class="bi bi-check-circle me-1"></i>Cập nhật
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

const updateStats = (orders) => {
    const totalOrdersEl = document.getElementById('totalOrders');
    const canceledOrdersEl = document.getElementById('canceledOrders');

    if (totalOrdersEl) totalOrdersEl.innerText = orders.length;
    
    const canceledCount = orders.filter(o => o.status === 'Canceled' || o.status === 'Cancelled').length;
    if (canceledOrdersEl) canceledOrdersEl.innerText = canceledCount;
};

const applyFilters = () => {
    const searchUserEl = document.getElementById('searchUser');
    const searchDateEl = document.getElementById('searchDate');
    const searchAmountEl = document.getElementById('searchAmount');

    const sUser = searchUserEl ? searchUserEl.value.toLowerCase().trim() : '';
    const sDate = searchDateEl ? searchDateEl.value : '';
    const sAmount = searchAmountEl ? Number(searchAmountEl.value) || 0 : 0;

    const filtered = allOrders.filter(o => {
        const userName = (o.customerName || o.name || o.username || '').toLowerCase();
        const userPhone = (o.phone || o.customerPhone || '').toLowerCase();
        const matchUser = userName.includes(sUser) || userPhone.includes(sUser);

        // Lọc ngày chuẩn xác theo múi giờ địa phương (Việt Nam)
        let matchDate = true;
        if (sDate && o.createdAt) {
            let orderDate = typeof o.createdAt.toDate === 'function' ? o.createdAt.toDate() : new Date(o.createdAt);

            if (!isNaN(orderDate.getTime())) {
                const year = orderDate.getFullYear();
                const month = String(orderDate.getMonth() + 1).padStart(2, '0');
                const day = String(orderDate.getDate()).padStart(2, '0');
                const orderDateStr = `${year}-${month}-${day}`;
                matchDate = orderDateStr === sDate;
            } else {
                matchDate = false;
            }
        }

        const total = Number(o.totalAmount || o.total || 0);
        const matchAmount = total >= sAmount;

        return matchUser && matchDate && matchAmount;
    });

    renderOrders(filtered);
};

window.saveStatus = async (id) => {
    const selectEl = document.querySelector(`select[data-id="${id}"]`);
    if (!selectEl) return;
    const newStatus = selectEl.value;

    try {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, { status: newStatus });
        alert('Cập nhật trạng thái đơn hàng thành công!');
    } catch (err) {
        console.error("Lỗi cập nhật trạng thái:", err);
        alert('Cập nhật thất bại: ' + err.message);
    }
};

// Xử lý đăng xuất toàn cục bằng Event Delegation (bắt mọi cú click nút #btnLogout)
document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('#btnLogout');
    if (logoutBtn) {
        e.preventDefault();
        if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?")) {
            sessionStorage.clear();
            localStorage.clear();
            window.location.replace("index.html");
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const ordersCollection = collection(db, "orders");

    onSnapshot(ordersCollection, (snapshot) => {
        allOrders = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        allOrders.sort((a, b) => {
            const timeA = (a.createdAt && typeof a.createdAt.toDate === 'function') ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const timeB = (b.createdAt && typeof b.createdAt.toDate === 'function') ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
        });

        updateStats(allOrders);
        applyFilters();
    }, (error) => {
        console.error("Lỗi kết nối Firestore:", error);
    });

    document.getElementById('searchUser')?.addEventListener('input', applyFilters);
    document.getElementById('searchDate')?.addEventListener('change', applyFilters);
    document.getElementById('searchAmount')?.addEventListener('input', applyFilters);
});