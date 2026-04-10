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
    refreshDashboard();
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


//AUTO LOGIN (ON REFRESH)
window.onload = function () {

    let user = getCurrentUser();

    if (user) {
        loadDashboard();
        showPage("dashboard-container");
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

function loadDashboardStats() {

    const statsGrid = document.getElementById("stats-grid");

    const stats = [
        {
            title: "Total Transactions",
            value: getTotalTransactions(),
            color: "from-blue-500 to-cyan-500"
        },
        {
            title: "Total Blocks",
            value: blockchain.length,
            color: "from-purple-500 to-pink-500"
        },
        {
            title: "Blockchain Status",
            value: getBlockchainStatus(),
            color: getBlockchainStatus() === "Valid"
                ? "from-green-500 to-emerald-500"
                : "from-red-500 to-orange-500"
        },
        {
            title: "Last Verified",
            value: lastVerified || "Not verified yet",
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

    document.getElementById("last-backup").textContent =
        new Date().toLocaleDateString();
}


/***********************
 LOAD RECENT BLOCKS
************************/

function loadRecentBlocks() {

    const container = document.getElementById("recent-blocks");

    container.innerHTML = "";

    const recent = blockchain.slice(-5).reverse();

    if (recent.length === 1 && recent[0].transactions.length === 0) {
        container.innerHTML =
            `<div class="text-center text-white/50 py-6">
                No transactions yet. Add your first transaction!
             </div>`;
        return;
    }

    recent.forEach(block => {

        container.innerHTML += `
            <div class="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                    <div class="text-white font-medium">
                        Block #${block.blockNumber}
                    </div>
                    <div class="text-sm text-white/70">
                        ${block.transactions.length} transaction(s)
                    </div>
                </div>

                <div class="text-right text-sm text-white/70">
                    ${new Date(block.timestamp).toLocaleString()}
                </div>
            </div>
        `;
    });
}


/***********************
 UPDATE DASHBOARD
************************/

function refreshDashboard() {
    loadDashboardStats();
    loadRecentBlocks();
}

document.addEventListener("DOMContentLoaded", function () {

    let form = document.getElementById("transaction-form");

    if (form) {

        form.addEventListener("submit", function (e) {

            e.preventDefault();

            let sender = document.getElementById("sender").value.trim();
            let receiver = document.getElementById("receiver").value.trim();
            let amount = parseFloat(document.getElementById("amount").value);
            let description = document.getElementById("description").value.trim();

            if (!sender || !receiver || !amount || !description) {
                alert("All fields are required!");
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
                    <p style="color:#22c55e; font-size:14px;">Added to blockchain</p>
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
                        <b>Amount:</b> $${amount.toFixed(2)}
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

function renderBlockchain() {

    const container = document.getElementById("ledger-blocks");
    container.innerHTML = "";

    if (blockchain.length === 1 && blockchain[0].transactions.length === 0) {
        container.innerHTML = `
            <div class="genesis-box">
                Only Genesis Block exists.<br>
                Add transactions to create new blocks!
            </div>
        `;
        return;
    }

    blockchain.forEach((block, index) => {

        let blockHTML = `
            <div class="block-card">

                <div class="block-header">
                    <div>
                        <div class="block-title">Block #${block.blockNumber}</div>
                        <div style="font-size:13px; opacity:0.7;">
                            ${block.transactions.length} transaction(s)
                        </div>
                    </div>
                    <div style="font-size:13px;">
                        ${new Date(block.timestamp).toLocaleString()}
                    </div>
                </div>

                <div class="block-content">

                    <div style="margin-bottom:15px;">
                        <div style="opacity:0.6;">Previous Hash</div>
                        <div class="hash-box hash-previous">
                            ${block.previousHash === "0" ? "Genesis Block" : block.previousHash}
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <div style="opacity:0.6;">Current Hash</div>
                        <div class="hash-box hash-current">
                            ${block.currentHash}
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <div style="opacity:0.6;">Nonce</div>
                        <div class="hash-box" style="color:#60a5fa;">
                            ${block.nonce}
                        </div>
                    </div>
        `;

        // Transactions
        if (block.transactions.length > 0) {

            block.transactions.forEach((tx, txIndex) => {

                blockHTML += `
                    <div class="transaction-item" onclick="toggleTransaction(this)">
                        <div class="transaction-header">
                            <div>
                                <strong>${tx.id.substring(0,16)}...</strong><br>
                                <small>${tx.sender} → ${tx.receiver}</small>
                            </div>
                            <div style="color:#22c55e;">
                                $${tx.amount.toFixed(2)}
                            </div>
                        </div>

                        <div class="transaction-details">
                            <p><b>Sender:</b> ${tx.sender}</p>
                            <p><b>Receiver:</b> ${tx.receiver}</p>
                            <p><b>Description:</b> ${tx.description}</p>
                            <p><b>Timestamp:</b> ${new Date(tx.timestamp).toLocaleString()}</p>
                            <p style="font-size:12px; word-break:break-all;">
                                <b>ID:</b> ${tx.id}
                            </p>
                        </div>
                    </div>
                `;
            });

        } else {
            blockHTML += `
                <div class="genesis-box">
                    Genesis Block - No Transactions
                </div>
            `;
        }

        blockHTML += `</div></div>`;

        // Add arrow if not last block
        if (index < blockchain.length - 1) {
            blockHTML += `<div class="arrow-connector">↓</div>`;
        }

        container.innerHTML += blockHTML;

    });
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

    let tbody = document.querySelector("#audit-table tbody");
    let noRecords = document.getElementById("no-records");
    let summaryCard = document.getElementById("summary-card");

    tbody.innerHTML = "";

    document.getElementById("record-count").textContent = data.length;

    if (data.length === 0) {
        noRecords.classList.remove("hidden");
        summaryCard.classList.add("hidden");
        return;
    }

    noRecords.classList.add("hidden");

    data.forEach(tx => {
        tbody.innerHTML += `
            <tr>
                <td>${tx.id.substring(0,12)}...</td>
                <td>${tx.sender}</td>
                <td>${tx.receiver}</td>
                <td class="green">$${tx.amount.toFixed(2)}</td>
                <td>${tx.blockNumber}</td>
                <td class="green">Valid</td>
                <td>${new Date(tx.timestamp).toLocaleDateString()}</td>
            </tr>
        `;
    });

    // Summary
    summaryCard.classList.remove("hidden");

    let totalVolume = data.reduce((sum, tx) => sum + tx.amount, 0);

    document.getElementById("sum-total").textContent = data.length;
    document.getElementById("sum-volume").textContent = "$" + totalVolume.toFixed(2);
    document.getElementById("sum-average").textContent =
        "$" + (totalVolume / data.length).toFixed(2);

    document.getElementById("sum-blocks").textContent =
        new Set(data.map(tx => tx.blockNumber)).size;
}

function generateAuditReport() {

    let data = document.getElementById("record-count").textContent == "0"
        ? []
        : getAllTransactions();

    if (data.length === 0) {
        alert("No transactions available");
        return;
    }

    let csv = [
        "Transaction ID,Sender,Receiver,Amount,Description,Timestamp,Block Number"
    ];

    data.forEach(tx => {
        csv.push(
            `${tx.id},${tx.sender},${tx.receiver},${tx.amount},${tx.description},${new Date(tx.timestamp).toLocaleString()},${tx.blockNumber}`
        );
    });

    let blob = new Blob([csv.join("\n")], { type: "text/csv" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "audit-report.csv";
    a.click();
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

    setTimeout(() => {

        let result = verifyBlockchain();

        loadingCard.classList.add("hidden");

        if (result.isValid) {

            resultDiv.innerHTML = `
                <div class="valid-card">
                    <div class="result-icon">✔</div>
                    <h2>Blockchain is Valid</h2>
                    <p>All blocks verified successfully</p>
                    <p style="margin-top:10px;">
                        Last verified: ${new Date().toLocaleString()}
                    </p>
                </div>
            `;

        } else {

            resultDiv.innerHTML = `
                <div class="invalid-card">
                    <div class="result-icon">✖</div>
                    <h2>Tampering Detected</h2>
                    <p>Blockchain integrity compromised</p>
                    <p style="margin-top:10px;">
                        Tampered Block: Block #${result.tamperedBlock}
                    </p>
                </div>
            `;
        }

    }, 2000);
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