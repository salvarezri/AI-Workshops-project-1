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
  renderAuditIncomes();
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

function renderAuditIncomes() {
  const filtered = state.incomes.filter((income) => {
    if (state.incomeFilter === "verified") return income.verified;
    if (state.incomeFilter === "unverified") return !income.verified;
    return true;
  });

  if (!filtered.length) {
    els.incomeAuditList.innerHTML = `<div class="empty">No incomes match this view.</div>`;
    return;
  }

  els.incomeAuditList.innerHTML = filtered.map(renderIncomeRow).join("");
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
        <div class="tags">${income.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
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
