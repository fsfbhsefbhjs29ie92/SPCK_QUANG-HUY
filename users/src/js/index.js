import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tự động gán năm hiện tại vào footer
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Chờ tải xong toàn bộ danh sách sản phẩm trước rồi mới xử lý vị trí cuộn
    await fetchHomeProducts();

    // 3. Xử lý cuộn chính xác sau khi sản phẩm đã render hoàn tất
    if (window.location.hash) {
        const targetHash = window.location.hash;
        const targetEl = document.querySelector(targetHash);
        
        if (targetEl) {
            setTimeout(() => {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                targetEl.classList.add('is-visible', 'highlight-section');
                
                setTimeout(() => {
                    targetEl.classList.remove('highlight-section');
                }, 2500);
            }, 200);
        }
    }

    // 4. Hiệu ứng Intersection Observer cho các mục khi cuộn chuột bình thường
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.aura-world-sub-section').forEach(section => {
        observer.observe(section);
    });

    // 5. Xử lý click mượt mà khi đang đứng ngay tại trang chủ (index.html)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, null, targetId);
                
                document.querySelectorAll('.aura-world-sub-section').forEach(sec => {
                    sec.classList.remove('highlight-section');
                });
                
                targetEl.classList.add('is-visible', 'highlight-section');
                setTimeout(() => {
                    targetEl.classList.remove('highlight-section');
                }, 2500);
            }
        });
    });
});

let allProducts = [];
const fallbackImage = "https://placehold.co/400x400/131419/E2C286?text=AURA+JEWELRY&font=playfair-display";

// Hàm lấy dữ liệu sản phẩm từ Firestore cho trang chủ
async function fetchHomeProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        const hotProducts = [...allProducts].sort(() => 0.5 - Math.random()).slice(0, 6);
        const newProducts = [...allProducts].reverse().slice(0, 6);
        const discountProducts = allProducts.filter(p => p.discount && p.discount > 0).slice(0, 6);
        
        renderRow('hotProductsRow', hotProducts);
        renderRow('newProductsRow', newProducts);
        renderRow('discountProductsRow', discountProducts);
    } catch (error) {
        console.error("Lỗi khi kết nối Firestore:", error);
    }
}

function renderRow(containerId, products) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    products.forEach((product, index) => {
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
                    <p class="product-desc font-montserrat">${product.description || 'Sản phẩm trang sức cao cấp AURA.'}</p>
                    
                    <div class="price-box font-montserrat mb-3">
                        ${hasDiscount ? `<span class="price-old">${formatVND(product.price)}</span>` : ''}
                        <span class="price-current">${formatVND(finalPrice)}</span>
                    </div>
                    
                    <button class="btn btn-aura font-montserrat btn-add-cart" 
                            data-id="${product.id}" 
                            ${isOutOfStock ? 'disabled' : ''}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(col);

        requestAnimationFrame(() => {
            setTimeout(() => {
                col.classList.add('is-visible');
            }, index * 50);
        });
    });

    container.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            addToCart(e.currentTarget.getAttribute('data-id'));
        });
    });
}

function formatVND(number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

function getFinalPrice(product) {
    return product.discount ? product.price * (1 - product.discount / 100) : product.price;
}

// Logic thêm vào giỏ hàng
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
            alert('Sản phẩm này đã đạt giới hạn số lượng trong kho!');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            image: product.image || fallbackImage,
            brand: product.brand || 'AURA',
            unitPrice: finalPrice,
            cartQuantity: 1,
            maxAmount: product.amount
        });
    }

    localStorage.setItem('LuxeUserCart', JSON.stringify(cart));
    showToast();
}

// Hàm hiển thị Toast chuẩn chỉnh màu sắc theo CSS hệ thống
function showToast() {
    let toastEl = document.getElementById('cartToast');
    
    if (!toastEl) {
        let toastContainer = document.getElementById('auraToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'auraToastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '99999';
            document.body.appendChild(toastContainer);
        }

        toastContainer.innerHTML = `
            <div id="cartToast" class="toast aura-toast" role="alert" aria-live="assertive" aria-atomic="true" style="background-color: var(--bg-card); border: 1px solid var(--gold-primary); color: var(--text-primary);">
                <div class="toast-header aura-toast-header font-playfair" style="background-color: rgba(226, 194, 134, 0.1); border-bottom: 1px solid var(--border-color); color: var(--text-primary);">
                    <strong class="me-auto text-gold" style="color: var(--gold-primary);">AURA JEWELRY</strong>
                </div>
                <div class="toast-body font-montserrat" style="color: var(--text-primary);">
                    Sản phẩm đã được thêm vào giỏ hàng.
                </div>
            </div>
        `;
        toastEl = document.getElementById('cartToast');
    }

    if (toastEl && window.bootstrap) {
        const toast = new bootstrap.Toast(toastEl, { delay: 2500 });
        toast.show();
    }
}

window.addToCart = (productId) => {
    addToCart(productId);
};