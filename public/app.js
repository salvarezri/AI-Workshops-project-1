const translations = {
  en: {
    appTitle: "Financial Tracker",
    prototypeBadge: "Local JSON prototype",
    statusReady: "Ready",
    statusSaving: "Saving",
    statusDeleting: "Deleting",
    totalIncome: "Total income",
    totalExpenses: "Total expenses",
    netBalance: "Net balance",
    unverifiedExpenses: "Unverified expenses",
    tabExpense: "Expense",
    tabIncome: "Income",
    labelAmount: "Amount",
    labelDate: "Date",
    labelTags: "Tags",
    labelDescription: "Description",
    labelAccount: "Account",
    markExpenseVerified: "Mark expense as already verified",
    markIncomeVerified: "Mark income as already verified",
    addExpenseBtn: "Add expense",
    addIncomeBtn: "Add income",
    aiAssistantTitle: "AI Assistant",
    aiAssistantSub: "Add with Natural Language",
    aiPlaceholder: "e.g., Yesterday I spent 45 dollars on groceries with checking account",
    aiSendBtn: "Send to AI",
    verifyAuditEyebrow: "Verify and audit",
    expensesTitle: "Expenses",
    incomesTitle: "Incomes",
    filterAllExpenses: "All expenses",
    filterUnverifiedOnly: "Unverified only",
    filterVerifiedOnly: "Verified only",
    filterAllIncomes: "All incomes",
    reportsEyebrow: "Reports",
    reportsTitle: "Spending and Income Analysis",
    expensesByTagTitle: "Expenses by tag",
    incomeByTagTitle: "Income by tag",
    expensesPieTitle: "Expenses Tag Breakdown",
    lastUpdatesTitle: "Last updates",
    historicalCashflowTitle: "Historical Cashflow",
    incomeAndExpenses: "Income & Expenses",
    runningBalance: "Running Balance",
    allTags: "All Tags",
    startDate: "Start Date:",
    endDate: "End Date:",
    presetThisMonth: "This Month",
    presetThisYear: "This Year",
    presetAllTime: "All Time",
    needsVerification: "Needs verification",
    verified: "Verified",
    btnVerify: "Verify",
    btnUnverify: "Unverify",
    btnCancel: "Cancel",
    btnSave: "Save changes",
    editModalTitle: "Edit Transaction",
    noData: "No data yet.",
    noExpensesMatch: "No expenses match this view.",
    noIncomesMatch: "No incomes match this view.",
    noUpdatesYet: "No recent updates yet.",
    noExpensesTimeframe: "No expenses recorded for this date range."
  },
  es: {
    appTitle: "Control Financiero",
    prototypeBadge: "Prototipo JSON Local",
    statusReady: "Listo",
    statusSaving: "Guardando",
    statusDeleting: "Eliminando",
    totalIncome: "Ingresos totales",
    totalExpenses: "Gastos totales",
    netBalance: "Balance neto",
    unverifiedExpenses: "Gastos sin verificar",
    tabExpense: "Gasto",
    tabIncome: "Ingreso",
    labelAmount: "Monto",
    labelDate: "Fecha",
    labelTags: "Etiquetas",
    labelDescription: "Descripción",
    labelAccount: "Cuenta",
    markExpenseVerified: "Marcar gasto como ya verificado",
    markIncomeVerified: "Marcar ingreso como ya verificado",
    addExpenseBtn: "Agregar gasto",
    addIncomeBtn: "Agregar ingreso",
    aiAssistantTitle: "Asistente IA",
    aiAssistantSub: "Agregar con Lenguaje Natural",
    aiPlaceholder: "Ej: Ayer gasté 45000 pesos en mercado con Bancolombia",
    aiSendBtn: "Enviar a la IA",
    verifyAuditEyebrow: "Verificar y auditar",
    expensesTitle: "Gastos",
    incomesTitle: "Ingresos",
    filterAllExpenses: "Todos los gastos",
    filterUnverifiedOnly: "Solo sin verificar",
    filterVerifiedOnly: "Solo verificados",
    filterAllIncomes: "Todos los ingresos",
    reportsEyebrow: "Reportes",
    reportsTitle: "Análisis de Gastos e Ingresos",
    expensesByTagTitle: "Gastos por etiqueta",
    incomeByTagTitle: "Ingresos por etiqueta",
    expensesPieTitle: "Distribución de Gastos por Etiqueta",
    lastUpdatesTitle: "Últimas actualizaciones",
    historicalCashflowTitle: "Flujo de Caja Histórico",
    incomeAndExpenses: "Ingresos y Gastos",
    runningBalance: "Balance Acumulado",
    allTags: "Todas las etiquetas",
    startDate: "Fecha Inicio:",
    endDate: "Fecha Fin:",
    presetThisMonth: "Este Mes",
    presetThisYear: "Este Año",
    presetAllTime: "Todo el Histórico",
    needsVerification: "Requiere verificación",
    verified: "Verificado",
    btnVerify: "Verificar",
    btnUnverify: "Desmarcar",
    btnCancel: "Cancelar",
    btnSave: "Guardar cambios",
    editModalTitle: "Modificar Transacción",
    noData: "Sin datos aún.",
    noExpensesMatch: "No hay gastos que coincidan.",
    noIncomesMatch: "No hay ingresos que coincidan.",
    noUpdatesYet: "No hay actualizaciones recientes aún.",
    noExpensesTimeframe: "No hay gastos registrados en este rango de fechas."
  }
};

