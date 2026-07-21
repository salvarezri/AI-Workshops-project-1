const state = {
  expenses: [],
  incomes: [],
  reports: null,
  entryType: "expenses",
  expenseFilter: "all",
  incomeFilter: "all",
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
  incomeFilter: document.querySelector("#income-filter"),
  incomeAuditList: document.querySelector("#income-audit-list"),
  metrics: {
    income: document.querySelector("#metric-income"),
    expenses: document.querySelector("#metric-expenses"),
    net: document.querySelector("#metric-net"),
    unverified: document.querySelector("#metric-unverified"),
  },
  expensesByTag: document.querySelector("#expenses-by-tag"),
  incomesByTag: document.querySelector("#incomes-by-tag"),
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
  populateTagFilter();
  render();
  setStatus("Ready");
}

function render() {
  renderMetrics();
  renderExpenses();
  renderIncome();
  renderAuditIncomes();
  renderExpensesByTag();
  renderIncomesByTag();
  renderCashflowChart();
  renderPieChart();
}

function renderMetrics() {
  els.metrics.income.textContent = money.format(state.reports.totals.incomes);
  els.metrics.expenses.textContent = money.format(state.reports.totals.expenses);
  els.metrics.net.textContent = money.format(state.reports.totals.net);
  els.metrics.unverified.textContent = state.reports.totals.unverifiedExpenses;
}

