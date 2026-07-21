# Financial Tracker Prototype

A local prototype for tracking expenses and income with JSON-file persistence.

## Run

```powershell
.\start.ps1
```

Then open:

```text
http://localhost:3000
```

## Data

Records are saved in:

- `data/expenses.json`
- `data/incomes.json`

## API Endpoints

```http
GET /api/expenses
POST /api/expenses
PATCH /api/expenses/:id
DELETE /api/expenses/:id

GET /api/incomes
POST /api/incomes
PATCH /api/incomes/:id
DELETE /api/incomes/:id

GET /api/reports
GET /api/tags
```

Example expense payload:

```json
{
  "amount": 25.5,
  "date": "2026-07-19",
  "tags": ["food", "personal"],
  "description": "Lunch",
  "account": "Credit card",
  "verified": false
}
```

Example income payload:

```json
{
  "amount": 1200,
  "date": "2026-07-19",
  "tags": ["salary"],
  "description": "Payroll",
  "account": "Checking"
}
```