const state = {
  expenses: [],
  incomes: [],
  reports: null,
  entryType: "expenses",
  expenseFilter: "all",
  incomeFilter: "all",
  lang: "es", // Default language Spanish
};

let moneyFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const money = {
  format(val) {
    return moneyFormatter.format(val);
  }
};

function updateMoneyFormatter() {
  if (state.lang === "es") {
    moneyFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
  } else {
    moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  }
}

const els = {
  form: document.querySelector("#entry-form"),
  submitButton: document.querySelector("#submit-button"),
  saveStatus: document.querySelector("#save-status"),
  tabs: document.querySelectorAll("[data-entry-type]"),
  typeInput: document.querySelector("input[name='type']"),
  verifiedRow: document.querySelector("#verified-row"),
  expenseFilter: document.querySelector("#expense-filter"),
  expenseList: document.querySelector("#expense-list"),
  incomeList: document.querySelector("#recent-updates-list"),
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
  editModal: document.querySelector("#edit-modal"),
  editForm: document.querySelector("#edit-form"),
  editModalClose: document.querySelector("#edit-modal-close"),
  editModalCancel: document.querySelector("#edit-modal-cancel"),
};

function setStatus(textKey) {
  const dict = translations[state.lang] || translations.en;
  els.saveStatus.textContent = dict[textKey] || textKey;
}

