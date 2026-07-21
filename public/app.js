const state = {
  expenses: [],
  incomes: [],
  reports: null,
  entryType: "expenses",
  expenseFilter: "all",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const els = {
  form: document.querySelector("#entry-form"),
  submitButton: document.querySelector("#submit-button"),
  saveStatus: document.querySelector("#save-status"),
  tabs: document.querySelectorAll("[data-entry-type]"),
  typeInput: document.querySelector("input[name='type']"),
  verifiedRow: document.querySelector("#verified-row"),
  expenseFilter: document.querySelector("#expense-filter"),
  expenseList: document.querySelector("#expense-list"),
  incomeList: document.querySelector("#income-list"),
  metrics: {
    income: document.querySelector("#metric-income"),
    expenses: document.querySelector("#metric-expenses"),
    net: document.querySelector("#metric-net"),
    unverified: document.querySelector("#metric-unverified"),
  },
  expensesByTag: document.querySelector("#expenses-by-tag"),
  incomesByTag: document.querySelector("#incomes-by-tag"),
  monthlyCashflow: document.querySelector("#monthly-cashflow"),
};

function setStatus(text) {
  els.saveStatus.textContent = text;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function loadData() {
  setStatus("Loading");
  const [expenses, incomes, reports] = await Promise.all([
    api("/api/expenses"),
    api("/api/incomes"),
    api("/api/reports"),
  ]);

  state.expenses = expenses;
  state.incomes = incomes;
  state.reports = reports;
  render();
  setStatus("Ready");
}

function render() {
  renderMetrics();
  renderExpenses();
  renderIncome();
  renderBars(els.expensesByTag, state.reports.expensesByTag);
  renderBars(els.incomesByTag, state.reports.incomesByTag);
  renderCashflow();
}

function renderMetrics() {
  els.metrics.income.textContent = money.format(state.reports.totals.incomes);
  els.metrics.expenses.textContent = money.format(state.reports.totals.expenses);
  els.metrics.net.textContent = money.format(state.reports.totals.net);
  els.metrics.unverified.textContent = state.reports.totals.unverifiedExpenses;
}

function renderExpenses() {
  const filtered = state.expenses.filter((expense) => {
    if (state.expenseFilter === "verified") return expense.verified;
    if (state.expenseFilter === "unverified") return !expense.verified;
    return true;
  });

  if (!filtered.length) {
    els.expenseList.innerHTML = `<div class="empty">No expenses match this view.</div>`;
    return;
  }

  els.expenseList.innerHTML = filtered.map(renderExpenseRow).join("");
}

function renderExpenseRow(expense) {
  return `
    <article class="record">
      <div>
        <div class="record-title">
          <strong>${money.format(expense.amount)}</strong>
          <span>${escapeHtml(expense.date)}</span>
          <span class="${expense.verified ? "verified" : "unverified"}">
            ${expense.verified ? "Verified" : "Needs verification"}
          </span>
        </div>
        <div class="record-meta">${escapeHtml(expense.description || "No description")} ${expense.account ? `- ${escapeHtml(expense.account)}` : ""}</div>
        <div class="tags">${expense.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="record-actions">
        <button class="verify-button" type="button" data-verify="${expense.id}" data-value="${!expense.verified}">
          ${expense.verified ? "Unverify" : "Verify"}
        </button>
        <button class="delete-button" type="button" aria-label="Delete expense" data-delete-expense="${expense.id}">x</button>
      </div>
    </article>
  `;
}

function renderIncome() {
  if (!state.incomes.length) {
    els.incomeList.innerHTML = `<div class="empty">No income recorded yet.</div>`;
    return;
  }

  els.incomeList.innerHTML = state.incomes.map((income) => `
    <article class="record compact-row">
      <div>
        <div class="record-title">
          <strong>${money.format(income.amount)}</strong>
          <span>${escapeHtml(income.date)}</span>
        </div>
        <div class="record-meta">${escapeHtml(income.description || "No description")} ${income.account ? `- ${escapeHtml(income.account)}` : ""}</div>
        <div class="tags">${income.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="record-actions">
        <button class="delete-button" type="button" aria-label="Delete income" data-delete-income="${income.id}">x</button>
      </div>
    </article>
  `).join("");
}

function renderBars(container, rows) {
  if (!rows.length) {
    container.innerHTML = `<div class="empty">No data yet.</div>`;
    return;
  }

  const max = Math.max(...rows.map((row) => row.total), 1);
  container.innerHTML = rows.map((row) => `
    <div class="bar-row">
      <div class="bar-label">
        <span>${escapeHtml(row.tag)}</span>
        <strong>${money.format(row.total)}</strong>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width: ${(row.total / max) * 100}%"></div></div>
    </div>
  `).join("");
}

function renderCashflow() {
  const rows = state.reports.cashflowByMonth;
  if (!rows.length) {
    els.monthlyCashflow.innerHTML = `<div class="empty">No monthly data yet.</div>`;
    return;
  }

  els.monthlyCashflow.innerHTML = rows.map((row) => `
    <div class="month-row">
      <div class="month-label">
        <strong>${escapeHtml(row.month)}</strong>
        <span>Net ${money.format(row.net)}</span>
      </div>
      <div class="month-values">
        <span>Income ${money.format(row.income)}</span>
        <span>Expenses ${money.format(row.expenses)}</span>
        <span>Net ${money.format(row.net)}</span>
      </div>
    </div>
  `).join("");
}

function setEntryType(type) {
  state.entryType = type;
  els.typeInput.value = type;
  els.submitButton.textContent = type === "expenses" ? "Add expense" : "Add income";
  els.verifiedRow.style.display = type === "expenses" ? "grid" : "none";

  els.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.entryType === type);
  });
}