function getStartOfWeek(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTagStyle(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `background-color: hsl(${h}, 65%, 85%); color: hsl(${h}, 65%, 25%);`;
}

function renderGroupedList(items, rowRenderer, emptyMessage) {
  if (!items.length) {
    return `<div class="empty">${emptyMessage}</div>`;
  }

  // Sort descending by date
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  let lastMonth = "";
  let lastWeek = "";
  let lastDay = "";
  let html = "";

  for (const item of sorted) {
    const dateStr = item.date;
    const month = dateStr.slice(0, 7);
    const week = getStartOfWeek(dateStr);
    const day = dateStr;

    if (month !== lastMonth) {
      const d = new Date(dateStr + "T12:00:00");
      const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      html += `<div class="list-header-month">📅 ${monthName}</div>`;
      lastMonth = month;
      lastWeek = "";
      lastDay = "";
    }

    if (week !== lastWeek) {
      const d = new Date(week + "T12:00:00");
      const weekStartStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endOfWeek = new Date(d.setDate(d.getDate() + 6));
      const weekEndStr = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      html += `<div class="list-header-week">🗓️ Week of ${weekStartStr} - ${weekEndStr}</div>`;
      lastWeek = week;
      lastDay = "";
    }

    if (day !== lastDay) {
      const d = new Date(dateStr + "T12:00:00");
      const dayName = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      html += `<div class="list-header-day">📌 ${dayName}</div>`;
      lastDay = day;
    }

    html += rowRenderer(item);
  }

  return html;
}

function renderExpenses() {
  const filtered = state.expenses.filter((expense) => {
    if (state.expenseFilter === "verified") return expense.verified;
    if (state.expenseFilter === "unverified") return !expense.verified;
    return true;
  });

  els.expenseList.innerHTML = renderGroupedList(filtered, renderExpenseRow, "No expenses match this view.");
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
        <div class="tags">${expense.tags.map((tag) => `<span class="tag" style="${getTagStyle(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>
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

function renderAuditIncomes() {
  const filtered = state.incomes.filter((income) => {
    if (state.incomeFilter === "verified") return income.verified;
    if (state.incomeFilter === "unverified") return !income.verified;
    return true;
  });

  els.incomeAuditList.innerHTML = renderGroupedList(filtered, renderIncomeRow, "No incomes match this view.");
}

function renderIncomeRow(income) {
  return `
    <article class="record">
      <div>
        <div class="record-title">
          <strong>${money.format(income.amount)}</strong>
          <span>${escapeHtml(income.date)}</span>
          <span class="${income.verified ? "verified" : "unverified"}">
            ${income.verified ? "Verified" : "Needs verification"}
          </span>
        </div>
        <div class="record-meta">${escapeHtml(income.description || "No description")} ${income.account ? `- ${escapeHtml(income.account)}` : ""}</div>
        <div class="tags">${income.tags.map((tag) => `<span class="tag" style="${getTagStyle(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="record-actions">
        <button class="verify-button" type="button" data-verify-income="${income.id}" data-value="${!income.verified}">
          ${income.verified ? "Unverify" : "Verify"}
        </button>
        <button class="delete-button" type="button" aria-label="Delete income" data-delete-income="${income.id}">x</button>
      </div>
    </article>
  `;
}

function renderIncomeRowCompact(income) {
  return `
    <article class="record compact-row">
      <div>
        <div class="record-title">
          <strong>${money.format(income.amount)}</strong>
          <span>${escapeHtml(income.date)}</span>
        </div>
        <div class="record-meta">${escapeHtml(income.description || "No description")} ${income.account ? `- ${escapeHtml(income.account)}` : ""}</div>
        <div class="tags">${income.tags.map((tag) => `<span class="tag" style="${getTagStyle(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="record-actions">
        <button class="delete-button" type="button" aria-label="Delete income" data-delete-income="${income.id}">x</button>
      </div>
    </article>
  `;
}

function renderIncome() {
  els.incomeList.innerHTML = renderGroupedList(state.incomes, renderIncomeRowCompact, "No income recorded yet.");
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
        <span class="tag" style="${getTagStyle(row.tag)}">${escapeHtml(row.tag)}</span>
        <strong>${money.format(row.total)}</strong>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width: ${(row.total / max) * 100}%"></div></div>
    </div>
  `).join("");
}

function renderExpensesByTag() {
  const select = document.getElementById("expenses-tag-timeframe");
  const timeframe = select ? select.value : "monthly";

  const today = new Date();
  let startDate = new Date();
  
  if (timeframe === "weekly") {
    startDate = new Date(getStartOfWeek(today.toISOString().slice(0, 10)) + "T12:00:00");
  } else if (timeframe === "monthly") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (timeframe === "yearly") {
    startDate = new Date(today.getFullYear(), 0, 1);
  } else {
    startDate = new Date(0);
  }

  const startDateStr = startDate.toISOString().slice(0, 10);

  const tagTotals = {};
  state.expenses.forEach(exp => {
    if (exp.date >= startDateStr) {
      exp.tags.forEach(tag => {
        tagTotals[tag] = (tagTotals[tag] || 0) + exp.amount;
      });
    }
  });

  const rows = Object.keys(tagTotals)
    .map(tag => ({ tag, total: tagTotals[tag] }))
    .sort((a, b) => b.total - a.total);

  renderBars(els.expensesByTag, rows);
}

function renderIncomesByTag() {
  const select = document.getElementById("incomes-tag-timeframe");
  const timeframe = select ? select.value : "monthly";

  const today = new Date();
  let startDate = new Date();
  
  if (timeframe === "weekly") {
    startDate = new Date(getStartOfWeek(today.toISOString().slice(0, 10)) + "T12:00:00");
  } else if (timeframe === "monthly") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (timeframe === "yearly") {
    startDate = new Date(today.getFullYear(), 0, 1);
  } else {
    startDate = new Date(0);
  }

  const startDateStr = startDate.toISOString().slice(0, 10);

  const tagTotals = {};
  state.incomes.forEach(inc => {
    if (inc.date >= startDateStr) {
      inc.tags.forEach(tag => {
        tagTotals[tag] = (tagTotals[tag] || 0) + inc.amount;
      });
    }
  });

  const rows = Object.keys(tagTotals)
    .map(tag => ({ tag, total: tagTotals[tag] }))
    .sort((a, b) => b.total - a.total);

  renderBars(els.incomesByTag, rows);
}

let cashflowChartInstance = null;
let balanceChartInstance = null;
let pieChartInstance = null;

function populateTagFilter() {
  const allTags = new Set();
  state.expenses.forEach(exp => exp.tags.forEach(t => allTags.add(t)));
  state.incomes.forEach(inc => inc.tags.forEach(t => allTags.add(t)));

  const select = document.getElementById("cashflow-tag-filter");
  if (!select) return;
  const currentValue = select.value;

  let html = `<option value="all">All Tags</option>`;
  Array.from(allTags).sort().forEach(tag => {
    html += `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`;
  });
  select.innerHTML = html;

  if (Array.from(allTags).includes(currentValue)) {
    select.value = currentValue;
  } else {
    select.value = "all";
  }
}

function renderCashflowChart() {
  const canvas = document.getElementById("cashflow-chart");
  if (!canvas) return;

  const periodSelect = document.getElementById("cashflow-period");
  const tagSelect = document.getElementById("cashflow-tag-filter");
  const period = periodSelect ? periodSelect.value : "2";
  const selectedTag = tagSelect ? tagSelect.value : "all";

  const today = new Date();
  let startDate = new Date();
  
  if (period === "all") {
    let earliest = today.toISOString().slice(0, 10);
    [...state.expenses, ...state.incomes].forEach(t => {
      if (t.date < earliest) earliest = t.date;
    });
    startDate = new Date(earliest + "T12:00:00");
  } else {
    startDate.setMonth(today.getMonth() - parseInt(period));
  }
  const startDateStr = startDate.toISOString().slice(0, 10);

  let interval = "month";
  if (period === "1" || period === "2") {
    interval = "day";
  } else if (period === "3" || period === "6") {
    interval = "week";
  }

  const labels = [];
  const incomeData = [];
  const expenseData = [];
  const balanceData = [];

  let runningBalance = 0;
  state.incomes.forEach(inc => {
    if (inc.date < startDateStr) runningBalance += inc.amount;
  });
  state.expenses.forEach(exp => {
    if (exp.date < startDateStr) runningBalance -= exp.amount;
  });

  if (interval === "day") {
    let curr = new Date(startDate);
    while (curr <= today) {
      const dateStr = curr.toISOString().slice(0, 10);
      labels.push(dateStr);

      const dayIncomes = state.incomes.filter(inc => inc.date === dateStr && (selectedTag === "all" || inc.tags.includes(selectedTag)));
      const dayExpenses = state.expenses.filter(exp => exp.date === dateStr && (selectedTag === "all" || exp.tags.includes(selectedTag)));

      const incSum = dayIncomes.reduce((s, x) => s + x.amount, 0);
      const expSum = dayExpenses.reduce((s, x) => s + x.amount, 0);

      incomeData.push(incSum);
      expenseData.push(expSum);

      const allDayIncomes = state.incomes.filter(inc => inc.date === dateStr);
      const allDayExpenses = state.expenses.filter(exp => exp.date === dateStr);
      runningBalance += allDayIncomes.reduce((s, x) => s + x.amount, 0) - allDayExpenses.reduce((s, x) => s + x.amount, 0);
      balanceData.push(runningBalance);

      curr.setDate(curr.getDate() + 1);
    }
  } else if (interval === "week") {
    let curr = new Date(getStartOfWeek(startDateStr) + "T12:00:00");
    while (curr <= today) {
      const weekStartStr = curr.toISOString().slice(0, 10);
      const weekEnd = new Date(curr);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      labels.push(`Week of ${weekStartStr.slice(5)}`);

      const weekIncomes = state.incomes.filter(inc => inc.date >= weekStartStr && inc.date <= weekEndStr && (selectedTag === "all" || inc.tags.includes(selectedTag)));
      const weekExpenses = state.expenses.filter(exp => exp.date >= weekStartStr && exp.date <= weekEndStr && (selectedTag === "all" || exp.tags.includes(selectedTag)));

      const incSum = weekIncomes.reduce((s, x) => s + x.amount, 0);
      const expSum = weekExpenses.reduce((s, x) => s + x.amount, 0);

      incomeData.push(incSum);
      expenseData.push(expSum);

      const allWeekIncomes = state.incomes.filter(inc => inc.date >= weekStartStr && inc.date <= weekEndStr);
      const allWeekExpenses = state.expenses.filter(exp => exp.date >= weekStartStr && exp.date <= weekEndStr);
      runningBalance += allWeekIncomes.reduce((s, x) => s + x.amount, 0) - allWeekExpenses.reduce((s, x) => s + x.amount, 0);
      balanceData.push(runningBalance);

      curr.setDate(curr.getDate() + 7);
    }
  } else {
    let curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (curr <= today) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;

      labels.push(monthStr);

      const monthIncomes = state.incomes.filter(inc => inc.date.slice(0, 7) === monthStr && (selectedTag === "all" || inc.tags.includes(selectedTag)));
      const monthExpenses = state.expenses.filter(exp => exp.date.slice(0, 7) === monthStr && (selectedTag === "all" || exp.tags.includes(selectedTag)));

      const incSum = monthIncomes.reduce((s, x) => s + x.amount, 0);
      const expSum = monthExpenses.reduce((s, x) => s + x.amount, 0);

      incomeData.push(incSum);
      expenseData.push(expSum);

      const allMonthIncomes = state.incomes.filter(inc => inc.date.slice(0, 7) === monthStr);
      const allMonthExpenses = state.expenses.filter(exp => exp.date.slice(0, 7) === monthStr);
      runningBalance += allMonthIncomes.reduce((s, x) => s + x.amount, 0) - allMonthExpenses.reduce((s, x) => s + x.amount, 0);
      balanceData.push(runningBalance);

      curr.setMonth(curr.getMonth() + 1);
    }
  }

  const ctx = canvas.getContext("2d");
  if (cashflowChartInstance) {
    cashflowChartInstance.destroy();
  }

  cashflowChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Incomes",
          data: incomeData,
          borderColor: "#319795",
          backgroundColor: "rgba(49, 151, 149, 0.05)",
          tension: 0.1,
          fill: false
        },
        {
          label: "Expenses",
          data: expenseData,
          borderColor: "#e53e3e",
          backgroundColor: "rgba(229, 62, 62, 0.05)",
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          ticks: {
            callback: (v) => "$" + v.toLocaleString()
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: $${ctx.raw.toFixed(2)}`
          }
        }
      }
    }
  });

  const canvasBalance = document.getElementById("balance-chart");
  if (canvasBalance) {
    const ctxBalance = canvasBalance.getContext("2d");
    if (balanceChartInstance) {
      balanceChartInstance.destroy();
    }

    balanceChartInstance = new Chart(ctxBalance, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Running Balance",
            data: balanceData,
            borderColor: "#2d3748",
            backgroundColor: "rgba(45, 55, 72, 0.05)",
            tension: 0.1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (v) => "$" + v.toLocaleString()
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: $${ctx.raw.toFixed(2)}`
            }
          }
        }
      }
    });
  }
}

