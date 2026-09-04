document.addEventListener("DOMContentLoaded", () => {
    // Xử lý gửi form
    const forms = document.querySelectorAll(".aura-form");
    forms.forEach(form => {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const serviceName = form.getAttribute("data-service");
            const inputs = form.querySelectorAll("input");
            const username = inputs[0].value.trim();
            const phone = inputs[1].value.trim();
            if (!username || !phone) return alert("Vui lòng điền đầy đủ thông tin!");
            alert(`Đăng ký thành công đặc quyền [${serviceName}]!\nQuý khách: ${username}\nSố điện thoại: ${phone}\nChuyên viên AURA Private sẽ liên hệ.`);
            form.reset();
        });
    });

    // Hiệu ứng Fade-in khi cuộn
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll(".aura-reveal").forEach(el => observer.observe(el));

    // Xử lý khi click vào các liên kết nội bộ để trượt mượt mà và hiển thị trọn vẹn phần đó
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId === "#") return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
});

// Xử lý khi tải trang có sẵn Hash trên URL
window.addEventListener("load", () => {
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 150);
        }
    }
});