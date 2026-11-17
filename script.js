// =====================================
// PERSONAL EXPENSE TRACKER
// Add, Edit, Delete + LocalStorage
// =====================================

const transactionForm = document.getElementById("transactionForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");

const transactionList = document.getElementById("transactionList");
const filterInput = document.getElementById("filter");
const searchInput = document.getElementById("searchTransaction");
const submitButton = transactionForm.querySelector(
    'button[type="submit"]'
);

let editingId = null;

// Load existing data
let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("transactions") || "[]"
    );

    if (!Array.isArray(transactions)) transactions = [];
} catch (error) {
    transactions = [];
}

// Give IDs to older transactions if missing
transactions.forEach((item, index) => {
    if (item.id === undefined || item.id === null) {
        item.id = "old-" + index + "-" + Date.now();
    }
});

function getToday() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

dateInput.value = getToday();

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

// Dashboard calculation
function updateSummary() {
    let income = 0;
    let expense = 0;

    transactions.forEach(item => {
        if (item.type === "income") {
            income += Number(item.amount) || 0;
        } else if (item.type === "expense") {
            expense += Number(item.amount) || 0;
        }
    });

    totalIncome.textContent = formatCurrency(income);
    totalExpense.textContent = formatCurrency(expense);
    balance.textContent = formatCurrency(income - expense);
}

// Display history
function displayTransactions() {
    transactionList.replaceChildren();

    const selected = filterInput.value;
    const searchText = searchInput.value.toLowerCase().trim();

    const filtered = transactions
        .filter(item =>
            selected === "all" || item.category === selected
        )
        .filter(item =>
            item.title.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.type.toLowerCase().includes(searchText) ||
            (item.date || "").includes(searchText)
        )
        .sort((a, b) =>
            (b.date || "").localeCompare(a.date || "")
        );

    if (filtered.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent = "No transactions found.";
        transactionList.appendChild(message);
        return;
    }

    filtered.forEach(item => {
        const row = document.createElement("div");
        row.className = "transaction-item";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const name = document.createElement("h3");
        name.textContent = item.title;

        const info = document.createElement("p");
        info.textContent = `${item.category} | ${item.date}`;

        details.append(name, info);

        const amount = document.createElement("strong");

        amount.className =
            item.type === "income" ? "positive" : "negative";

        amount.textContent =
            `${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount)}`;

        const actions = document.createElement("div");
        actions.className = "transaction-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";
        editButton.dataset.action = "edit";
        editButton.dataset.id = item.id;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = item.id;

        actions.append(editButton, deleteButton);
        row.append(details, amount, actions);

        transactionList.appendChild(row);
    });
}

// Handle Edit and Delete clicks
transactionList.addEventListener("click", function(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
        editTransaction(id);
    }

    if (button.dataset.action === "delete") {
        deleteTransaction(id);
    }
});

// Add or Update transaction
transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);

    if (!title || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid details!");
        return;
    }

    if (editingId !== null) {

        const index = transactions.findIndex(
            item => String(item.id) === String(editingId)
        );

        if (index === -1) {
            alert("Transaction not found!");
            cancelEdit();
            return;
        }

        transactions[index] = {
            ...transactions[index],
            title: title,
            amount: amount,
            type: typeInput.value,
            category: categoryInput.value,
            date: dateInput.value
        };

        alert("Transaction updated successfully!");

    } else {

        const newTransaction = {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            title: title,
            amount: amount,
            type: typeInput.value,
            category: categoryInput.value,
            date: dateInput.value
        };

        transactions.push(newTransaction);

        alert("Transaction added successfully!");
    }

    saveTransactions();
    updateSummary();
    displayTransactions();
    
    updateCharts();
});

// Edit transaction
function editTransaction(id) {
    const item = transactions.find(
        t => String(t.id) === String(id)
    );

    if (!item) {
        alert("Transaction not found!");
        return;
    }

    editingId = item.id;

    // Fill form with existing data
    titleInput.value = item.title;
    amountInput.value = item.amount;
    typeInput.value = item.type;
    categoryInput.value = item.category;
    dateInput.value = item.date;

    submitButton.textContent = "Update Transaction";

    // Create Cancel button if not already present
    let cancelButton = document.getElementById("cancelEdit");

    if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.id = "cancelEdit";
        cancelButton.textContent = "Cancel Edit";
        cancelButton.style.background = "#64748b";

        submitButton.after(cancelButton);

        cancelButton.addEventListener("click", cancelEdit);
    }

    cancelButton.hidden = false;

    // Scroll to form
    transactionForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Cancel editing
function cancelEdit() {
    editingId = null;

    transactionForm.reset();
    dateInput.value = getToday();

    submitButton.textContent = "Add Transaction";

    const cancelButton = document.getElementById("cancelEdit");

    if (cancelButton) {
        cancelButton.hidden = true;
    }
}

// Delete transaction
function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    transactions = transactions.filter(
        item => String(item.id) !== String(id)
    );

    if (String(editingId) === String(id)) {
        cancelEdit();
    }

    saveTransactions();
    updateSummary();
    displayTransactions();

    alert("Transaction deleted successfully!");
}

// Category filtering
filterInput.addEventListener("change", displayTransactions);

// Search and Filter
searchInput.addEventListener("input", displayTransactions);

filterInput.addEventListener("change", displayTransactions);
// DARK MODE
const themeToggle = document.getElementById("themeToggle");

