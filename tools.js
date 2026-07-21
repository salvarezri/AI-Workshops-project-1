/**
 * Financial Tracker Tools for the LLM
 */

const TRACKER_API_URL = process.env.TRACKER_API_URL || "http://localhost:3000";

// Schema declarations for the LLM function definitions
const toolDeclarations = [
  {
    name: "createExpense",
    description: "Record a new expense in the tracking system. Always use verified = false for expenses.",
    parameters: {
      type: "OBJECT",
      properties: {
        amount: { type: "NUMBER", description: "The expense amount in currency units." },
        date: { type: "STRING", description: "The date of the expense in YYYY-MM-DD format." },
        tags: { type: "ARRAY", items: { type: "STRING" }, description: "Tags for categorization (e.g. food, personal, utilities)." },
        description: { type: "STRING", description: "A description of the expense." },
        account: { type: "STRING", description: "Account used for the payment (e.g. Credit card, Checking, Cash)." }
      },
      required: ["amount", "date", "tags", "description", "account"]
    }
  },
  {
    name: "createIncome",
    description: "Record a new income in the tracking system.",
    parameters: {
      type: "OBJECT",
      properties: {
        amount: { type: "NUMBER", description: "The income amount in currency units." },
        date: { type: "STRING", description: "The date of the income in YYYY-MM-DD format." },
        tags: { type: "ARRAY", items: { type: "STRING" }, description: "Tags for categorization (e.g. salary, freelance, refund)." },
        description: { type: "STRING", description: "A description of the income." },
        account: { type: "STRING", description: "Account where the income was deposited (e.g. Checking, Savings, Cash)." }
      },
      required: ["amount", "date", "tags", "description", "account"]
    }
  },
  {
    name: "calculateDate",
    description: "Perform dates and hours offset calculations (e.g. '17/05/2026 minus tree days' or 'NOW minus 30 minutes') and return the calculated date in YYYY-MM-DD format.",
    parameters: {
      type: "OBJECT",
      properties: {
        expression: { type: "STRING", description: "The offset instruction, e.g. 'NOW minus 1 hour', '17/05/2026 minus tree days'." },
        currentDate: { type: "STRING", description: "The current reference date and hour in ISO 8601 format." }
      },
      required: ["expression", "currentDate"]
    }
  },
  {
    name: "getTags",
    description: "Get the list of unique tags already present in the financial system to help select the most plausible categories.",
    parameters: {
      type: "OBJECT",
      properties: {}
    }
  }
];

/**
 * Parses relative time offsets (e.g., NOW minus 30 minutes, 17/05/2026 minus tree days).
 */
function parseAndCalculateDate(expression, currentDateStr) {
  let currentDate = currentDateStr ? new Date(currentDateStr) : new Date();
  if (isNaN(currentDate.getTime())) {
    currentDate = new Date();
  }

  const expr = expression.trim().toLowerCase();
  
  // Regex to match: [base] (minus|plus|-|+) [quantity] [unit]
  const regex = /^(.*?)\s+(minus|plus|\-|\+)\s+(\w+|\d+)\s+(day|days|hour|hours|minute|minutes)$/i;
  const match = expr.match(regex);

  if (!match) {
    throw new Error(`Unable to parse date expression: "${expression}". Expected format like "NOW minus 30 minutes" or "17/05/2026 minus 3 days".`);
  }

  const basePart = match[1].trim();
  const operator = match[2].trim();
  const quantityPart = match[3].trim();
  const unit = match[4].trim();

  // Determine base date
  let baseDate = new Date(currentDate);
  if (basePart !== "now") {
    // Check if it is DD/MM/YYYY
    const ddMmYyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const dateMatch = basePart.match(ddMmYyyy);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // 0-indexed
      const year = parseInt(dateMatch[3], 10);
      baseDate = new Date(year, month, day);
      if (isNaN(baseDate.getTime())) {
        throw new Error(`Invalid base date: "${basePart}"`);
      }
    } else {
      baseDate = new Date(basePart);
      if (isNaN(baseDate.getTime())) {
        throw new Error(`Invalid base date: "${basePart}"`);
      }
    }
  }

  // Parse written numbers (e.g. tree/three) to numbers
  const numMap = {
    zero: 0, one: 1, two: 2, three: 3, tree: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  let quantity = parseInt(quantityPart, 10);
  if (isNaN(quantity)) {
    quantity = numMap[quantityPart];
    if (quantity === undefined) {
      throw new Error(`Invalid quantity: "${quantityPart}"`);
    }
  }

  // Apply operator
  const multiplier = (operator === "minus" || operator === "-") ? -1 : 1;
  const offset = quantity * multiplier;

  // Apply unit offset
  if (unit.startsWith("minute")) {
    baseDate.setMinutes(baseDate.getMinutes() + offset);
  } else if (unit.startsWith("hour")) {
    baseDate.setHours(baseDate.getHours() + offset);
  } else if (unit.startsWith("day")) {
    baseDate.setDate(baseDate.getDate() + offset);
  } else {
    throw new Error(`Unsupported unit: "${unit}"`);
  }

  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, '0');
  const d = String(baseDate.getDate()).padStart(2, '0');
  
  return {
    iso: baseDate.toISOString(),
    formatted: `${y}-${m}-${d}`
  };
}

/**
 * Execute the selected tool function.
 * @param {string} name 
 * @param {object} args 
 */
async function executeTool(name, args) {
  console.log(`[Agent Tool Execution] Running ${name} with args:`, JSON.stringify(args));
  
  try {
    switch (name) {
      case "createExpense": {
        const { amount, date, tags, description, account } = args;
        const res = await fetch(`${TRACKER_API_URL}/api/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, date, tags, description, account, verified: false })
        });
        if (!res.ok) {
          const text = await res.text();
          return { error: `Failed to create expense: ${text}` };
        }
        const record = await res.json();
        return { success: true, record };
      }

      case "createIncome": {
        const { amount, date, tags, description, account } = args;
        const res = await fetch(`${TRACKER_API_URL}/api/incomes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, date, tags, description, account })
        });
        if (!res.ok) {
          const text = await res.text();
          return { error: `Failed to create income: ${text}` };
        }
        const record = await res.json();
        return { success: true, record };
      }

      case "getTags": {
        const res = await fetch(`${TRACKER_API_URL}/api/tags`);
        if (!res.ok) {
          const text = await res.text();
          return { error: `Failed to fetch tags: ${text}` };
        }
        const data = await res.json();
        const tagList = Array.isArray(data.tags) ? data.tags.map(t => t.tag) : [];
        return { tags: tagList };
      }

      case "calculateDate": {
        const { expression, currentDate } = args;
        const result = parseAndCalculateDate(expression, currentDate);
        return { success: true, formatted: result.formatted, iso: result.iso };
      }

      default:
        return { error: `Tool ${name} not found.` };
    }
  } catch (error) {
    console.error(`[Agent Tool Execution] Error in ${name}:`, error);
    return { error: error.message || "Unknown error during tool execution." };
  }
}

module.exports = {
  toolDeclarations,
  executeTool
};