function renderPieChart() {
  const canvas = document.getElementById("expenses-pie-chart");
  if (!canvas) return;

  const timeframeSelect = document.getElementById("pie-timeframe");
  const timeframe = timeframeSelect ? timeframeSelect.value : "monthly";

  const today = new Date();
  let startDate = new Date();
  
  if (timeframe === "weekly") {
    startDate = new Date(getStartOfWeek(today.toISOString().slice(0, 10)) + "T12:00:00");
  } else if (timeframe === "monthly") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (timeframe === "yearly") {
    startDate = new Date(today.getFullYear(), 0, 1);
  } else {
    startDate = new Date(0);
  }

  const startDateStr = startDate.toISOString().slice(0, 10);

  const tagTotals = {};
  state.expenses.forEach(exp => {
    if (exp.date >= startDateStr) {
      exp.tags.forEach(tag => {
        tagTotals[tag] = (tagTotals[tag] || 0) + exp.amount;
      });
    }
  });

  const labels = Object.keys(tagTotals).sort((a, b) => tagTotals[b] - tagTotals[a]);
  const data = labels.map(tag => tagTotals[tag]);

  const backgroundColors = [];
  const borderColors = [];
  labels.forEach(tag => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    backgroundColors.push(`hsl(${h}, 65%, 80%)`);
    borderColors.push(`hsl(${h}, 65%, 45%)`);
  });

  const ctx = canvas.getContext("2d");
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  if (labels.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#a0aec0";
    ctx.textAlign = "center";
    ctx.fillText("No expenses recorded for this timeframe.", canvas.width / 2, canvas.height / 2);
    return;
  }

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 12,
            font: { size: 10 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function setEntryType(type) {
  state.entryType = type;
  els.typeInput.value = type;
  els.submitButton.textContent = type === "expenses" ? "Add expense" : "Add income";
  
  // Show verify checkbox for both expenses and incomes
  els.verifiedRow.style.display = "grid";
  const checkbox = els.verifiedRow.querySelector("input[name='verified']");
  if (checkbox && checkbox.nextSibling) {
    checkbox.nextSibling.textContent = type === "expenses" ? " Mark expense as already verified" : " Mark income as already verified";
  }

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
  const verifyIncomeButton = event.target.closest("[data-verify-income]");
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

    if (verifyIncomeButton) {
      setStatus("Saving");
      await api(`/api/incomes/${verifyIncomeButton.dataset.verifyIncome}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: verifyIncomeButton.dataset.value === "true" }),
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
els.incomeFilter.addEventListener("change", (event) => {
  state.incomeFilter = event.target.value;
  renderAuditIncomes();
});
els.expenseList.addEventListener("click", handleListClick);
els.incomeList.addEventListener("click", handleListClick);
els.incomeAuditList.addEventListener("click", handleListClick);

els.form.elements.date.value = new Date().toISOString().slice(0, 10);
setEntryType("expenses");
loadData();

// AI Assistant Features
const aiEls = {
  form: document.querySelector("#ai-form"),
  textInput: document.querySelector("#ai-text-input"),
  sendBtn: document.querySelector("#ai-send-btn"),
  micBtn: document.querySelector("#ai-mic-btn"),
  micIcon: document.querySelector("#mic-icon"),
  status: document.querySelector("#ai-status"),
};

let mediaRecorder = null;
let audioChunks = [];

function setAiStatus(text) {
  aiEls.status.textContent = text;
}

// Submit Natural Language prompt to Port 3001
async function submitAiText(event) {
  event.preventDefault();
  const text = aiEls.textInput.value.trim();
  if (!text) return;

  try {
    setAiStatus("AI is parsing transaction...");
    aiEls.sendBtn.disabled = true;

    // Call Port 3001 Parser
    const parserUrl = "http://localhost:3001/api/parse";
    const res = await fetch(parserUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to parse message with AI.");
    }

    const { transaction } = await res.json();
    setAiStatus(`AI resolved: ${transaction.type === "expenses" || transaction.type === "expense" ? "Expense" : "Income"} of $${transaction.amount}. Saving...`);

    // Prepare payload for local tracker (Port 3000)
    const resolvedType = (transaction.type === "expenses" || transaction.type === "expense") ? "expenses" : "incomes";
    const payload = {
      amount: Number(transaction.amount),
      date: transaction.date,
      tags: Array.isArray(transaction.tags) ? transaction.tags : [transaction.tags].filter(Boolean),
      description: transaction.description || "Parsed by AI",
      account: transaction.account || "Cash",
      verified: false
    };

    // Post to Port 3000 local tracker endpoints
    const apiRes = await fetch(`/api/${resolvedType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const apiErr = await apiRes.json();
      throw new Error(apiErr.error || "Failed to save the transaction to tracker database.");
    }

    setAiStatus("Transaction added successfully!");
    aiEls.textInput.value = "";
    await loadData();
  } catch (error) {
    console.error("[AI Assistant Error]", error);
    setAiStatus(`Error: ${error.message}`);
  } finally {
    aiEls.sendBtn.disabled = false;
  }
}

// Audio Recording Logic (utilizing Port 3002 STT)
async function toggleVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    // Stop recording
    mediaRecorder.stop();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Clean up audio tracks
      stream.getTracks().forEach(track => track.stop());

      try {
        setAiStatus("Sending voice to Speech-to-Text service...");
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        // Send raw audio buffer to Port 3002 Transcribe Endpoint
        const sttRes = await fetch("http://localhost:3002/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "audio/webm" },
          body: audioBlob
        });

        if (!sttRes.ok) {
          const sttErr = await sttRes.json();
          throw new Error(sttErr.error || "Transcription failed.");
        }

        const data = await sttRes.json();
        if (data.text) {
          aiEls.textInput.value = data.text;
          setAiStatus("Voice transcribed successfully!");
        } else {
          setAiStatus("Could not transcribe voice. Please try again.");
        }

      } catch (error) {
        console.error("[STT Error]", error);
        setAiStatus(`Transcription error: ${error.message}`);
      } finally {
        // Reset recording UI button
        aiEls.micBtn.classList.remove("mic-recording");
        aiEls.micIcon.textContent = "🎙️";
      }
    };

    // Start recording
    mediaRecorder.start();
    aiEls.micBtn.classList.add("mic-recording");
    aiEls.micIcon.textContent = "🟥";
    setAiStatus("Recording... Click mic button again to stop.");

  } catch (error) {
    console.error("[Microphone Access Error]", error);
    setAiStatus(`Microphone error: ${error.message}`);
    aiEls.micBtn.classList.remove("mic-recording");
    aiEls.micIcon.textContent = "🎙️";
  }
}

// Add AI Listeners
if (aiEls.form) {
  aiEls.form.addEventListener("submit", submitAiText);
}
if (aiEls.micBtn) {
  aiEls.micBtn.addEventListener("click", toggleVoiceRecording);
}

// Bind chart filter changes
const cashflowPeriodEl = document.getElementById("cashflow-period");
if (cashflowPeriodEl) {
  cashflowPeriodEl.addEventListener("change", renderCashflowChart);
}
const cashflowTagFilterEl = document.getElementById("cashflow-tag-filter");
if (cashflowTagFilterEl) {
  cashflowTagFilterEl.addEventListener("change", renderCashflowChart);
}
const pieTimeframeEl = document.getElementById("pie-timeframe");
if (pieTimeframeEl) {
  pieTimeframeEl.addEventListener("change", renderPieChart);
}
const expensesTagTimeframeEl = document.getElementById("expenses-tag-timeframe");
if (expensesTagTimeframeEl) {
  expensesTagTimeframeEl.addEventListener("change", renderExpensesByTag);
}
const incomesTagTimeframeEl = document.getElementById("incomes-tag-timeframe");
if (incomesTagTimeframeEl) {
  incomesTagTimeframeEl.addEventListener("change", renderIncomesByTag);
}
