//PAGE NAVIGATION
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll(".page");
    if (!pages || pages.length === 0) return; // multi-page HTML (login/signup/dashboard)

    pages.forEach(page => page.classList.add("hidden"));

    // Show selected page
    const target = document.getElementById(pageId);
    if (target) target.classList.remove("hidden");
}
// Default page
if (document.getElementById("landing-page")) {
    showPage("landing-page");
}

// =========================
// Backend API integration
// =========================
// Use `var` to avoid temporal-dead-zone issues across page scripts.
var API_BASE_URL = "http://localhost:8081";

function getAuthToken() {
    const user = getCurrentUser();
    return user?.token || null;
}

async function apiRequest(path, { method = "GET", body = null, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = getAuthToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

    if (!res.ok) {
        const msg = (data && typeof data === "object" && data.message)
            ? data.message
            : (typeof data === "string" ? data : `HTTP ${res.status}`);
        throw new Error(msg);
    }

    return data;
}

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) {
        alert(message);
        return;
    }
    toastMessage.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2500);
}

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

    const roleUpper = (role || "").toUpperCase();
    apiRequest("/api/auth/register", {
        method: "POST",
        body: {
            username: name,
            email,
            password,
            role: roleUpper
        }
    }).then((resp) => {
        const now = new Date().toLocaleString();
        setCurrentUser({
            name: resp.username || name,
            email: resp.email || email,
            empId,
            role: resp.role || roleUpper,
            token: resp.token,
            lastLogin: now
        });
        showToast(resp.message || "Registration successful");
        // Multi-page app: redirect after signup.
        window.location.href = "dashboard.html";
    }).catch((err) => {
        alert(`Registration failed: ${err.message}`);
    });
}


//LOGIN LOGIC
function handleLogin(e) {
    e.preventDefault();

    let email = document.getElementById("login-email").value.trim();
    let password = document.getElementById("login-password").value;
    let role = document.getElementById("login-role").value;

    let errorBox = document.getElementById("login-error");

    apiRequest("/api/auth/login", {
        method: "POST",
        body: {
            usernameOrEmail: email,
            password
        }
    }).then((resp) => {
        const selectedRoleUpper = (role || "").toUpperCase();
        if (selectedRoleUpper && resp.role && resp.role.toUpperCase() !== selectedRoleUpper) {
            throw new Error(`Role mismatch. You selected ${selectedRoleUpper} but your account role is ${resp.role}`);
        }

        errorBox.classList.add("hidden");
        setCurrentUser({
            name: resp.username,
            email: resp.email,
            empId: getCurrentUser()?.empId || "",
            role: resp.role,
            token: resp.token,
            lastLogin: new Date().toLocaleString()
        });

        showToast(resp.message || "Login successful");
        // Always land on dashboard; dashboard adapts per role.
        window.location.href = "dashboard.html";
    }).catch((err) => {
        errorBox.textContent = err.message || "Login failed";
        errorBox.classList.remove("hidden");
    });
}

//DASHBOARD LOAD
function loadDashboard() {
    let user = getCurrentUser();

    if (!user) return;

    const roleUpper = String(user.role || "").toUpperCase();
    const roleDisplay = roleUpper === "ADMIN" ? "Admin" : roleUpper === "AUDITOR" ? "Auditor" : (user.role || "");

    // Guard: these elements don't exist on every page.
    const userName = document.getElementById("user-name");
    const userRole = document.getElementById("user-role");
    const userLastLogin = document.getElementById("user-last-login");
    const userAvatar = document.getElementById("user-avatar");
    const profileName = document.getElementById("profile-name");
    const profileRole = document.getElementById("profile-role");
    const profileAvatar = document.getElementById("profile-avatar");
    const profileInfo = document.getElementById("profile-info");

    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = roleDisplay;
    if (userLastLogin) userLastLogin.textContent = user.lastLogin || "First Login";
    if (userAvatar) userAvatar.textContent = (user.name || "?").charAt(0).toUpperCase();
    if (profileName) profileName.textContent = user.name;
    if (profileRole) profileRole.textContent = user.role;
    if (profileAvatar) profileAvatar.textContent = (user.name || "?").charAt(0).toUpperCase();
    if (profileInfo) {
        profileInfo.innerHTML = `
            <p><b>Email:</b> ${user.email}</p>
            <p><b>Employee ID:</b> ${user.empId}</p>
            <p><b>Role:</b> ${user.role}</p>
        `;
    }
    // Sidebar menu: hide irrelevant panels.
    const adminMenu = document.getElementById("menu-admin");
    const auditMenu = document.getElementById("menu-audit");
    if (adminMenu) adminMenu.style.display = roleUpper === "ADMIN" ? "" : "none";
    if (auditMenu) auditMenu.style.display = roleUpper === "AUDITOR" ? "" : "none";

    // Dashboard stats are loaded on dashboard page load; don't force refresh on every page.
}