async function submitEntry(event) {
  event.preventDefault();
  const form = new FormData(els.form);
  const type = form.get("type");
  const payload = {
    amount: Number(form.get("amount")),
    date: form.get("date"),
    tags: String(form.get("tags")).split(",").map((tag) => tag.trim()).filter(Boolean),
    description: form.get("description"),
    account: form.get("account"),
    verified: form.get("verified") === "on",
  };

  try {
    setStatus("Saving");
    await api(`/api/${type}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    els.form.reset();
    els.form.elements.date.value = new Date().toISOString().slice(0, 10);
    await loadData();
  } catch (error) {
    setStatus(error.message);
  }
}

async function handleListClick(event) {
  const verifyButton = event.target.closest("[data-verify]");
  const deleteExpenseButton = event.target.closest("[data-delete-expense]");
  const deleteIncomeButton = event.target.closest("[data-delete-income]");

  try {
    if (verifyButton) {
      setStatus("Saving");
      await api(`/api/expenses/${verifyButton.dataset.verify}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: verifyButton.dataset.value === "true" }),
      });
      await loadData();
    }

    if (deleteExpenseButton) {
      setStatus("Deleting");
      await api(`/api/expenses/${deleteExpenseButton.dataset.deleteExpense}`, { method: "DELETE" });
      await loadData();
    }

    if (deleteIncomeButton) {
      setStatus("Deleting");
      await api(`/api/incomes/${deleteIncomeButton.dataset.deleteIncome}`, { method: "DELETE" });
      await loadData();
    }
  } catch (error) {
    setStatus(error.message);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setEntryType(tab.dataset.entryType));
});

els.form.addEventListener("submit", submitEntry);
els.expenseFilter.addEventListener("change", (event) => {
  state.expenseFilter = event.target.value;
  renderExpenses();
});
els.expenseList.addEventListener("click", handleListClick);
els.incomeList.addEventListener("click", handleListClick);

els.form.elements.date.value = new Date().toISOString().slice(0, 10);
setEntryType("expenses");
loadData();
