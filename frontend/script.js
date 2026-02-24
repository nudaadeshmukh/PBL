//PAGE NAVIGATION
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    // Show selected page
    document.getElementById(pageId).classList.remove("hidden");
}
// Default page
showPage("landing-page");

//LOCAL STORAGE HELPERS

function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
}

function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem("currentUser");
}

//SIGNUP LOGIC
function handleSignup(e) {
    e.preventDefault();

    let name = document.getElementById("signup-name").value.trim();
    let email = document.getElementById("signup-email").value.trim();
    let empId = document.getElementById("signup-employeeId").value.trim();
    let role = document.getElementById("signup-role").value;
    let password = document.getElementById("signup-password").value;
    let confirm = document.getElementById("signup-confirm-password").value;

    // Password check
    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    let users = getUsers();

    // Check if email exists
    let exists = users.find(u => u.email === email);

    if (exists) {
        alert("Email already registered!");
        return;
    }

    // Encrypt password
    let encrypted = CryptoJS.SHA256(password).toString();

    let newUser = {
        name,
        email,
        empId,
        role,
        password: encrypted,
        lastLogin: null
    };

    users.push(newUser);
    saveUsers(users);

    alert("Registration Successful!");

    showPage("login-page");
}


//LOGIN LOGIC
function handleLogin(e) {
    e.preventDefault();

    let email = document.getElementById("login-email").value.trim();
    let password = document.getElementById("login-password").value;
    let role = document.getElementById("login-role").value;

    let errorBox = document.getElementById("login-error");

    let users = getUsers();

    let encrypted = CryptoJS.SHA256(password).toString();

    let user = users.find(u =>
        u.email === email &&
        u.password === encrypted &&
        u.role === role
    );

    if (!user) {
        errorBox.textContent = "Invalid email, password, or role!";
        errorBox.classList.remove("hidden");
        return;
    }

    errorBox.classList.add("hidden");

    // Update last login
    user.lastLogin = new Date().toLocaleString();
    saveUsers(users);

    setCurrentUser(user);

    loadDashboard();

    showPage("dashboard-container");
}

//DASHBOARD LOAD
function loadDashboard() {
    let user = getCurrentUser();

    if (!user) return;

    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-role").textContent = user.role;
    document.getElementById("user-last-login").textContent =
        user.lastLogin || "First Login";

    document.getElementById("user-avatar").textContent =
        user.name.charAt(0).toUpperCase();

    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-role").textContent = user.role;

    document.getElementById("profile-avatar").textContent =
        user.name.charAt(0).toUpperCase();

    document.getElementById("profile-info").innerHTML = `
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Employee ID:</b> ${user.empId}</p>
        <p><b>Role:</b> ${user.role}</p>
    `;
}


//LOGOUT

function handleLogout() {
    clearCurrentUser();
    showPage("landing-page");
}

//DASHBOARD NAVIGATION

function showDashboardPage(pageId) {

    document.querySelectorAll(".dashboard-page").forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById(pageId).classList.remove("hidden");

    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });

    document
        .querySelector(`[data-page="${pageId}"]`)
        .classList.add("active");
}


//CHANGE PASSWORD
function handleChangePassword(e) {
    e.preventDefault();

    let current = document.getElementById("current-password").value;
    let newPass = document.getElementById("new-password").value;
    let confirm = document.getElementById("confirm-new-password").value;

    if (newPass !== confirm) {
        alert("New passwords do not match!");
        return;
    }

    let users = getUsers();
    let user = getCurrentUser();

    let encryptedCurrent = CryptoJS.SHA256(current).toString();

    if (user.password !== encryptedCurrent) {
        alert("Current password is incorrect!");
        return;
    }

    let encryptedNew = CryptoJS.SHA256(newPass).toString();

    // Update password
    users = users.map(u => {
        if (u.email === user.email) {
            u.password = encryptedNew;
            user.password = encryptedNew;
        }
        return u;
    });

    saveUsers(users);
    setCurrentUser(user);

    alert("Password Updated Successfully!");

    e.target.reset();
}


//AUTO LOGIN (ON REFRESH)
window.onload = function () {

    let user = getCurrentUser();

    if (user) {
        loadDashboard();
        showPage("dashboard-container");
    }
};