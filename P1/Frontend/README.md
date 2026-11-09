# Moneytrack frontend

Angular 21 + TypeScript frontend for the adjacent Spring Boot expense tracker. Includes creating expenses, viewing all expenses, search, currency filters, sorting, currency-specific summaries, and confirmed deletion. No sample records are added.

## Run

```sh
npm install
npm start
```

Open http://localhost:4200. Start the Spring Boot backend on port 8080. `proxy.conf.json` proxies `/expenseTracker` to `http://localhost:8080`, so local development does not require CORS changes. Change the proxy target if your backend uses another port; restart the Angular server afterward.

```sh
npm run build
npm test
```

Production files are written to `dist/moneytrack/browser`. Configure your production web server to forward `/expenseTracker` and `/expenseTracker/*` to your backend. The Angular development proxy is not included in production.

## Backend contract

- `GET /expenseTracker` → an array of expenses.
- `POST /expenseTracker` → the created expense, including its generated `id`.
- `DELETE /expenseTracker/{id}` → successful empty response.

Example request:

```json
{ "title": "Groceries", "description": "Weekly shop", "currency": "INR", "amount": 1250 }
```

An expense response has the same fields plus a numeric `id`. Amounts are positive whole numbers, capped at Java's Integer maximum (2,147,483,647), matching the existing request DTO. No decimal-to-minor-unit conversion is applied. Totals are calculated per currency; exchange rates are not assumed. Ordering uses generated IDs because the backend does not supply timestamps.

**Backend gap:** the adjacent checked-in `ExpenseTrackerController.java` currently implements GET and POST only. Add `@DeleteMapping("/{id}")` and a corresponding service/repository delete operation to support the wired delete action. Until this endpoint exists, the UI displays a deletion error and keeps the record. No backend files were changed.

The app uses Google Fonts when available, with local sans-serif fallbacks. No authentication is required by the current backend contract.
