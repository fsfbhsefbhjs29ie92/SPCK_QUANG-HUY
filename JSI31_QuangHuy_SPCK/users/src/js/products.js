// ==========================================================================
// AURA HIGH JEWELRY - PRODUCTS.JS (FIREBASE, FILTER, PAGINATION & CART)
// ==========================================================================

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    let allProducts = [];
    let currentFilteredProducts = [];
    let currentPage = 1;
    const itemsPerPage = 16; // Cố định 16 sản phẩm mỗi trang

    // DOM Elements
    const productListEl = document.getElementById('productList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    
    // Filter Elements
    const searchInput = document.getElementById('searchInput');
    const filterBrand = document.getElementById('filterBrand');
    const filterCategory = document.getElementById('filterCategory');
    const sortPrice = document.getElementById('sortPrice');
    const filterPriceRange = document.getElementById('filterPriceRange');

    const fallbackImage = "https://placehold.co/400x400/131419/E2C286?text=AURA+JEWELRY&font=playfair-display";

    if (!productListEl) {
        console.error("LỖI: Không tìm thấy phần tử có id 'productList' trong HTML.");
        return;
    }

    // Khởi chạy lấy dữ liệu từ Firebase
    fetchProducts();

    async function fetchProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            allProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            populateFilters(allProducts);

            if (loadingSpinner) loadingSpinner.classList.add('d-none');
            
            currentFilteredProducts = [...allProducts];
            renderProducts(currentFilteredProducts);

        } catch (error) {
            console.error("Lỗi kết nối Firebase Firestore:", error);
            if (loadingSpinner) {
                loadingSpinner.innerHTML = `<p class="text-danger font-montserrat">Không thể tải dữ liệu: ${error.message}</p>`;
            }
        }
    }

    // Tự động sinh danh sách bộ lọc Brand & Category từ dữ liệu thực tế
    function populateFilters(products) {
        if (!filterBrand || !filterCategory) return;

        const brands = [...new Set(products.map(p => p.brand))].filter(Boolean);
        const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

        filterBrand.innerHTML = '<option value="all">Tất cả thương hiệu</option>';
        filterCategory.innerHTML = '<option value="all">Mọi phân loại</option>';

        brands.forEach(brand => {
            filterBrand.innerHTML += `<option value="${brand}">${brand}</option>`;
        });
        
        categories.forEach(category => {
            filterCategory.innerHTML += `<option value="${category}">${category}</option>`;
        });
    }

    // Render danh sách sản phẩm theo trang hiện tại
    function renderProducts(products) {
        productListEl.innerHTML = '';

        if (products.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        if (emptyState) emptyState.classList.add('d-none');

        // Tính toán phân trang
        const totalPages = Math.ceil(products.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);

        // Render từng card sản phẩm
        paginatedProducts.forEach((product, index) => {
            const hasDiscount = product.discount && product.discount > 0;
            const finalPrice = hasDiscount 
                ? product.price * (1 - product.discount / 100) 
                : product.price;

            const isOutOfStock = product.amount <= 0;
            const btnText = isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ';
            const brandDisplay = product.brand || 'AURA';

            const col = document.createElement('div');
            col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 aura-product-animate';
            
            col.innerHTML = `
                <div class="card aura-card">
                    ${hasDiscount ? `<span class="aura-badge">-${product.discount}%</span>` : ''}
                    <div class="aura-img-wrapper">
                        <img src="${product.image || fallbackImage}" 
                             onerror="this.onerror=null; this.src='${fallbackImage}';" 
                             alt="${product.name}" loading="lazy">
                    </div>
                    <div class="card-body">
                        <div class="product-meta font-montserrat">${brandDisplay} • ${product.category || 'Trang sức'}</div>
                        <h5 class="product-title font-playfair">${product.name}</h5>
                        <p class="product-desc font-montserrat">${product.description || 'Tuyệt tác trang sức đẳng cấp.'}</p>
                        
                        <div class="price-box font-montserrat mb-3">
                            ${hasDiscount ? `<span class="price-old">${formatVND(product.price)}</span>` : ''}
                            <span class="price-current">${formatVND(finalPrice)}</span>
                        </div>
                        
                        <button class="btn btn-aura font-montserrat btn-add-cart w-100" 
                                data-id="${product.id}" 
                                ${isOutOfStock ? 'disabled' : ''}>
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
            productListEl.appendChild(col);

            setTimeout(() => {
                col.classList.add('is-visible');
            }, index * 40);
        });

        // Gắn sự kiện nút Thêm vào giỏ hàng
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                addToCart(e.currentTarget.getAttribute('data-id'));
            });
        });

        renderPaginationUI(products.length);
    }

    // Render giao diện thanh phân trang
    function renderPaginationUI(totalItems) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return; // Ẩn phân trang nếu chỉ có 1 trang

        // Nút Trước
        paginationContainer.innerHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link font-montserrat" href="#" data-page="${currentPage - 1}">Trước</a>
            </li>
        `;

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link font-montserrat" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Nút Sau
        paginationContainer.innerHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link font-montserrat" href="#" data-page="${currentPage + 1}">Sau</a>
            </li>
        `;

        // Lắng nghe sự kiện bấm chuyển trang kèm cuộn mượt
        paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = parseInt(e.currentTarget.getAttribute('data-page'));
                if (targetPage >= 1 && targetPage <= totalPages && targetPage !== currentPage) {
                    currentPage = targetPage;
                    renderProducts(currentFilteredProducts);
                    
                    // Cuộn mượt lên khu vực bộ lọc sản phẩm (.aura-controls) hoặc trang
                    const controlsEl = document.querySelector('.aura-controls');
                    if (controlsEl) {
                        controlsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        productListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    // Định dạng tiền tệ VND
    function formatVND(number) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
    }

    // Xử lý lọc và tìm kiếm sản phẩm
    function handleFilters() {
        let filtered = [...allProducts];

        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase().trim();
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.name.toLowerCase().includes(searchTerm) || 
                    (p.brand && p.brand.toLowerCase().includes(searchTerm))
                );
            }
        }

        if (filterBrand && filterBrand.value !== 'all') {
            filtered = filtered.filter(p => p.brand === filterBrand.value);
        }

        if (filterCategory && filterCategory.value !== 'all') {
            filtered = filtered.filter(p => p.category === filterCategory.value);
        }

        if (filterPriceRange && filterPriceRange.value !== 'all') {
            const priceRange = filterPriceRange.value;
            filtered = filtered.filter(p => {
                const finalPrice = p.discount ? p.price * (1 - p.discount / 100) : p.price;
                if (priceRange === 'under50') return finalPrice < 50000000;
                if (priceRange === '50to100') return finalPrice >= 50000000 && finalPrice <= 100000000;
                if (priceRange === 'over100') return finalPrice > 100000000;
                return true;
            });
        }

        if (sortPrice) {
            const sortVal = sortPrice.value;
            if (sortVal === 'asc') {
                filtered.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
            } else if (sortVal === 'desc') {
                filtered.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
            }
        }

        currentFilteredProducts = filtered;
        currentPage = 1; // Đưa về trang đầu khi thay đổi bộ lọc
        renderProducts(currentFilteredProducts);
    }

    function getFinalPrice(product) {
        return product.discount ? product.price * (1 - product.discount / 100) : product.price;
    }

    // Lắng nghe sự kiện từ các ô bộ lọc
    [searchInput, filterBrand, filterCategory, sortPrice, filterPriceRange].forEach(el => {
        if (el) {
            el.addEventListener('input', handleFilters);
            if (el.tagName === 'SELECT') el.addEventListener('change', handleFilters);
        }
    });

    // Thêm sản phẩm vào giỏ hàng (LocalStorage)
    function addToCart(productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const finalPrice = getFinalPrice(product);
        let cart = JSON.parse(localStorage.getItem('LuxeUserCart')) || [];
        const existingItemIndex = cart.findIndex(item => item.id === productId);

        if (existingItemIndex > -1) {
            if (cart[existingItemIndex].cartQuantity < product.amount) {
                cart[existingItemIndex].cartQuantity += 1;
            } else {
                alert('Sản phẩm này đã đạt giới hạn số lượng có sẵn trong kho!');
                return;
            }
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                image: product.image,
                brand: product.brand || 'AURA',
                unitPrice: finalPrice,
                cartQuantity: 1,
                maxAmount: product.amount
            });
        }

        localStorage.setItem('LuxeUserCart', JSON.stringify(cart));
        showToast();
    }

    // Hiển thị thông báo Toast khi thêm giỏ hàng thành công
    function showToast() {
        const toastEl = document.getElementById('cartToast');
        if (toastEl && window.bootstrap) {
            const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
            toast.show();
        }
    }
});