// Load saved theme
const savedTheme = localStorage.getItem("expenseTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Light Mode";
}

// Toggle theme
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("expenseTheme", "dark");
        themeToggle.textContent = "☀️ Light Mode";
    } else {
        localStorage.setItem("expenseTheme", "light");
        themeToggle.textContent = "🌙 Dark Mode";
    }
});
// DOWNLOAD EXPENSE REPORT

const downloadButton = document.getElementById("downloadReport");

downloadButton.addEventListener("click", function () {

    if (transactions.length === 0) {
        alert("No transactions available to download!");
        return;
    }

    // CSV headings
    let csvContent = "Title,Amount,Type,Category,Date\n";

    // Add transaction data
    transactions.forEach(function (transaction) {

        const row = [
            transaction.title,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.date
        ];

        // Escape commas and quotes
        const formattedRow = row.map(function (value) {
            return `"${String(value ?? "").replace(/"/g, '""')}"`;
        });

        csvContent += formattedRow.join(",") + "\n";
    });

    // Create downloadable file
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Expense_Tracker_Report.csv";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert("Expense report downloaded successfully!");
});

// Initial setup
saveTransactions();
updateSummary();
displayTransactions();

console.log("Expense Tracker is running!");
// ==================================
// EXPENSE ANALYTICS CHARTS
// ==================================

let expenseChart = null;
let monthlyChart = null;

function updateCharts() {

    if (typeof Chart === "undefined") {
        console.error("Chart.js library not loaded.");
        return;
    }

    // Category-wise expenses
    const categoryTotals = {};

    transactions
        .filter(item => item.type === "expense")
        .forEach(item => {
            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) +
                Number(item.amount);
        });

    const categories = Object.keys(categoryTotals);
    const categoryAmounts = Object.values(categoryTotals);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "doughnut",
            data: {
                labels: categories.length ? categories : ["No Expenses"],
                datasets: [{
                    data: categoryAmounts.length ? categoryAmounts : [1],
                    backgroundColor: [
                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                        "#06b6d4"
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );

    // Monthly income and expenses
    const monthlyData = {};

    transactions.forEach(item => {
        const month = (item.date || "").slice(0, 7);

        if (!month) return;

        if (!monthlyData[month]) {
            monthlyData[month] = {
                income: 0,
                expense: 0
            };
        }

        if (item.type === "income") {
            monthlyData[month].income += Number(item.amount);
        } else {
            monthlyData[month].expense += Number(item.amount);
        }
    });

    const months = Object.keys(monthlyData).sort();

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(
        document.getElementById("monthlyChart"),
        {
            type: "bar",
            data: {
                labels: months.length ? months : ["No Data"],
                datasets: [
                    {
                        label: "Income",
                        data: months.map(m => monthlyData[m].income),
                        backgroundColor: "#16a34a"
                    },
                    {
                        label: "Expenses",
                        data: months.map(m => monthlyData[m].expense),
                        backgroundColor: "#ef4444"
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}

// Initial chart loading
updateCharts();
// =====================================
// MONTHLY BUDGET SYSTEM
// =====================================

const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("monthlyBudgetInput");

const budgetAmount = document.getElementById("budgetAmount");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");

const budgetPercentage = document.getElementById("budgetPercentage");
const budgetProgress = document.getElementById("budgetProgress");
const budgetMessage = document.getElementById("budgetMessage");

// Load saved budget
let monthlyBudget = Number(
    localStorage.getItem("monthlyBudget") || 0
);

// Get current month
function getCurrentMonth() {
    const today = new Date();

    return `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, "0")}`;
}

// Update budget dashboard
function updateBudget() {

    const currentMonth = getCurrentMonth();

    let spent = 0;

    transactions.forEach(item => {

        if (
            item.type === "expense" &&
            (item.date || "").slice(0, 7) === currentMonth
        ) {
            spent += Number(item.amount) || 0;
        }

    });

    const remaining = monthlyBudget - spent;

    const percentage = monthlyBudget > 0
        ? (spent / monthlyBudget) * 100
        : 0;

    budgetAmount.textContent = formatCurrency(monthlyBudget);
    budgetSpent.textContent = formatCurrency(spent);
    budgetRemaining.textContent = formatCurrency(remaining);

    budgetPercentage.textContent =
        `${percentage.toFixed(1)}%`;

    // Progress bar
    budgetProgress.style.width =
        `${Math.min(percentage, 100)}%`;

    // Progress colors and messages
    if (monthlyBudget <= 0) {

        budgetProgress.style.background = "#94a3b8";

        budgetMessage.textContent =
            "Please set your monthly budget.";

    } else if (remaining < 0) {

        budgetProgress.style.background = "#ef4444";

        budgetMessage.textContent =
            "Warning! You have exceeded your monthly budget.";

    } else if (percentage >= 80) {

        budgetProgress.style.background = "#f59e0b";

        budgetMessage.textContent =
            "Careful! You are close to your budget limit.";

    } else {

        budgetProgress.style.background = "#16a34a";

        budgetMessage.textContent =
            "Great! You are managing your budget well.";

    }
}

// Save budget
budgetForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(budgetInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    monthlyBudget = amount;

    localStorage.setItem(
        "monthlyBudget",
        String(monthlyBudget)
    );

    updateBudget();

    alert("Monthly budget saved successfully!");

});

// Initial budget setup
if (monthlyBudget > 0) {
    budgetInput.value = monthlyBudget;
}

updateBudget();