//LOGOUT

function handleLogout() {
    clearCurrentUser();
    // Clear any legacy session keys (older multi-page versions used sessionStorage).
    try { sessionStorage.removeItem("blast_current_user"); } catch (e) {}
    try { sessionStorage.removeItem("currentUser"); } catch (e) {}
    try { localStorage.removeItem("blast_current_user"); } catch (e) {}
    try { localStorage.removeItem("currentUser"); } catch (e) {}

    // Prevent back-navigation into protected pages: replace current history entry.
    try { history.replaceState(null, "", "index.html"); } catch (e) {}
    window.location.replace("index.html");
}

//DASHBOARD NAVIGATION

function showDashboardPage(pageId) {

    document.querySelectorAll(".dashboard-page").forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById(pageId).classList.remove("hidden");

    if (pageId === "profile") {
        loadProfile();   // 🔥 ADD THIS
    }

    if (pageId === "audit") {
        applyAuditFilters();
    }

    if (pageId === "blockchain") {
        renderBlockchain();
    }
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


// AUTO LOAD + ROUTE GUARD
function isPublicPage() {
    const p = (window.location.pathname || "").toLowerCase();
    const href = (window.location.href || "").toLowerCase();
    return (
        href.includes("index.html") || href.includes("login.html") || href.includes("signup.html") ||
        p.endsWith("/index.html") || p.endsWith("/login.html") || p.endsWith("/signup.html") ||
        p === "/" || p === ""
    );
}

function currentPageName() {
    const p = (window.location.pathname || "").toLowerCase();
    const last = p.split("/").pop() || "";
    return last || "index.html";
}

window.onload = function () {
    const user = getCurrentUser();

    // If logged out, block access to protected pages (also handles browser Back after logout).
    if (!user && !isPublicPage()) {
        window.location.replace("index.html");
        return;
    }

    if (!user) return;

    // Hydrate shared UI on every protected page.
    loadDashboard();

    const page = currentPageName();
    if (page.includes("dashboard.html")) {
        refreshDashboard();
    }
};
/***********************
 DASHBOARD DATA
************************/

let blockchain = [
    {
        blockNumber: 1,
        timestamp: Date.now(),
        transactions: [],
        currentHash: "0000000000000000"
    }
];

let lastVerified = null;

function getTotalTransactions() {
    return blockchain.reduce((total, block) => {
        return total + block.transactions.length;
    }, 0);
}

function getBlockchainStatus() {
    return "Valid"; // you can expand later
}


/***********************
 LOAD DASHBOARD
************************/

async function loadDashboardStats() {

    const statsGrid = document.getElementById("stats-grid");
    if (!statsGrid) return;

    const user = getCurrentUser();
    const roleUpper = String(user?.role || "").toUpperCase();
    let blocks = [];
    try {
        blocks = await apiRequest("/api/blockchain/blocks?limit=50", { auth: true });
        if (!Array.isArray(blocks)) blocks = [];
    } catch (e) {
        blocks = [];
    }
    const totalBlocks = blocks.length;
    const totalTx = blocks.reduce((sum, b) => sum + (Array.isArray(b.transactions) ? b.transactions.length : 0), 0);

    // Auditor gets a tampering status snapshot.
    let auditStatus = null;
    let lastVerifiedAt = null;
    try { lastVerifiedAt = localStorage.getItem("lastVerifiedAt"); } catch (e) {}

    if (roleUpper === "AUDITOR") {
        try {
            const verification = await apiRequest("/api/blockchain/verify?blockLimit=20", { auth: true });
            auditStatus = verification?.tamperingDetected ? "Tampering Detected" : "No Tampering";
            lastVerifiedAt = new Date().toLocaleString();
            try { localStorage.setItem("lastVerifiedAt", lastVerifiedAt); } catch (e) {}
        } catch (e) {
            auditStatus = "Verify failed";
        }
    }

    const stats = [
        {
            title: "Blockchain Transactions",
            value: totalTx,
            color: "from-blue-500 to-cyan-500"
        },
        {
            title: roleUpper === "AUDITOR" ? "Audit Status" : "Backend Status",
            value: roleUpper === "AUDITOR" ? (auditStatus || "—") : "Connected",
            color: (roleUpper === "AUDITOR" && auditStatus === "Tampering Detected")
                ? "from-red-500 to-orange-500"
                : "from-green-500 to-emerald-500"
        },
        {
            title: "Last Verified",
            value: lastVerifiedAt || "Not verified yet",
            color: "from-yellow-500 to-orange-500"
        }
    ];

    statsGrid.innerHTML = "";

    stats.forEach(stat => {

        statsGrid.innerHTML += `
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-white/70 text-sm">${stat.title}</h4>
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color}"></div>
                </div>
                <div class="text-2xl font-bold text-white">${stat.value}</div>
            </div>
        `;
    });

    const lastBackup = document.getElementById("last-backup");
    if (lastBackup) lastBackup.textContent = new Date().toLocaleDateString();
}


/***********************
 LOAD RECENT BLOCKS
************************/

async function loadRecentBlocks() {

    const container = document.getElementById("recent-blocks");
    if (!container) return;

    container.innerHTML = "";

    let txs = [];
    try {
        txs = await apiRequest("/api/transactions", { auth: true });
        if (!Array.isArray(txs)) txs = [];
    } catch (e) {
        txs = [];
    }

    const recent = txs.slice(-5).reverse();
    if (recent.length === 0) {
        container.innerHTML = `<div class="text-center text-white/50 py-6">No transactions yet.</div>`;
        return;
    }

    recent.forEach(tx => {
        const when = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "";
        container.innerHTML += `
            <div class="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                    <div class="text-white font-medium">
                        ${tx.transactionId ? tx.transactionId.substring(0, 12) + "..." : "Transaction"}
                    </div>
                    <div class="text-sm text-white/70">
                        ${tx.sender || ""} → ${tx.receiver || ""} • ${Number(tx.amount || 0).toFixed(4)} ETH
                    </div>
                </div>
                <div class="text-right text-sm text-white/70">
                    ${when}
                </div>
            </div>
        `;
    });
}


/***********************
 UPDATE DASHBOARD
************************/

function refreshDashboard() {
    // Async functions; no need to await for UI to paint.
    loadDashboardStats();
    loadRecentBlocks();
}

document.addEventListener("DOMContentLoaded", function () {

    let form = document.getElementById("transaction-form");

    if (form) {

        form.addEventListener("submit", async function (e) {

            e.preventDefault();

            let sender = document.getElementById("sender").value.trim();
            let receiver = document.getElementById("receiver").value.trim();
            let amount = parseFloat(document.getElementById("amount").value);
            let description = document.getElementById("description").value.trim();

            const user = getCurrentUser();
            if (!user?.token) {
                alert("Please login first.");
                window.location.replace("login.html");
                return;
            }

            if (!sender || !receiver || !amount) {
                alert("Sender, receiver and amount are required!");
                return;
            }

            if (amount <= 0) {
                alert("Amount must be greater than 0");
                return;
            }

            let timestamp = Date.now();

            // Create transaction
            let transaction = {
                id: CryptoJS.SHA256(sender + receiver + amount + timestamp).toString(),
                sender,
                receiver,
                amount,
                description,
                timestamp
            };

            // Persist transaction to backend DB (ADMIN only).
            try {
                await apiRequest("/api/transactions", {
                    method: "POST",
                    auth: true,
                    body: {
                        transactionId: transaction.id,
                        sender: transaction.sender,
                        receiver: transaction.receiver,
                        amount: transaction.amount
                    }
                });
            } catch (err) {
                alert(`Failed to add transaction to DB: ${err.message}`);
                return;
            }

            // Get previous block
            let previousBlock = blockchain[blockchain.length - 1];

            // Create new block
            let newBlock = {
                blockNumber: blockchain.length + 1,
                timestamp: timestamp,
                transactions: [transaction],
                previousHash: previousBlock.currentHash,
                nonce: 0,
                currentHash: ""
            };

            // Generate block hash
            newBlock.currentHash = CryptoJS.SHA256(
                newBlock.blockNumber +
                newBlock.timestamp +
                JSON.stringify(newBlock.transactions) +
                newBlock.previousHash +
                newBlock.nonce
            ).toString();

            // Add to blockchain
            blockchain.push(newBlock);

            let resultDiv = document.getElementById("transaction-result");

            resultDiv.classList.remove("empty");

            resultDiv.innerHTML = `
                <div>
                    <h3 style="color:#22c55e;">✓ Transaction Successful</h3>
                    <p style="color:#22c55e; font-size:14px;">Saved to DB and added to blockchain</p>
                    <hr style="margin:15px 0; opacity:0.2;">

                    <div>
                        <small>Transaction Hash</small>
                        <div style="word-break: break-all; font-family: monospace; color:#86efac;">
                            ${transaction.id}
                        </div>
                    </div>

                    <br>

                    <div>
                        <small>Timestamp</small>
                        <div>${new Date(timestamp).toLocaleString()}</div>
                    </div>

                    <br>

                    <div>
                        <b>From:</b> ${sender}<br>
                        <b>To:</b> ${receiver}<br>
                        <b>Amount:</b> ${amount.toFixed(4)} ETH
                    </div>

                    <br>

                    <div style="color:#22c55e;">
                        ✓ Status: Block Created and Added to Chain
                    </div>
                </div>
            `;

            renderBlockchain();
            applyAuditFilters();

            this.reset();

        });

    }

});

async function loadLedger() {
    const container = document.getElementById("ledger-blocks");
    if (!container) return;
    container.innerHTML = `<div class="text-white/70">Loading blockchain blocks...</div>`;

    let blocks = [];
    try {
        blocks = await apiRequest("/api/blockchain/blocks?limit=100", { auth: true });
        if (!Array.isArray(blocks)) blocks = [];
    } catch (err) {
        container.innerHTML = `<div class="text-red-300">Failed to load blockchain blocks: ${err.message}</div>`;
        return;
    }

    if (blocks.length === 0) {
        container.innerHTML = `<div class="text-white/60">No blocks available on blockchain.</div>`;
        return;
    }

    container.innerHTML = "";
    blocks.forEach((block) => {
        const ts = block.timestampMs ? new Date(block.timestampMs).toLocaleString() : "N/A";
        const txs = Array.isArray(block.transactions) ? block.transactions : [];

        let txHtml = `<div class="text-white/60 text-sm">No transactions in this block.</div>`;
        if (txs.length > 0) {
            txHtml = txs.map((tx) => `
                <div class="p-3 rounded-lg bg-white/5 border border-white/10 mb-2">
                    <div class="text-sm text-white"><b>Sender:</b> ${tx.senderAddress || "-"}</div>
                    <div class="text-sm text-white"><b>Receiver:</b> ${tx.receiverAddress || "-"}</div>
                    <div class="text-sm text-emerald-300"><b>Amount:</b> ${tx.amountEth || "0"} ETH</div>
                    <div class="text-xs text-white/60 break-all"><b>Tx Hash:</b> ${tx.txHash || "-"}</div>
                </div>
            `).join("");
        }

        container.innerHTML += `
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                <div class="flex justify-between items-start gap-4 mb-3">
                    <div>
                        <div class="text-white text-lg font-semibold">Block #${block.blockNumber}</div>
                        <div class="text-white/70 text-sm">${txs.length} transaction(s)</div>
                    </div>
                    <div class="text-white/70 text-sm text-right">${ts}</div>
                </div>
                <div class="text-xs text-white/60 break-all mb-1"><b>Block Hash:</b> ${block.blockHash || "-"}</div>
                <div class="text-xs text-white/60 break-all mb-3"><b>Parent Hash:</b> ${block.previousBlockHash || "-"}</div>
                ${txHtml}
            </div>
        `;
    });
}

// Backward compatibility: existing calls render the ledger.
function renderBlockchain() {
    loadLedger();
}


// Accordion toggle
function toggleTransaction(element) {
    const details = element.querySelector(".transaction-details");
    details.style.display =
        details.style.display === "block" ? "none" : "block";
}

function getAllTransactions() {
    return blockchain.flatMap(block =>
        block.transactions.map(tx => ({
            ...tx,
            blockNumber: block.blockNumber,
            blockHash: block.currentHash,
            hashStatus: "Valid"
        }))
    );
}

function applyAuditFilters() {

    let dateFrom = document.getElementById("filter-dateFrom").value;
    let dateTo = document.getElementById("filter-dateTo").value;
    let account = document.getElementById("filter-account").value.trim();
    let minAmount = document.getElementById("filter-minAmount").value;
    let maxAmount = document.getElementById("filter-maxAmount").value;

    let transactions = getAllTransactions();

    let filtered = transactions.filter(tx => {

        if (dateFrom && new Date(tx.timestamp) < new Date(dateFrom)) return false;
        if (dateTo && new Date(tx.timestamp) > new Date(dateTo)) return false;

        if (account &&
            !tx.sender.includes(account) &&
            !tx.receiver.includes(account)) return false;

        if (minAmount && tx.amount < parseFloat(minAmount)) return false;
        if (maxAmount && tx.amount > parseFloat(maxAmount)) return false;

        return true;
    });

    renderAuditTable(filtered);
}

function renderAuditTable(data) {
    // Support both structures:
    // 1) <table id="audit-table"><tbody>...</tbody></table>
    // 2) <tbody id="audit-table"></tbody>
    const table = document.getElementById("audit-table");
    let tbody = document.querySelector("#audit-table tbody");
    if (!tbody && table && table.tagName.toLowerCase() === "tbody") {
        tbody = table;
    }
    if (!tbody) return;

    const recordCount = document.getElementById("record-count");
    const noRecords = document.getElementById("no-records");
    const summaryCard = document.getElementById("summary-card");

    tbody.innerHTML = "";
    if (recordCount) recordCount.textContent = data.length;

    if (data.length === 0) {
        if (noRecords) noRecords.classList.remove("hidden");
        if (summaryCard) summaryCard.classList.add("hidden");
        return;
    }

    if (noRecords) noRecords.classList.add("hidden");

    data.forEach(tx => {
        tbody.innerHTML += `
            <tr class="border-b border-white/10">
                <td class="py-2 pr-3 whitespace-nowrap">${tx.id.substring(0,12)}...</td>
                <td class="py-2 pr-3">${tx.sender}</td>
                <td class="py-2 pr-3">${tx.receiver}</td>
                <td class="py-2 pr-3 text-green-300 whitespace-nowrap">$${tx.amount.toFixed(2)}</td>
                <td class="py-2 pr-3 whitespace-nowrap">${tx.blockNumber}</td>
                <td class="py-2 pr-3 text-green-300 whitespace-nowrap">Valid</td>
                <td class="py-2 whitespace-nowrap">${new Date(tx.timestamp).toLocaleDateString()}</td>
            </tr>
        `;
    });

    if (summaryCard) {
        summaryCard.classList.remove("hidden");
        const totalVolume = data.reduce((sum, tx) => sum + tx.amount, 0);
        const sumTotal = document.getElementById("sum-total");
        const sumVolume = document.getElementById("sum-volume");
        const sumAverage = document.getElementById("sum-average");
        const sumBlocks = document.getElementById("sum-blocks");
        if (sumTotal) sumTotal.textContent = data.length;
        if (sumVolume) sumVolume.textContent = "$" + totalVolume.toFixed(2);
        if (sumAverage) sumAverage.textContent = "$" + (totalVolume / data.length).toFixed(2);
        if (sumBlocks) sumBlocks.textContent = new Set(data.map(tx => tx.blockNumber)).size;
    }
}

function generateAuditReport() {

    const user = getCurrentUser();
    if (!user?.token) {
        alert("Please login first.");
        showPage("login-page");
        return;
    }

    Promise.all([
        apiRequest("/api/transactions", { auth: true }),
        apiRequest("/api/blockchain/verify?blockLimit=50", { auth: true }),
        apiRequest("/api/blockchain/blocks?limit=50", { auth: true })
    ]).then(([dbTxs, verification, blockchainBlocks]) => {
        if (!Array.isArray(dbTxs) || dbTxs.length === 0) {
            alert("No transactions available");
            return;
        }

        const findingsByTxId = new Map(
            (verification?.transactionFindings || []).map(f => [f.transactionId, f])
        );
        if (typeof XLSX === "undefined") {
            alert("Excel export library failed to load. Please refresh and try again.");
            return;
        }

        // Apply the same on-screen report filters to export content.
        const dateFrom = document.getElementById("filter-dateFrom")?.value || "";
        const dateTo = document.getElementById("filter-dateTo")?.value || "";
        const account = (document.getElementById("filter-account")?.value || "").trim();
        const minAmount = document.getElementById("filter-minAmount")?.value || "";
        const maxAmount = document.getElementById("filter-maxAmount")?.value || "";

        const filteredDbTxs = dbTxs.filter(tx => {
            const txDate = tx.timestamp ? new Date(tx.timestamp) : null;
            if (dateFrom && txDate && txDate < new Date(dateFrom)) return false;
            if (dateTo && txDate && txDate > new Date(dateTo)) return false;
            if (account && !(String(tx.sender || "").includes(account) || String(tx.receiver || "").includes(account))) return false;
            if (minAmount && Number(tx.amount || 0) < parseFloat(minAmount)) return false;
            if (maxAmount && Number(tx.amount || 0) > parseFloat(maxAmount)) return false;
            return true;
        });

        const txRows = filteredDbTxs.map(tx => {
            const f = findingsByTxId.get(tx.transactionId) || null;
            const tampered = f ? !!f.tampered : false;
            const tamperedFields = f?.tamperedFields?.join("|") || "";
            const issues = f?.issues?.join("|") || "";
            return {
                "Transaction ID": tx.transactionId ?? "",
                "DB ID": tx.id ?? "",
                "Sender": tx.sender ?? "",
                "Receiver": tx.receiver ?? "",
                "Amount": tx.amount ?? "",
                "Timestamp": tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "",
                "OnChain": tx.onChain ?? false,
                "Blockchain Tx Hash": tx.blockchainTxHash ?? "",
                "Tampered": tampered,
                // Highlight tampering in Excel with an explicit alert marker.
                "Tampering Alert": tampered ? "!!! TAMPERING DETECTED !!!" : "",
                "Tampered Fields": tampered ? `>> ${tamperedFields} <<` : "",
                "Issues": issues
            };
        });

        const tamperedCount = txRows.filter(r => r["Tampered"] === true).length;

        const blockchainRows = [];
        (Array.isArray(blockchainBlocks) ? blockchainBlocks : []).forEach(b => {
            const blockTs = b.timestampMs ? new Date(b.timestampMs).toLocaleString() : "";
            const txs = Array.isArray(b.transactions) ? b.transactions : [];
            if (txs.length === 0) {
                blockchainRows.push({
                    "Block Number": b.blockNumber ?? "",
                    "Block Hash": b.blockHash ?? "",
                    "Parent Hash": b.previousBlockHash ?? "",
                    "Block Timestamp": blockTs,
                    "Tx Hash": "",
                    "From": "",
                    "To": "",
                    "Amount (ETH)": "",
                    "Amount (WEI)": ""
                });
                return;
            }
            txs.forEach(t => {
                blockchainRows.push({
                    "Block Number": b.blockNumber ?? "",
                    "Block Hash": b.blockHash ?? "",
                    "Parent Hash": b.previousBlockHash ?? "",
                    "Block Timestamp": blockTs,
                    "Tx Hash": t.txHash ?? "",
                    "From": t.senderAddress ?? "",
                    "To": t.receiverAddress ?? "",
                    "Amount (ETH)": t.amountEth ?? "",
                    "Amount (WEI)": t.amountWei ?? ""
                });
            });
        });

        const summaryRows = [
            { Metric: "Generated At", Value: new Date().toLocaleString() },
            { Metric: "Verification Tampering Detected", Value: verification?.tamperingDetected ? "Yes" : "No" },
            { Metric: "Chain Linkage Valid", Value: verification?.chainLinkageValid ? "Yes" : "No" },
            { Metric: "DB Transactions (rows)", Value: txRows.length },
            { Metric: "Tampered DB Transactions", Value: tamperedCount },
            { Metric: "Filters Applied", Value: dateFrom || dateTo || account || minAmount || maxAmount ? "Yes" : "No" },
            { Metric: "Filter Date Range", Value: (dateFrom || dateTo) ? `${dateFrom || "Any"} -> ${dateTo || "Any"}` : "Any" },
            { Metric: "Filter Account", Value: account || "Any" },
            { Metric: "Filter Amount Range", Value: (minAmount || maxAmount) ? `${minAmount || "Any"} -> ${maxAmount || "Any"}` : "Any" },
            { Metric: "Blockchain Transactions (rows)", Value: blockchainRows.length },
            { Metric: "Blockchain Blocks (fetched)", Value: Array.isArray(blockchainBlocks) ? blockchainBlocks.length : 0 }
        ];

        const wb = XLSX.utils.book_new();
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        const wsTx = XLSX.utils.json_to_sheet(txRows);
        // Excel visual highlight for tampered rows/cells (light red fill).
        if (txRows.length > 0) {
            const headers = Object.keys(txRows[0]);
            const tamperedColIdx = headers.indexOf("Tampered");
            const alertColIdx = headers.indexOf("Tampering Alert");
            if (tamperedColIdx >= 0 && alertColIdx >= 0) {
                for (let i = 0; i < txRows.length; i++) {
                    if (txRows[i]["Tampered"] !== true) continue;
                    const excelRow = i + 2; // row 1 is header
                    const alertCell = XLSX.utils.encode_cell({ r: excelRow - 1, c: alertColIdx });
                    const tamperedCell = XLSX.utils.encode_cell({ r: excelRow - 1, c: tamperedColIdx });

                    if (wsTx[alertCell]) {
                        wsTx[alertCell].s = {
                            fill: { patternType: "solid", fgColor: { rgb: "FFF4CCCC" } }, // light red
                            font: { bold: true, color: { rgb: "FF9C0006" } }
                        };
                    }
                    if (wsTx[tamperedCell]) {
                        wsTx[tamperedCell].s = {
                            fill: { patternType: "solid", fgColor: { rgb: "FFFCE4D6" } }, // very light red/orange
                            font: { bold: true, color: { rgb: "FF9C0006" } }
                        };
                    }
                }
            }
        }
        XLSX.utils.book_append_sheet(wb, wsTx, "Transaction Findings");
        const wsChain = XLSX.utils.json_to_sheet(blockchainRows.length ? blockchainRows : [{}]);
        XLSX.utils.book_append_sheet(wb, wsChain, "Blockchain Transactions");
        XLSX.writeFile(wb, "audit-report.xlsx");

        if (verification?.tamperingDetected) {
            showToast("Warning: Tampering detected. Included in Excel report.");
        } else {
            showToast("Excel audit report downloaded");
        }
    }).catch((err) => {
        alert(`Failed to generate audit report: ${err.message}`);
    });
}

// Auto filter when inputs change
document.querySelectorAll("#filter-dateFrom, #filter-dateTo, #filter-account, #filter-minAmount, #filter-maxAmount")
    .forEach(input => {
        input.addEventListener("input", applyAuditFilters);
    });


function verifyBlockchain() {

    for (let i = 1; i < blockchain.length; i++) {

        let currentBlock = blockchain[i];
        let previousBlock = blockchain[i - 1];

        // Recalculate hash
        let recalculatedHash = CryptoJS.SHA256(
            currentBlock.blockNumber +
            currentBlock.timestamp +
            JSON.stringify(currentBlock.transactions) +
            currentBlock.previousHash +
            currentBlock.nonce
        ).toString();

        // Check current hash integrity
        if (currentBlock.currentHash !== recalculatedHash) {
            return { isValid: false, tamperedBlock: currentBlock.blockNumber };
        }

        // Check chain linkage
        if (currentBlock.previousHash !== previousBlock.currentHash) {
            return { isValid: false, tamperedBlock: currentBlock.blockNumber };
        }
    }

    return { isValid: true };
}


function handleVerifyBlockchain() {

    let loadingCard = document.getElementById("verify-loading");
    let resultDiv = document.getElementById("verify-result");

    resultDiv.innerHTML = "";
    loadingCard.classList.remove("hidden");

    const user = getCurrentUser();
    if (!user?.token) {
        loadingCard.classList.add("hidden");
        alert("Please login first.");
        showPage("login-page");
        return;
    }

    apiRequest("/api/blockchain/verify?blockLimit=50", { auth: true })
        .then((verification) => {
            loadingCard.classList.add("hidden");

            const chainOk = !!verification?.chainLinkageValid;
            const tamperingDetected = !!verification?.tamperingDetected;
            const warnings = (verification?.warnings || []).slice(0, 5);

            if (!tamperingDetected && chainOk) {
                resultDiv.innerHTML = `
                    <div class="valid-card">
                        <div class="result-icon">✔</div>
                        <h2>No Tampering Detected</h2>
                        <p>Blockchain linkage and DB transaction integrity look valid.</p>
                        <p style="margin-top:10px;">
                            Last verified: ${new Date().toLocaleString()}
                        </p>
                    </div>
                `;
                showToast("Verification complete: no tampering detected");
                return;
            }

            const tampered = (verification?.transactionFindings || [])
                .filter(f => f.tampered)
                .slice(0, 8)
                .map(f => {
                    const fields = (f.tamperedFields || []).join(", ");
                    const issues = (f.issues || []).join(", ");
                    return `<li><b>${f.transactionId}</b>${fields ? ` — fields: ${fields}` : ""}${issues ? ` — issues: ${issues}` : ""}</li>`;
                })
                .join("");

            resultDiv.innerHTML = `
                <div class="invalid-card">
                    <div class="result-icon">✖</div>
                    <h2>Warning: Tampering Detected</h2>
                    <p>${chainOk ? "Blockchain linkage OK" : "Blockchain linkage mismatch"} and/or DB data changed.</p>
                    ${warnings.length ? `<p style="margin-top:10px;"><b>Warnings:</b> ${warnings.join(" | ")}</p>` : ""}
                    ${tampered ? `<div style="margin-top:12px; text-align:left;"><b>Examples:</b><ul style="margin-top:6px;">${tampered}</ul></div>` : ""}
                </div>
            `;
            showToast("Warning generated: tampering detected");
        })
        .catch((err) => {
            loadingCard.classList.add("hidden");
            resultDiv.innerHTML = `
                <div class="invalid-card">
                    <div class="result-icon">✖</div>
                    <h2>Verification Failed</h2>
                    <p>${err.message || "Unable to verify right now."}</p>
                </div>
            `;
        });
}

function loadProfile() {

    let user = getCurrentUser();
    if (!user) return;

    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-role").textContent = user.role;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-empid").textContent = user.empId;
    document.getElementById("profile-lastlogin").textContent =
        user.lastLogin || "First Login";

    document.getElementById("profile-avatar").textContent =
        user.name.charAt(0).toUpperCase();

    renderPermissions(user.role);

    // 🔥 attach password listener here
    let form = document.getElementById("change-password-form");

    form.onsubmit = function(e){

        e.preventDefault();

        let current = document.getElementById("current-password").value;
        let newPass = document.getElementById("new-password").value;
        let confirm = document.getElementById("confirm-password").value;

        if (newPass !== confirm) {
            alert("New passwords do not match!");
            return;
        }

        if (newPass.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        let users = getUsers();
        let encryptedCurrent = CryptoJS.SHA256(current).toString();

        if (user.password !== encryptedCurrent) {
            alert("Current password incorrect!");
            return;
        }

        let encryptedNew = CryptoJS.SHA256(newPass).toString();

        users = users.map(u => {
            if (u.email === user.email) {
                u.password = encryptedNew;
                user.password = encryptedNew;
            }
            return u;
        });

        saveUsers(users);
        setCurrentUser(user);

        alert("Password updated successfully!");

        form.reset();
    };
}

function renderPermissions(role) {

    let list = document.getElementById("role-permissions");
    list.innerHTML = "";

    const permissions = {
        Admin: [
            "Full access to all features",
            "Create and verify transactions",
            "Generate audit reports",
            "Verify blockchain integrity"
        ],
        Auditor: [
            "View blockchain ledger",
            "Generate audit reports",
            "Verify blockchain integrity",
            "Read-only transaction access"
        ],
        User: [
            "Create transactions",
            "View blockchain ledger",
            "Limited audit access"
        ]
    };

    permissions[role].forEach(p => {
        list.innerHTML += `<li>✔ ${p}</li>`;
    });
}


let changePasswordForm = document.getElementById("change-password-form");

if (changePasswordForm) {

    changePasswordForm.addEventListener("submit", function(e){

        e.preventDefault();

        let current = document.getElementById("current-password").value;
        let newPass = document.getElementById("new-password").value;
        let confirm = document.getElementById("confirm-password").value;

        if (newPass !== confirm) {
            alert("New passwords do not match!");
            return;
        }

        if (newPass.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        let users = getUsers();
        let user = getCurrentUser();

        let encryptedCurrent = CryptoJS.SHA256(current).toString();

        if (user.password !== encryptedCurrent) {
            alert("Current password incorrect!");
            return;
        }

        let encryptedNew = CryptoJS.SHA256(newPass).toString();

        users = users.map(u => {
            if (u.email === user.email) {
                u.password = encryptedNew;
                user.password = encryptedNew;
            }
            return u;
        });

        saveUsers(users);
        setCurrentUser(user);

        alert("Password updated successfully!");

        this.reset();
    });

}