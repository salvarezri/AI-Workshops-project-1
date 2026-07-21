const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");

const stores = {
  expenses: path.join(DATA_DIR, "expenses.json"),
  incomes: path.join(DATA_DIR, "incomes.json"),
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const file of Object.values(stores)) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, "[]\n");
    }
  }
}

async function readCollection(type) {
  const raw = await fs.readFile(stores[type], "utf8");
  return JSON.parse(raw || "[]");
}

async function writeCollection(type, records) {
  await fs.writeFile(stores[type], `${JSON.stringify(records, null, 2)}\n`);
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function parseTags(value) {
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function validateEntry(payload, type) {
  const amount = Number(payload.amount);
  const date = String(payload.date || "").trim();
  const tags = parseTags(payload.tags || payload.tag);
  const description = String(payload.description || "").trim();
  const account = String(payload.account || "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    return { error: "Date must use YYYY-MM-DD format." };
  }

  if (tags.length === 0) {
    return { error: "At least one tag is required." };
  }

  return {
    record: {
      id: crypto.randomUUID(),
      amount: Math.round(amount * 100) / 100,
      date,
      tags,
      description,
      account,
      verified: Boolean(payload.verified),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function byDateDesc(a, b) {
  return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
}

function buildReports(expenses, incomes) {
  const totals = {
    expenses: sum(expenses),
    incomes: sum(incomes),
    net: sum(incomes) - sum(expenses),
    unverifiedExpenses: expenses.filter((item) => !item.verified).length,
  };

  return {
    totals,
    expensesByTag: totalsByTag(expenses),
    incomesByTag: totalsByTag(incomes),
    historicalExpenses: totalsByMonth(expenses),
    historicalIncomes: totalsByMonth(incomes),
    cashflowByMonth: cashflowByMonth(expenses, incomes),
  };
}

function buildTags(expenses, incomes) {
  const tags = new Map();

  for (const [type, records] of [["expenses", expenses], ["incomes", incomes]]) {
    for (const record of records) {
      for (const rawTag of record.tags || []) {
        const name = String(rawTag).trim();
        if (!name) continue;

        const key = name.toLocaleLowerCase();
        const tag = tags.get(key) || {
          tag: name,
          expenseCount: 0,
          incomeCount: 0,
          expenseTotal: 0,
          incomeTotal: 0,
        };

        if (type === "expenses") {
          tag.expenseCount += 1;
          tag.expenseTotal += Number(record.amount || 0);
        } else {
          tag.incomeCount += 1;
          tag.incomeTotal += Number(record.amount || 0);
        }
        tags.set(key, tag);
      }
    }
  }

  return [...tags.values()]
    .map((tag) => ({
      ...tag,
      expenseTotal: roundMoney(tag.expenseTotal),
      incomeTotal: roundMoney(tag.incomeTotal),
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

function sum(records) {
  return records.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function totalsByTag(records) {
  const map = new Map();
  for (const item of records) {
    for (const tag of item.tags) {
      map.set(tag, (map.get(tag) || 0) + item.amount);
    }
  }
  return [...map.entries()]
    .map(([tag, total]) => ({ tag, total: roundMoney(total) }))
    .sort((a, b) => b.total - a.total);
}

function totalsByMonth(records) {
  const map = new Map();
  for (const item of records) {
    const month = item.date.slice(0, 7);
    map.set(month, (map.get(month) || 0) + item.amount);
  }
  return [...map.entries()]
    .map(([month, total]) => ({ month, total: roundMoney(total) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function cashflowByMonth(expenses, incomes) {
  const map = new Map();
  for (const item of incomes) {
    const month = item.date.slice(0, 7);
    map.set(month, { month, income: (map.get(month)?.income || 0) + item.amount, expenses: map.get(month)?.expenses || 0 });
  }
  for (const item of expenses) {
    const month = item.date.slice(0, 7);
    map.set(month, { month, income: map.get(month)?.income || 0, expenses: (map.get(month)?.expenses || 0) + item.amount });
  }
  return [...map.values()]
    .map((row) => ({
      month: row.month,
      income: roundMoney(row.income),
      expenses: roundMoney(row.expenses),
      net: roundMoney(row.income - row.expenses),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const resource = parts[1];
  const id = parts[2];

  if (resource === "reports" && req.method === "GET") {
    const [expenses, incomes] = await Promise.all([readCollection("expenses"), readCollection("incomes")]);
    sendJson(res, 200, buildReports(expenses, incomes));
    return;
  }
  
  if (resource === "tags" && req.method === "GET") {
    const [expenses, incomes] = await Promise.all([readCollection("expenses"), readCollection("incomes")]);
    sendJson(res, 200, { tags: buildTags(expenses, incomes) });
    return;
  }


  if (!["expenses", "incomes"].includes(resource)) {
    sendJson(res, 404, { error: "Endpoint not found." });
    return;
  }

  if (req.method === "GET" && !id) {
    const records = await readCollection(resource);
    sendJson(res, 200, records.sort(byDateDesc));
    return;
  }

  if (req.method === "POST" && !id) {
    const payload = await readBody(req);
    const validation = validateEntry(payload, resource);
    if (validation.error) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    const records = await readCollection(resource);
    records.push(validation.record);
    await writeCollection(resource, records);
    sendJson(res, 201, validation.record);
    return;
  }

  if ((req.method === "PATCH" || req.method === "PUT") && id) {
    const payload = await readBody(req);
    const records = await readCollection(resource);
    const index = records.findIndex((item) => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Record not found." });
      return;
    }

    const next = { ...records[index], ...payload, id, updatedAt: new Date().toISOString() };
    if (payload.amount !== undefined) {
      next.amount = Math.round(Number(payload.amount) * 100) / 100;
    }
    if (payload.tags !== undefined || payload.tag !== undefined) {
      next.tags = parseTags(payload.tags || payload.tag);
    }
    if (payload.verified !== undefined) {
      next.verified = Boolean(payload.verified);
    }

    records[index] = next;
    await writeCollection(resource, records);
    sendJson(res, 200, next);
    return;
  }

  if (req.method === "DELETE" && id) {
    const records = await readCollection(resource);
    const next = records.filter((item) => item.id !== id);
    if (next.length === records.length) {
      sendJson(res, 404, { error: "Record not found." });
      return;
    }

    await writeCollection(resource, next);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
}

async function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    const type = contentTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected server error." });
  }
}

ensureStore().then(() => {
  http.createServer(handleRequest).listen(PORT, () => {
    console.log(`Financial tracker running at http://localhost:${PORT}`);
  });
});