function applyTranslations() {
  const lang = state.lang;
  const dict = translations[lang] || translations.en;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      if (el.tagName === "INPUT" && el.type === "text") {
        // Leave placeholder intact or translate
      } else if (el.tagName === "TEXTAREA") {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  updateMoneyFormatter();
  setEntryType(state.entryType);
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

function initReportDates() {
  const startDateInput = document.getElementById("report-start-date");
  const endDateInput = document.getElementById("report-end-date");
  if (!startDateInput || !endDateInput) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  if (!endDateInput.value) {
    endDateInput.value = todayStr;
  }

  if (!startDateInput.value) {
    let earliest = todayStr;
    [...state.expenses, ...state.incomes].forEach((t) => {
      if (t.date && t.date < earliest) earliest = t.date;
    });
    startDateInput.value = earliest;
  }
}

function getReportDateRange() {
  const startDateInput = document.getElementById("report-start-date");
  const endDateInput = document.getElementById("report-end-date");
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const startStr = (startDateInput && startDateInput.value) ? startDateInput.value : "2000-01-01";
  const endStr = (endDateInput && endDateInput.value) ? endDateInput.value : todayStr;

  return { startStr, endStr };
}

async function loadData() {
  setStatus("statusSaving");
  const [expenses, incomes, reports] = await Promise.all([
    api("/api/expenses"),
    api("/api/incomes"),
    api("/api/reports"),
  ]);

  state.expenses = expenses;
  state.incomes = incomes;
  state.reports = reports;

  initReportDates();
  populateTagFilter();
  applyTranslations();
  render();
  setStatus("statusReady");
}

function render() {
  renderMetrics();
  renderExpenses();
  renderLastUpdates();
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

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  let lastMonth = "";
  let lastWeek = "";
  let lastDay = "";
  let html = "";

  const loc = state.lang === "es" ? "es-ES" : "en-US";

  for (const item of sorted) {
    const dateStr = item.date;
    const month = dateStr.slice(0, 7);
    const week = getStartOfWeek(dateStr);
    const day = dateStr;

    if (month !== lastMonth) {
      const d = new Date(dateStr + "T12:00:00");
      const monthName = d.toLocaleDateString(loc, { month: "long", year: "numeric" });
      html += `<div class="list-header-month">📅 ${monthName}</div>`;
      lastMonth = month;
      lastWeek = "";
      lastDay = "";
    }

    if (week !== lastWeek) {
      const d = new Date(week + "T12:00:00");
      const weekStartStr = d.toLocaleDateString(loc, { month: "short", day: "numeric" });
      const endOfWeek = new Date(d.setDate(d.getDate() + 6));
      const weekEndStr = endOfWeek.toLocaleDateString(loc, { month: "short", day: "numeric" });
      html += `<div class="list-header-week">🗓️ ${weekStartStr} - ${weekEndStr}</div>`;
      lastWeek = week;
      lastDay = "";
    }

    if (day !== lastDay) {
      const d = new Date(dateStr + "T12:00:00");
      const dayName = d.toLocaleDateString(loc, { weekday: "long", month: "short", day: "numeric" });
      html += `<div class="list-header-day">📌 ${dayName}</div>`;
      lastDay = day;
    }

    html += rowRenderer(item);
  }

  return html;
}

function renderExpenses() {
  const dict = translations[state.lang] || translations.en;
  const filtered = state.expenses.filter((expense) => {
    if (state.expenseFilter === "verified") return expense.verified;
    if (state.expenseFilter === "unverified") return !expense.verified;
    return true;
  });

  els.expenseList.innerHTML = renderGroupedList(filtered, renderExpenseRow, dict.noExpensesMatch);
}

function renderExpenseRow(expense) {
  const dict = translations[state.lang] || translations.en;
  return `
    <article class="record">
      <div>
        <div class="record-title">
          <strong>${money.format(expense.amount)}</strong>
          <span>${escapeHtml(expense.date)}</span>
          <span class="${expense.verified ? "verified" : "unverified"}">
            ${expense.verified ? dict.verified : dict.needsVerification}
          </span>
        </div>
        <div class="record-meta">${escapeHtml(expense.description || "")} ${expense.account ? `- ${escapeHtml(expense.account)}` : ""}</div>
        <div class="tags">${expense.tags.map((tag) => `<span class="tag" style="${getTagStyle(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="record-actions">
        <button class="edit-button" type="button" aria-label="Edit expense" data-edit="${expense.id}" data-type="expenses">✏️</button>
        <button class="verify-button" type="button" data-verify="${expense.id}" data-value="${!expense.verified}">
          ${expense.verified ? dict.btnUnverify : dict.btnVerify}
        </button>
        <button class="delete-button" type="button" aria-label="Delete expense" data-delete-expense="${expense.id}">x</button>
      </div>
    </article>
  `;
}

function renderAuditIncomes() {
  const dict = translations[state.lang] || translations.en;
  const filtered = state.incomes.filter((income) => {
    if (state.incomeFilter === "verified") return income.verified;
    if (state.incomeFilter === "unverified") return !income.verified;
    return true;
  });

  els.incomeAuditList.innerHTML = renderGroupedList(filtered, renderIncomeRow, dict.noIncomesMatch);
}

function renderIncomeRow(income) {
  const dict = translations[state.lang] || translations.en;
  return `
    <article class="record">
      <div>
        <div class="record-title">
          <strong>${money.format(income.amount)}</strong>
          <span>${escapeHtml(income.date)}</span>
          <span class="${income.verified ? "verified" : "unverified"}">
            ${income.verified ? dict.verified : dict.needsVerification}
          </span>
        </div>
        <div class="record-meta">${escapeHtml(income.description || "")} ${income.account ? `- ${escapeHtml(income.account)}` : ""}</div>
        <div class="tags">${income.tags.map((tag) => `<span class="tag" style="${getTagStyle(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <div class="record-actions">
        <button class="edit-button" type="button" aria-label="Edit income" data-edit="${income.id}" data-type="incomes">✏️</button>
        <button class="verify-button" type="button" data-verify-income="${income.id}" data-value="${!income.verified}">
          ${income.verified ? dict.btnUnverify : dict.btnVerify}
        </button>
        <button class="delete-button" type="button" aria-label="Delete income" data-delete-income="${income.id}">x</button>
      </div>
    </article>
  `;
}

// Render Last Updates (Incomes and Outcomes sorted descending by updatedAt)
function renderLastUpdates() {
  const { startStr, endStr } = getReportDateRange();
  const dict = translations[state.lang] || translations.en;

  const combined = [
    ...state.expenses.filter(e => e.date >= startStr && e.date <= endStr).map(e => ({ ...e, _type: "expenses" })),
    ...state.incomes.filter(i => i.date >= startStr && i.date <= endStr).map(i => ({ ...i, _type: "incomes" }))
  ];

  const getTimestamp = (item) => item.updatedAt || item.createdAt || `${item.date}T12:00:00.000Z`;
  combined.sort((a, b) => getTimestamp(b).localeCompare(getTimestamp(a)));

  if (!combined.length) {
    els.incomeList.innerHTML = `<div class="empty">${dict.noUpdatesYet}</div>`;
    return;
  }

  els.incomeList.innerHTML = combined.slice(0, 30).map(item => {
    const isExpense = item._type === "expenses";
    const badgeClass = isExpense ? "expense" : "income";
    const badgeText = isExpense ? dict.tabExpense : dict.tabIncome;

    return `
      <article class="record compact-row">
        <div>
          <div class="record-title">
            <span class="type-badge ${badgeClass}">${badgeText}</span>
            <strong>${money.format(item.amount)}</strong>
            <span>${escapeHtml(item.date)}</span>
          </div>
          <div class="record-meta">${escapeHtml(item.description || "")} ${item.account ? `- ${escapeHtml(item.account)}` : ""}</div>
          <div class="tags">${item.tags.map((tag) => `<span class="tag" style="${getTagStyle(tag)}">${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
        <div class="record-actions">
          <button class="edit-button" type="button" aria-label="Edit record" data-edit="${item.id}" data-type="${item._type}">✏️</button>
          <button class="delete-button" type="button" aria-label="Delete record" data-delete-${isExpense ? "expense" : "income"}="${item.id}">x</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderBars(container, rows) {
  const dict = translations[state.lang] || translations.en;
  if (!rows.length) {
    container.innerHTML = `<div class="empty">${dict.noData}</div>`;
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
  const { startStr, endStr } = getReportDateRange();

  const tagTotals = {};
  state.expenses.forEach(exp => {
    if (exp.date >= startStr && exp.date <= endStr) {
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
  const { startStr, endStr } = getReportDateRange();

  const tagTotals = {};
  state.incomes.forEach(inc => {
    if (inc.date >= startStr && inc.date <= endStr) {
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
  const dict = translations[state.lang] || translations.en;
  const allTags = new Set();
  state.expenses.forEach(exp => exp.tags.forEach(t => allTags.add(t)));
  state.incomes.forEach(inc => inc.tags.forEach(t => allTags.add(t)));

  const select = document.getElementById("cashflow-tag-filter");
  if (!select) return;
  const currentValue = select.value;

  let html = `<option value="all">${dict.allTags}</option>`;
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

  const tagSelect = document.getElementById("cashflow-tag-filter");
  const selectedTag = tagSelect ? tagSelect.value : "all";
  const { startStr: startDateStr, endStr: endDateStr } = getReportDateRange();
  const dict = translations[state.lang] || translations.en;

  const startDate = new Date(startDateStr + "T12:00:00");
  const endDate = new Date(endDateStr + "T12:00:00");

  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let interval = "month";
  if (diffDays <= 60) {
    interval = "day";
  } else if (diffDays <= 180) {
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
    while (curr <= endDate) {
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
    while (curr <= endDate) {
      const weekStartStr = curr.toISOString().slice(0, 10);
      const weekEnd = new Date(curr);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      labels.push(`${weekStartStr.slice(5)}`);

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
    while (curr <= endDate) {
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
          label: dict.tabIncome || "Incomes",
          data: incomeData,
          borderColor: "#319795",
          backgroundColor: "rgba(49, 151, 149, 0.05)",
          tension: 0.1,
          fill: false
        },
        {
          label: dict.tabExpense || "Expenses",
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
            callback: (v) => money.format(v)
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${money.format(ctx.raw)}`
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
            label: dict.runningBalance || "Running Balance",
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
              callback: (v) => money.format(v)
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${money.format(ctx.raw)}`
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

  const { startStr, endStr } = getReportDateRange();
  const dict = translations[state.lang] || translations.en;

  const tagTotals = {};
  state.expenses.forEach(exp => {
    if (exp.date >= startStr && exp.date <= endStr) {
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
    ctx.fillText(dict.noExpensesTimeframe, canvas.width / 2, canvas.height / 2);
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
              return `${context.label}: ${money.format(value)} (${percentage}%)`;
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
  const dict = translations[state.lang] || translations.en;
  els.submitButton.textContent = type === "expenses" ? dict.addExpenseBtn : dict.addIncomeBtn;
  
  els.verifiedRow.style.display = "grid";
  const labelText = document.getElementById("verified-label-text");
  if (labelText) {
    labelText.textContent = type === "expenses" ? dict.markExpenseVerified : dict.markIncomeVerified;
  }

  els.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.entryType === type);
  });
}

// Flash Animation for Panel List
function triggerPanelFlash(type) {
  const panelId = type === "expenses" ? "#expense-list" : "#income-audit-list";
  const targetPanel = document.querySelector(panelId)?.closest(".panel");
  if (targetPanel) {
    targetPanel.classList.remove("flash-updated");
    void targetPanel.offsetWidth; // Trigger reflow
    targetPanel.classList.add("flash-updated");
    setTimeout(() => targetPanel.classList.remove("flash-updated"), 2300);
  }
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
    setStatus("statusSaving");
    await api(`/api/${type}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    els.form.reset();
    els.form.elements.date.value = new Date().toISOString().slice(0, 10);
    await loadData();
    triggerPanelFlash(type);
  } catch (error) {
    setStatus(error.message);
  }
}

// Edit Modal Handler
function openEditModal(id, type) {
  const collection = state[type] || [];
  const record = collection.find(item => item.id === id);
  if (!record) return;

  document.querySelector("#edit-id").value = record.id;
  document.querySelector("#edit-type").value = type;
  document.querySelector("#edit-amount").value = record.amount;
  document.querySelector("#edit-date").value = record.date;
  document.querySelector("#edit-tags").value = record.tags.join(", ");
  document.querySelector("#edit-description").value = record.description || "";
  document.querySelector("#edit-account").value = record.account || "";
  document.querySelector("#edit-verified").checked = Boolean(record.verified);

  els.editModal.classList.add("active");
}

function closeEditModal() {
  els.editModal.classList.remove("active");
}

async function submitEditForm(event) {
  event.preventDefault();
  const form = new FormData(els.editForm);
  const id = form.get("id");
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
    setStatus("statusSaving");
    await api(`/api/${type}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    closeEditModal();
    await loadData();
    triggerPanelFlash(type);
  } catch (error) {
    setStatus(error.message);
  }
}

async function handleListClick(event) {
  const editButton = event.target.closest("[data-edit]");
  const verifyButton = event.target.closest("[data-verify]");
  const verifyIncomeButton = event.target.closest("[data-verify-income]");
  const deleteExpenseButton = event.target.closest("[data-delete-expense]");
  const deleteIncomeButton = event.target.closest("[data-delete-income]");

  try {
    if (editButton) {
      openEditModal(editButton.dataset.edit, editButton.dataset.type);
      return;
    }

    if (verifyButton) {
      setStatus("statusSaving");
      await api(`/api/expenses/${verifyButton.dataset.verify}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: verifyButton.dataset.value === "true" }),
      });
      await loadData();
    }

    if (verifyIncomeButton) {
      setStatus("statusSaving");
      await api(`/api/incomes/${verifyIncomeButton.dataset.verifyIncome}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: verifyIncomeButton.dataset.value === "true" }),
      });
      await loadData();
    }

    if (deleteExpenseButton) {
      setStatus("statusDeleting");
      await api(`/api/expenses/${deleteExpenseButton.dataset.deleteExpense}`, { method: "DELETE" });
      await loadData();
    }

    if (deleteIncomeButton) {
      setStatus("statusDeleting");
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

// Event bindings
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

// Edit Modal events
if (els.editForm) els.editForm.addEventListener("submit", submitEditForm);
if (els.editModalClose) els.editModalClose.addEventListener("click", closeEditModal);
if (els.editModalCancel) els.editModalCancel.addEventListener("click", closeEditModal);
if (els.editModal) {
  els.editModal.addEventListener("click", (e) => {
    if (e.target === els.editModal) closeEditModal();
  });
}

els.form.elements.date.value = new Date().toISOString().slice(0, 10);

// Language Switcher binding
const langToggleEl = document.getElementById("lang-toggle");
if (langToggleEl) {
  langToggleEl.addEventListener("change", (e) => {
    state.lang = e.target.value;
    applyTranslations();
    populateTagFilter();
    render();
  });
}

// Report Date Picker bindings
const reportStartDateEl = document.getElementById("report-start-date");
const reportEndDateEl = document.getElementById("report-end-date");

if (reportStartDateEl) {
  reportStartDateEl.addEventListener("change", () => render());
}
if (reportEndDateEl) {
  reportEndDateEl.addEventListener("change", () => render());
}

// Preset Buttons
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = btn.dataset.preset;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    if (preset === "month") {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      reportStartDateEl.value = `${year}-${month}-01`;
      reportEndDateEl.value = todayStr;
    } else if (preset === "year") {
      reportStartDateEl.value = `${today.getFullYear()}-01-01`;
      reportEndDateEl.value = todayStr;
    } else if (preset === "all") {
      let earliest = todayStr;
      [...state.expenses, ...state.incomes].forEach((t) => {
        if (t.date && t.date < earliest) earliest = t.date;
      });
      reportStartDateEl.value = earliest;
      reportEndDateEl.value = todayStr;
    }
    render();
  });
});

const cashflowTagFilterEl = document.getElementById("cashflow-tag-filter");
if (cashflowTagFilterEl) {
  cashflowTagFilterEl.addEventListener("change", renderCashflowChart);
}

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

async function submitAiText(event) {
  event.preventDefault();
  const text = aiEls.textInput.value.trim();
  if (!text) return;

  try {
    setAiStatus("AI parsing...");
    aiEls.sendBtn.disabled = true;

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
    setAiStatus(`AI resolved transaction. Saving...`);

    const resolvedType = (transaction.type === "expenses" || transaction.type === "expense") ? "expenses" : "incomes";
    const payload = {
      amount: Number(transaction.amount),
      date: transaction.date,
      tags: Array.isArray(transaction.tags) ? transaction.tags : [transaction.tags].filter(Boolean),
      description: transaction.description || "Parsed by AI",
      account: transaction.account || (state.lang === "es" ? "Efectivo" : "Cash"),
      verified: false
    };

    const apiRes = await fetch(`/api/${resolvedType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const apiErr = await apiRes.json();
      throw new Error(apiErr.error || "Failed to save the transaction to tracker database.");
    }

    setAiStatus("Transaction added!");
    aiEls.textInput.value = "";
    await loadData();
    triggerPanelFlash(resolvedType);
  } catch (error) {
    console.error("[AI Assistant Error]", error);
    setAiStatus(`Error: ${error.message}`);
  } finally {
    aiEls.sendBtn.disabled = false;
  }
}

async function toggleVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
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
      stream.getTracks().forEach(track => track.stop());

      try {
        setAiStatus("Sending voice to Speech-to-Text service...");
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

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
          setAiStatus("Voice transcribed!");
          
          // Trigger pulse animation on text area
          aiEls.textInput.classList.remove("pulse-updated");
          void aiEls.textInput.offsetWidth;
          aiEls.textInput.classList.add("pulse-updated");
          setTimeout(() => aiEls.textInput.classList.remove("pulse-updated"), 2300);
        } else {
          setAiStatus("Could not transcribe voice.");
        }

      } catch (error) {
        console.error("[STT Error]", error);
        setAiStatus(`Transcription error: ${error.message}`);
      } finally {
        aiEls.micBtn.classList.remove("mic-recording");
        aiEls.micIcon.textContent = "🎙️";
      }
    };

    mediaRecorder.start();
    aiEls.micBtn.classList.add("mic-recording");
    aiEls.micIcon.textContent = "🟥";
    setAiStatus("Recording...");

  } catch (error) {
    console.error("[Microphone Access Error]", error);
    setAiStatus(`Microphone error: ${error.message}`);
    aiEls.micBtn.classList.remove("mic-recording");
    aiEls.micIcon.textContent = "🎙️";
  }
}

if (aiEls.form) {
  aiEls.form.addEventListener("submit", submitAiText);
}
if (aiEls.micBtn) {
  aiEls.micBtn.addEventListener("click", toggleVoiceRecording);
}

loadData();
