//LOCAL STORAGE HELPERS

function getUsers() {
    try {
        const raw = localStorage.getItem("users");
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

/** Session lives in sessionStorage — closing the tab/window clears it; reopening requires login again. */
const SESSION_USER_KEY = "blast_current_user";

function getCurrentUser() {
    try {
        const raw = sessionStorage.getItem(SESSION_USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function setCurrentUser(user) {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    try {
        localStorage.removeItem("currentUser");
    } catch (e) {}
}

function clearCurrentUser() {
    sessionStorage.removeItem(SESSION_USER_KEY);
    try {
        localStorage.removeItem("currentUser");
    } catch (e) {}
}

(function clearLegacyLoginFromLocalStorage() {
    try {
        localStorage.removeItem("currentUser");
    } catch (e) {}
})();


//SIGNUP

function handleSignup(e) {
    e.preventDefault();

    if (typeof CryptoJS === "undefined") {
        alert("Security library failed to load. Check your network and refresh the page.");
        return;
    }

    let name = document.getElementById("signup-name").value.trim();
    let email = document.getElementById("signup-email").value.trim();
    let empId = document.getElementById("signup-employeeId").value.trim();
    let role = document.getElementById("signup-role").value;
    let password = document.getElementById("signup-password").value;
    let confirm = document.getElementById("signup-confirm-password").value;

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    let users = getUsers();

    if (users.find(u => u.email === email)) {
        alert("Email already registered!");
        return;
    }

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
    window.location.href = "login.html";
}


//LOGIN

function handleLogin(e) {
    e.preventDefault();

    if (typeof CryptoJS === "undefined") {
        alert("Security library failed to load. Check your network and refresh the page.");
        return;
    }

    let email = document.getElementById("login-email").value.trim();
    let password = document.getElementById("login-password").value;
    let role = document.getElementById("login-role").value;

    let users = getUsers();
    let encrypted = CryptoJS.SHA256(password).toString();

    let user = users.find(u =>
        u.email === email &&
        u.password === encrypted &&
        u.role === role
    );

    if (!user) {
        alert("Invalid email, password, or role!");
        return;
    }

    user.lastLogin = new Date().toLocaleString();
    saveUsers(users);

    setCurrentUser(user);

    window.location.href = "dashboard.html";
}


//LOGOUT

function handleLogout() {
    clearCurrentUser();
    window.location.href = "login.html";
}


//DASHBOARD LOAD

function loadDashboard() {
    let user = getCurrentUser();
    if (!user) return;

    setText("user-name", user.name);
    setText("user-role", user.role);
    setText("user-last-login", user.lastLogin || "First Login");

    setAvatar("user-avatar", user.name);
}


//PROFILE LOAD

function loadProfile() {
    let user = getCurrentUser();
    if (!user) return;

    setText("profile-name", user.name);
    setText("profile-role", user.role);
    setText("profile-email", user.email);
    setText("profile-empid", user.empId);
    setText("profile-lastlogin", user.lastLogin || "First Login");

    setAvatar("profile-avatar", user.name);

    loadPermissions(user.role);
}


//ROLE MENU CONTROL

function handleRoleMenu(role) {
    let adminMenu = document.getElementById("menu-admin");
    let auditMenu = document.getElementById("menu-audit");

    if (role === "Admin" && auditMenu) {
        auditMenu.style.display = "none";
    }

    if (role === "Auditor" && adminMenu) {
        adminMenu.style.display = "none";
    }
}


//PROFILE PERMISSIONS

function loadPermissions(role) {
    let permList = document.getElementById("role-permissions");
    if (!permList) return;

    if (role === "Admin") {
        permList.innerHTML = `
            <li>✔ Add Transaction</li>
            <li>✔ Blockchain Ledger</li>
        `;
    } else {
        permList.innerHTML = `
            <li>✔ Verify Blockchain</li>
            <li>✔ Audit Reports</li>
        `;
    }
}


//HELPERS

function setText(id, value) {
    let el = document.getElementById(id);
    if (el) el.textContent = value || "";
}

function setAvatar(id, name) {
    let el = document.getElementById(id);
    if (el && name) el.textContent = name.charAt(0).toUpperCase();
}


//BLOCKCHAIN (per logged-in user — isolated by account)

/** Old shared ledger (removed — was incorrectly copied to multiple users). */
const LEGACY_GLOBAL_CHAIN_KEY = "blockchain_ledger";

function sanitizeEmailForKey(email) {
    return String(email || "").replace(/[^a-zA-Z0-9]/g, "_");
}

/** Unique per email (avoids collisions from stripped punctuation, e.g. user.1@x vs user_1@x). */
function getBlockchainStorageKey() {
    const user = getCurrentUser();
    if (!user || !user.email) return null;
    return "blast_chain_" + encodeURIComponent(user.email.trim().toLowerCase());
}

function getLegacyPerUserChainKey(email) {
    if (!email) return null;
    return "blockchain_ledger_" + sanitizeEmailForKey(email.trim().toLowerCase());
}

function computeBlockHash(block) {
    if (typeof CryptoJS === "undefined") {
        return "";
    }
    const str = `${block.index}|${block.prevHash}|${block.sender}|${block.receiver}|${block.amount}|${block.description}|${block.time}|${block.nonce}`;
    return CryptoJS.SHA256(str).toString();
}

function getBlockchain() {
    const key = getBlockchainStorageKey();
    if (!key) return [];
    let raw = localStorage.getItem(key);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }
    const user = getCurrentUser();
    if (user && user.email) {
        const oldKey = getLegacyPerUserChainKey(user.email);
        if (oldKey && oldKey !== key) {
            const oldRaw = localStorage.getItem(oldKey);
            if (oldRaw) {
                try {
                    JSON.parse(oldRaw);
                    localStorage.setItem(key, oldRaw);
                    localStorage.removeItem(oldKey);
                    raw = localStorage.getItem(key);
                    if (raw) return JSON.parse(raw);
                } catch (e) {}
            }
        }
    }
    migrateLegacyIfNeeded(key);
    raw = localStorage.getItem(key);
    try {
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveBlockchain(chain) {
    const key = getBlockchainStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(chain));
}

/** Read any user’s chain by email (same keys as logged-in user storage). Used by auditors. */
function getBlockchainChainForEmail(email) {
    const norm = String(email || "").trim().toLowerCase();
    if (!norm) return [];
    const newKey = "blast_chain_" + encodeURIComponent(norm);
    let raw = localStorage.getItem(newKey);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }
    const oldKey = getLegacyPerUserChainKey(norm);
    if (oldKey && oldKey !== newKey) {
        raw = localStorage.getItem(oldKey);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                return Array.isArray(data) ? data : [];
            } catch (e) {
                return [];
            }
        }
    }
    return [];
}

function getAllTransactionsForAudit() {
    let users = getUsers();
    let allChains = [];

    users.forEach(user => {
        if (user.role === "Admin") {
            let chain = getBlockchainChainForEmail(user.email);
            allChains = allChains.concat(chain);
        }
    });

    return allChains;
}

function removeUnsafeLegacyGlobalChain() {
    try {
        localStorage.removeItem(LEGACY_GLOBAL_CHAIN_KEY);
    } catch (e) {}
}

function normalizeAmountForDedupe(amount) {
    const n = parseFloat(String(amount).trim().replace(/,/g, ""));
    if (!isNaN(n)) return String(n);
    return String(amount).trim();
}

function transactionFingerprint(sender, receiver, amount, description) {
    return [
        String(sender).trim().toLowerCase(),
        String(receiver).trim().toLowerCase(),
        normalizeAmountForDedupe(amount),
        String(description || "").trim()
    ].join("\x1e");
}

function isDuplicateTransaction(chain, sender, receiver, amount, description) {
    const fp = transactionFingerprint(sender, receiver, amount, description);
    return chain.some(
        (b) => transactionFingerprint(b.sender, b.receiver, b.amount, b.description) === fp
    );
}

/** @returns {{ ok: true } | { ok: false, reason: string }} */
function appendBlock(sender, receiver, amount, description) {
    const chain = getBlockchain();
    if (isDuplicateTransaction(chain, sender, receiver, amount, description)) {
        return { ok: false, reason: "duplicate" };
    }
    const prevHash = chain.length === 0 ? "0" : chain[chain.length - 1].hash;
    const index = chain.length;
    const time = new Date().toLocaleString();
    const block = {
        index,
        prevHash,
        sender,
        receiver,
        amount: String(amount),
        description: description || "",
        time,
        nonce: Date.now()
    };
    block.hash = computeBlockHash(block);
    chain.push(block);
    saveBlockchain(chain);
    return { ok: true };
}

/** Flat list of transaction-shaped objects for admin “recent” panel */
function getTransactions() {
    return getBlockchain().map((b) => ({
        sender: b.sender,
        receiver: b.receiver,
        amount: b.amount,
        description: b.description,
        time: b.time,
        blockIndex: b.index,
        hash: b.hash
    }));
}

function handleAddTransaction(e) {
    e.preventDefault();

    let sender = document.getElementById("sender").value.trim();
    let receiver = document.getElementById("receiver").value.trim();
    let amount = document.getElementById("amount").value;
    let description = document.getElementById("description").value;

    if (!sender || !receiver || !amount) {
        alert("All fields required!");
        return;
    }

    if (typeof CryptoJS === "undefined") {
        alert("Crypto library not loaded. Refresh the page.");
        return;
    }

    const added = appendBlock(sender, receiver, amount, description);
    if (!added.ok) {
        if (added.reason === "duplicate") {
            alert(
                "Duplicate transaction: the same sender, receiver, amount, and description already exists in your ledger."
            );
        }
        return;
    }

    alert("Transaction Added Successfully!");

    loadTransactions();

    e.target.reset();
}

function loadTransactions() {
    let container = document.getElementById("transaction-result");

    if (!container) return;

    let data = getTransactions();

    if (data.length === 0) {
        container.innerHTML =
            '<span class="text-white/50 text-sm">No transactions yet</span>';
        return;
    }

    container.innerHTML = data
        .map(
            (t) => `
        <div class="w-full shrink-0" style="padding:10px; background:#ffffff10; border-radius:8px;">
            <b>${escapeHtml(t.sender)}</b> → <b>${escapeHtml(t.receiver)}</b><br>
            Amount: ₹${escapeHtml(t.amount)}<br>
            <small>${escapeHtml(t.time)}</small>
        </div>
    `
        )
        .join("");
}

function loadLedger() {
    let container = document.getElementById("ledger-blocks");
    if (!container) return;

    let chain = getBlockchain();

    if (chain.length === 0) {
        container.innerHTML = '<p class="text-white/70">No blocks available</p>';
        return;
    }

    container.innerHTML = chain.map((b) => `
        <div style="margin-bottom:10px; padding:10px; background:#ffffff10; border-radius:8px;">
            <b>Block ${b.index + 1}</b> <small class="text-white/50">#${escapeHtml(b.hash.slice(0, 16))}…</small><br>
            ${escapeHtml(b.sender)} → ${escapeHtml(b.receiver)}<br>
            ₹${escapeHtml(b.amount)}<br>
            <small>${escapeHtml(b.time)}</small>
        </div>
    `).join("");
}

function escapeHtml(s) {
    if (s == null) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
}

//DASHBOARD STATS + RECENT ACTIVITY
function loadDashboardStats() {
    const statsGrid = document.getElementById("stats-grid");
    const recent = document.getElementById("recent-blocks");
    const backupEl = document.getElementById("last-backup");

    const chain = getBlockchain();
    const lastTime = chain.length ? chain[chain.length - 1].time : "—";

    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div class="text-white/70 text-sm">Total blocks</div>
                <div class="text-2xl font-semibold text-white">${chain.length}</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div class="text-white/70 text-sm">Chain status</div>
                <div class="text-2xl font-semibold text-green-400">Active</div>
            </div>
            <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div class="text-white/70 text-sm">Last block</div>
                <div class="text-sm font-medium text-white">${escapeHtml(lastTime)}</div>
            </div>`;
    }

    if (recent) {
        if (chain.length === 0) {
            recent.innerHTML = '<p class="text-white/70">No activity yet. Admins can add transactions from the Admin Panel.</p>';
        } else {
            const slice = chain.slice(-8).reverse();
            recent.innerHTML = slice.map((b) => `
                <div class="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                    <div>
                        <span class="text-white font-medium">${escapeHtml(b.sender)} → ${escapeHtml(b.receiver)}</span>
                        <div class="text-white/50 text-sm">Block ${b.index + 1} · ${escapeHtml(b.time)}</div>
                    </div>
                    <span class="text-emerald-400">₹${escapeHtml(b.amount)}</span>
                </div>`).join("");
        }
    }

    if (backupEl) {
        backupEl.textContent = lastTime;
    }
}

//VERIFY BLOCKCHAIN
function runBlockchainVerification(chain) {
    let ok = true;
    let msg = "";

    if (!chain || chain.length === 0) {
        return { ok: false, msg: "No blocks in the ledger." };
    }
    for (let i = 0; i < chain.length; i++) {
        const b = chain[i];
        const expected = computeBlockHash(b);
        if (b.hash !== expected) {
            return { ok: false, msg: `Invalid hash at block ${i + 1} (tampered data).` };
        }
        if (i === 0) {
            if (b.prevHash !== "0") {
                return { ok: false, msg: "Genesis block prevHash must be 0." };
            }
        } else {
            if (b.prevHash !== chain[i - 1].hash) {
                return { ok: false, msg: `blockchain verified ✔. Broken chain link at block ${i + 1}.` };
            }
        }
    }
    msg = `✔ Blockchain valid — ${chain.length} block(s), hashes and links OK.`;
    return { ok: true, msg };
}

function handleVerifyBlockchain() {
    let result = document.getElementById("verify-result");
    let loading = document.getElementById("verify-loading");

    if (typeof CryptoJS === "undefined") {
        if (result) result.innerHTML = '<span class="text-red-400">Crypto library not loaded.</span>';
        return;
    }

    if (loading) loading.classList.remove("hidden");
    if (result) result.innerHTML = "";

    setTimeout(() => {

        // Get ALL transactions 
        let chain = getAllTransactionsForAudit();

        if (!chain || chain.length === 0) {
            if (loading) loading.classList.add("hidden");
            if (result) {
                result.innerHTML = `<span class="text-red-400">No transactions found to verify.</span>`;
            }
            return;
        }

        const verdict = runBlockchainVerification(chain);

        if (loading) loading.classList.add("hidden");

        if (result) {
            result.innerHTML = verdict.ok
                ? `<span class="text-green-400">${escapeHtml(verdict.msg)}</span>`
                : `<span class="text-red-400">${escapeHtml(verdict.msg)}</span>`;
        }

    }, 300);
}

//AUDIT REPORT + TABLE

function parseBlockDate(timeStr) {
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? null : d;
}

function filterChainForAudit(chain) {
    if (!chain) {
        chain = getBlockchain();
    }
    const from = document.getElementById("filter-dateFrom");
    const to = document.getElementById("filter-dateTo");
    const account = document.getElementById("filter-account");
    const minA = document.getElementById("filter-minAmount");
    const maxA = document.getElementById("filter-maxAmount");

    const fromVal = from && from.value ? new Date(from.value + "T00:00:00") : null;
    const toVal = to && to.value ? new Date(to.value + "T23:59:59") : null;
    const acc = account && account.value.trim().toLowerCase();
    const minAmt = minA && minA.value !== "" ? parseFloat(minA.value) : null;
    const maxAmt = maxA && maxA.value !== "" ? parseFloat(maxA.value) : null;

    return chain.filter((b) => {
        const t = parseBlockDate(b.time);
        if (fromVal && t && t < fromVal) return false;
        if (toVal && t && t > toVal) return false;
        if (acc) {
            const s = (b.sender + b.receiver).toLowerCase();
            if (!s.includes(acc)) return false;
        }
        const amt = parseFloat(b.amount);
        if (minAmt != null && !isNaN(minAmt) && amt < minAmt) return false;
        if (maxAmt != null && !isNaN(maxAmt) && amt > maxAmt) return false;
        return true;
    });
}

function loadAuditTable() {
    const tbody = document.getElementById("audit-table");
    if (!tbody) return;

    //Get all transactions
    const chain = filterChainForAudit(getAllTransactionsForAudit());

    if (!chain || chain.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" class="text-center text-white/70 py-4">No transactions found</td></tr>';
        return;
    }

    tbody.innerHTML = chain.map((b) => `
        <tr class="border-b border-white/10">
            <td class="py-2">${b.index + 1}</td>
            <td>${escapeHtml(b.sender)}</td>
            <td>${escapeHtml(b.receiver)}</td>
            <td>${escapeHtml(b.amount)}</td>
            <td>${b.index + 1}</td>
            <td class="text-green-400">Sealed</td>
            <td class="text-white/70">${escapeHtml(b.time)}</td>
        </tr>
    `).join("");
}

function generateAuditReport() {
    const user = getCurrentUser();
    if (!user) return;

    //Get all transactions
    const chain = filterChainForAudit(getAllTransactionsForAudit());

    if (!chain || chain.length === 0) {
        alert("No transactions available for audit.");
        return;
    }

    const exportedAt = new Date().toLocaleString();
    const lastLogin = user.lastLogin || "First Login";

    const header = [
        "BLAST Audit Export",
        `Auditor (email),${user.email}`,
        `Auditor last login,${lastLogin}`,
        `Export time,${exportedAt}`,
        "",
        "Block ID,Sender,Receiver,Amount (INR),Block #,Hash (truncated),Status,Timestamp"
    ];

    const rows = chain.map((b) => {
        const id = b.index + 1;
        const hashShort = b.hash ? b.hash.slice(0, 16) + "…" : "";
        return [
            id,
            csvEscape(b.sender),
            csvEscape(b.receiver),
            csvEscape(b.amount),
            id,
            hashShort,
            "Sealed",
            csvEscape(b.time)
        ].join(",");
    });

    const csv = [...header, ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `blast-audit-${Date.now()}.csv`;
    a.click();

    URL.revokeObjectURL(url);
}
//PASSWORD CHANGE

function handleChangePassword(e) {
    e.preventDefault();

    let current = document.getElementById("current-password").value;
    let newPass = document.getElementById("new-password").value;
    let confirm = document.getElementById("confirm-password").value;

    if (newPass !== confirm) {
        alert("Passwords do not match!");
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
    e.target.reset();
}


//AUTO LOAD + PROTECTION

/** Pages that do not require a session (supports /signup, /, and servers that omit .html). */
function isPublicAuthPage() {
    const p = (window.location.pathname || "").toLowerCase();
    const href = (window.location.href || "").toLowerCase();
    if (href.includes("login.html") || href.includes("signup.html") || href.includes("index.html")) return true;
    if (p.includes("login.html") || p.includes("signup.html") || p.includes("index.html")) return true;
    if (/\/login\/?$/.test(p) || /\/signup\/?$/.test(p)) return true;
    if (p === "/" || p === "" || /\/index\/?$/.test(p)) return true;
    return false;
}

function isLoginPage() {
    const p = (window.location.pathname || "").toLowerCase();
    const href = (window.location.href || "").toLowerCase();
    return href.includes("login.html") || p.includes("login.html") || /\/login\/?$/.test(p);
}

window.onload = function () {
    removeUnsafeLegacyGlobalChain();

    let user = getCurrentUser();
    let path = window.location.pathname;

    if (!user && !isPublicAuthPage()) {
        window.location.href = "login.html";
        return;
    }

    if (user && isLoginPage()) {
        window.location.href = "dashboard.html";
        return;
    }

    // APPLY ROLE MENU EVERYWHERE
    if (user) {
        handleRoleMenu(user.role);
    }

    if (path.includes("dashboard.html")) {
        loadDashboard();
        loadDashboardStats();
    }

    if (path.includes("profile.html")) {
        loadProfile();
    }

    if (path.includes("admin.html")) {
        loadTransactions();
    }
};