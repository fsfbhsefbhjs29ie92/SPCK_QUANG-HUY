import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCollection = collection(db, "products");

const productList = document.getElementById("productList");
const totalProductsEl = document.getElementById("totalProducts");
const lowStockProductsEl = document.getElementById("lowStockProducts");
const productForm = document.getElementById("productForm");
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const btnOpenAddModal = document.getElementById("btnOpenAddModal");

let productsData = [];

const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// 1. TẢI DANH SÁCH
async function fetchProducts() {
    try {
        const querySnapshot = await getDocs(productsCollection);
        productsData = [];
        let lowStockCount = 0;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            productsData.push(data);

            if (parseInt(data.amount) <= 10) lowStockCount++;
        });

        totalProductsEl.innerText = productsData.length;
        lowStockProductsEl.innerText = lowStockCount;

        renderProducts(productsData);
    } catch (error) {
        console.error("Lỗi kết nối Firebase:", error);
        productList.innerHTML = `
            <div class="col-12 text-center text-danger py-5">
                Không thể tải dữ liệu sản phẩm từ hệ thống!
            </div>
        `;
    }
}

// 2. HIỂN THỊ DẠNG THẺ TỐI GIẢN
function renderProducts(products) {
    productList.innerHTML = "";

    if (products.length === 0) {
        productList.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                Chưa có sản phẩm nào trong CSDL.
            </div>
        `;
        return;
    }

    products.forEach(p => {
        const discountVal = p.discount ? parseInt(p.discount) : 0;
        const finalPrice = p.price - (p.price * (discountVal / 100));

        let badgeHTML = '';
        if (parseInt(p.amount) === 0) {
            badgeHTML = `<span class="product-badge badge-alert">HẾT HÀNG</span>`;
        } else if (discountVal > 0) {
            badgeHTML = `<span class="product-badge badge-discount">-${discountVal}%</span>`;
        }

        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
        // Tìm đoạn này trong file product.js của bạn:
        col.innerHTML = `
    <div class="product-card">
        <div class="product-img-wrapper">
            ${badgeHTML}
            <img src="${p.image}" class="product-img" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
        </div>

        <!-- THAY THẾ HOẶC ĐẶT ĐOẠN CODE ĐÓ VÀO ĐÂY -->
        <div class="product-body">
            <div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge bg-dark text-warning border border-warning" style="font-size: 0.65rem;">${p.brand || 'AURA'}</span>
                    <span class="text-muted" style="font-size: 0.75rem;">${p.category || 'Trang sức'}</span>
                </div>
                <h4 class="product-title font-serif" title="${p.name}">${p.name}</h4>
                <div class="d-flex align-items-baseline mb-2">
                    <span class="product-price">${formatVND(finalPrice)}</span>
                    ${discountVal > 0 ? `<span class="product-price-old">${formatVND(p.price)}</span>` : ''}
                </div>
            </div>
            <p class="product-stock">Tồn kho: <span class="${p.amount <= 10 ? 'text-danger fw-bold' : 'text-white'}">${p.amount}</span></p>
        </div>

        <div class="product-actions d-flex justify-content-between">
            <button class="btn-action edit" data-id="${p.id}">Chỉnh Sửa</button>
            <button class="btn-action delete" data-id="${p.id}">Xóa</button>
        </div>
    </div>
`;
        col.querySelector('.btn-action.edit').addEventListener('click', () => editProduct(p.id));
        col.querySelector('.btn-action.delete').addEventListener('click', () => deleteProduct(p.id));

        productList.appendChild(col);
    });
}

// 3. THÊM HOẶC CẬP NHẬT
productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("productId").value;
    const productData = {
        name: document.getElementById("pName").value.trim(),
        image: document.getElementById("pImage").value.trim(),
        category: document.getElementById("pCategory").value, // Thêm mới
        brand: document.getElementById("pBrand").value,       // Thêm mới
        price: Number(document.getElementById("pPrice").value),
        discount: Number(document.getElementById("pDiscount").value) || 0,
        amount: Number(document.getElementById("pAmount").value),
        description: document.getElementById("pDesc").value.trim()
    };

    const btnSave = document.getElementById("btnSave");
    btnSave.innerHTML = `ĐANG LƯU...`;
    btnSave.disabled = true;

    try {
        if (id) {
            await updateDoc(doc(db, "products", id), productData);
        } else {
            productData.createdAt = Date.now();
            await addDoc(productsCollection, productData);
        }

        productModal.hide();
        fetchProducts();
    } catch (error) {
        console.error("Lỗi lưu sản phẩm:", error);
        alert("Thao tác thất bại!");
    } finally {
        btnSave.innerHTML = "LƯU SẢN PHẨM";
        btnSave.disabled = false;
    }
});

// 4. CHỈNH SỬA
function editProduct(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    document.getElementById("modalTitle").innerText = "Chỉnh Sửa Sản Phẩm";
    document.getElementById("productId").value = product.id;
    document.getElementById("pCategory").value = product.category || ""; // Thêm mới
    document.getElementById("pBrand").value = product.brand || "";
    document.getElementById("pName").value = product.name;
    document.getElementById("pImage").value = product.image;
    document.getElementById("pPrice").value = product.price;
    document.getElementById("pDiscount").value = product.discount || 0;
    document.getElementById("pAmount").value = product.amount;
    document.getElementById("pDesc").value = product.description || "";

    productModal.show();
}

// 5. XÓA
async function deleteProduct(id) {
    if (confirm("Xác nhận xóa sản phẩm này khỏi hệ thống?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            fetchProducts();
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error);
            alert("Xóa không thành công!");
        }
    }
}

// 6. MỞ MODAL THÊM
btnOpenAddModal.addEventListener("click", () => {
    document.getElementById("modalTitle").innerText = "Thêm Sản Phẩm Mới";
    productForm.reset();
    document.getElementById("productId").value = "";
    productModal.show();
});

// 7. ĐĂNG XUẤT
document.getElementById("btnLogout").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Đăng xuất khỏi tài khoản admin?")) {
        sessionStorage.removeItem("isAdminLoggedIn");
        window.location.href = "index.html";
    }
});

fetchProducts();
// HÀM LỌC VÀ TÌM KIẾM SẢN PHẨM
function applyFilters() {
    const keyword = document.getElementById("searchName").value.toLowerCase().trim();
    const selectedCategory = document.getElementById("filterCategory").value;
    const selectedBrand = document.getElementById("filterBrand").value;
    const priceRange = document.getElementById("filterPrice").value;

    let filtered = productsData.filter(p => {
        // 1. Khớp tên sản phẩm
        const matchName = p.name.toLowerCase().includes(keyword);

        // 2. Khớp danh mục
        const matchCategory = selectedCategory === "" || p.category === selectedCategory;

        // 3. Khớp thương hiệu
        const matchBrand = selectedBrand === "" || p.brand === selectedBrand;

        // 4. Khớp khoảng giá (tính theo giá sau khi đã giảm giá nếu có)
        let matchPrice = true;
        const discountVal = p.discount ? parseInt(p.discount) : 0;
        const finalPrice = p.price - (p.price * (discountVal / 100));

        if (priceRange !== "") {
            const [min, max] = priceRange.split("-");
            if (max === "max") {
                matchPrice = finalPrice >= Number(min);
            } else {
                matchPrice = finalPrice >= Number(min) && finalPrice <= Number(max);
            }
        }

        return matchName && matchCategory && matchBrand && matchPrice;
    });

    renderProducts(filtered);
}

// ĐĂNG KÝ SỰ KIỆN LẮNG NGHE THAY ĐỔI CHO BỘ LỌC
document.getElementById("searchName").addEventListener("input", applyFilters);
document.getElementById("filterCategory").addEventListener("change", applyFilters);
document.getElementById("filterBrand").addEventListener("change", applyFilters);
document.getElementById("filterPrice").addEventListener("change", applyFilters);