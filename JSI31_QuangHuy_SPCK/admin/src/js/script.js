document.addEventListener("DOMContentLoaded", function() {
    
    const loginForm = document.getElementById("adminLoginForm");
    const errorMessage = document.getElementById("errorMessage");

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (username === "admin" && password === "Admin@123") {
                sessionStorage.setItem("isAdminLoggedIn", "true");
                window.location.href = "product.html";
            } else {
                errorMessage.classList.remove("d-none");
            }
        });
    }

});