
const API = "/api/transactions";

const form = document.getElementById("transactionForm");
const filterType = document.getElementById("filterType");
const message = document.getElementById("message");

document.getElementById("date").value =
    new Date().toLocaleDateString("en-CA");

function formatMoney(value) {
    return "Rs. " + Number(value).toFixed(2);
}

function showMessage(text) {
    message.textContent = text;
}

async function loadSummary() {
    const response = await fetch(API + "/summary");

    if (!response.ok) {
        throw new Error("Could not load summary");
    }

    const data = await response.json();

    document.getElementById("income").textContent =
        formatMoney(data.totalIncome);

    document.getElementById("expenses").textContent =
        formatMoney(data.totalExpenses);

    document.getElementById("balance").textContent =
        formatMoney(data.balance);
}

async function loadTransactions() {
    const type = filterType.value;
    const url = type ? API + "?type=" + type : API;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Could not load transactions");
    }

    const transactions = await response.json();
    const container = document.getElementById("transactions");

    container.replaceChildren();

    if (transactions.length === 0) {
        container.textContent = "No transactions found.";
        return;
    }

    transactions.forEach(transaction => {
        const row = document.createElement("div");
        row.className = "transaction";

        const details = document.createElement("div");
        const title = document.createElement("strong");
        const description = document.createElement("p");

        title.textContent = transaction.title;
        description.textContent =
            transaction.category + " | " + transaction.date;

        details.append(title, description);

        const amount = document.createElement("strong");
        amount.className =
            transaction.type === "INCOME" ? "income" : "expense";

        amount.textContent =
            (transaction.type === "INCOME" ? "+ " : "- ") +
            formatMoney(transaction.amount);


        const actions = document.createElement("div");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.type = "button";

        editButton.addEventListener("click", () => {
            editTransaction(transaction);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        actions.append(editButton, deleteButton);
        row.append(details, amount, actions);

        container.appendChild(row);
    });
}

async function refreshDashboard() {
    try {
        await Promise.all([loadSummary(), loadTransactions()]);
        showMessage("");
    } catch (error) {
        showMessage(error.message);
    }
}

async function editTransaction(transaction) {
    const newTitle = prompt("Enter new title:", transaction.title);
    if (newTitle === null) return;

    const newAmount = prompt("Enter new amount:", transaction.amount);
    if (newAmount === null) return;

    if (!newTitle.trim() ||
        !Number.isFinite(Number(newAmount)) ||
        Number(newAmount) <= 0) {
        alert("Enter a valid title and positive amount.");
        return;
    }

    const updatedTransaction = {
        ...transaction,
        title: newTitle.trim(),
        amount: Number(newAmount)
    };

    try {
        const response = await fetch(API + "/" + transaction.id, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedTransaction)
        });

        if (!response.ok) {
            throw new Error("Could not update transaction");
        }

        await refreshDashboard();
    } catch (error) {
        showMessage(error.message);
    }
}

async function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    try {
        const response = await fetch(API + "/" + id, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Could not delete transaction");
        }

        await refreshDashboard();
    } catch (error) {
        showMessage(error.message);
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const transaction = {
        title: document.getElementById("title").value,
        amount: Number(document.getElementById("amount").value),
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        date: document.getElementById("date").value,
        description: document.getElementById("description").value
    };

    try {
        const response = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(transaction)
        });

        if (!response.ok) {
            throw new Error("Could not save transaction");
        }

        form.reset();
        document.getElementById("date").value =
            new Date().toLocaleDateString("en-CA");

        await refreshDashboard();
    } catch (error) {
        showMessage(error.message);
    }
});

filterType.addEventListener("change", refreshDashboard);

refreshDashboard();
