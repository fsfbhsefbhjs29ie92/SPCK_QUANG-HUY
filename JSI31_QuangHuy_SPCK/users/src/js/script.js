// ==========================================================================
// AURA HIGH JEWELRY - SCRIPT.JS (GLOBAL UI & UTILITIES - UNIFIED)
// ==========================================================================

// Áp dụng Theme ngay lập tức khi load script để tránh chớp trắng màn hình
(function() {
    const savedTheme = localStorage.getItem('auraTheme') || localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('darkmode');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       1. XỬ LÝ THEME TOGGLE (LIGHTMODE / DARKMODE & LOCALSTORAGE)
       ========================================================================== */
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyEl = document.body;

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            bodyEl.classList.toggle('darkmode');
            const isDark = bodyEl.classList.contains('darkmode');
            
            // Lưu đồng nhất vào 'auraTheme' và xóa key cũ nếu có
            localStorage.setItem('auraTheme', isDark ? 'dark' : 'light');
            localStorage.removeItem('theme');
        });
    }

    /* ==========================================================================
       2. XỬ LÝ HEADER CUỘN TRANG (SCROLLED STATE)
       ========================================================================== */
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        });
    }

    /* ==========================================================================
       3. XỬ LÝ FOOTER (NĂM BẢN QUYỀN & VIP NEWSLETTER)
       ========================================================================== */
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    const newsletterForm = document.getElementById('vipNewsletterForm');
    const vipEmailInput = document.getElementById('vipEmail');
    const formFeedback = document.getElementById('formFeedback');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailValue = vipEmailInput ? vipEmailInput.value.trim() : '';

            if (emailValue) {
                const submitBtn = newsletterForm.querySelector('.luxe-btn-submit');
                const originalText = submitBtn ? submitBtn.innerHTML : '';
                
                if (submitBtn) {
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang xử lý...';
                    submitBtn.disabled = true;
                }

                // Giả lập gửi API đăng ký thành công
                setTimeout(() => {
                    if (formFeedback) {
                        formFeedback.style.color = 'var(--gold-primary)';
                        formFeedback.innerHTML = `<span class="text-gold font-montserrat small">Cảm ơn Quý khách! Đã đăng ký thành công đặc quyền hội viên AURA.</span>`;
                    }
                    if (vipEmailInput) vipEmailInput.value = '';
                    
                    if (submitBtn) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }

                    setTimeout(() => {
                        if (formFeedback) formFeedback.innerHTML = '';
                    }, 4000);
                }, 1200);
            }
        });
    }

    /* ==========================================================================
       4. ĐÁNH DẤU ACTIVE CHO THANH ĐIỀU HƯỚNG (NAVBAR)
       ========================================================================== */
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (currentPath.endsWith(href) || (currentPath === '/' && href === 'index.html'))) {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    /* ==========================================================================
       5. HIỆU ỨNG SCROLL FADE-UP CHO FOOTER
       ========================================================================== */
    const footerColumns = document.querySelectorAll('.footer-main .col-lg-5, .footer-main .col-lg-3, .footer-main .col-lg-4');
    
    if (footerColumns.length > 0) {
        footerColumns.forEach((col, index) => {
            col.classList.add('fade-up-element');
            col.style.transitionDelay = `${index * 0.15}s`;
        });

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const footerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        footerColumns.forEach(col => {
            footerObserver.observe(col);
        });
    }
});