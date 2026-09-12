# EMI Tracker Backend: Vercel Deployment Readiness Review

**Review scope:** Inspection of the backend and frontend API client followed by a minimal Vercel compatibility update. Existing application routes and business logic were preserved.

**Overall result:** The Express API is now shaped for Vercel serverless deployment. `api/index.js` is the Vercel entry point, `server.js` remains the local development listener, `config/db.js` provides a lazy `mysql2` pool behind the existing `db.query` interface, and the reminder check is callable through a protected Vercel Cron endpoint. The existing reminder job still only logs reminders; it does not send WhatsApp messages.

**Implementation status:** The required compatibility files were changed or added after the initial readiness review. No frontend files, database schema, dependency versions, commits, or pushes were changed.

## 1. Current Backend Architecture

- `server.js` creates an Express 5 application, registers JSON parsing and CORS, mounts five route groups, and exposes `GET /` as a health response.
- Authentication is handled by `authController.js` using `bcrypt` for password hashing and `jsonwebtoken` for seven-day JWTs. Protected routes read `Authorization: Bearer <token>` in `middleware/authMiddleware.js`.
- The route groups are:
  - `/api/auth`: register and login.
  - `/api/loans`: create, list, read, update, and soft-delete loans.
  - `/api/payments`: add payments and read payment history.
  - `/api/dashboard`: dashboard summary and mark-as-paid.
  - `/api/reminders`: generate a WhatsApp link.
- All database-backed controllers use the same imported `db` object with callback-style `db.query` calls:
  - `controller/authController.js`
  - `controller/loanController.js`
  - `controller/paymentController.js`
  - `controller/dashboardController.js`
  - `cron/reminderJob.js`
- The current source does not use Sequelize despite it being installed. The deleted `models` files are not imported by the current routes or controllers.
- `cron/reminderJob.js` is imported for side effects from `server.js`, schedules `0 9 * * *`, queries active loans, calculates whether a due date is one or three days away, and logs a message.
- The frontend is a Vite React application rather than a Next.js application in the inspected `frontend/package.json`. Its Axios client uses `import.meta.env.VITE_API_URL` as the API base URL.

## 2. Vercel Compatibility

### Already compatible

- Express route handlers and middleware can run inside a Vercel Node.js Function.
- The code uses ES module syntax and declares `"type": "module"`; current Vercel Node.js runtimes support this when the project is configured consistently.
- JWT in an HTTP authorization header is compatible with serverless requests.
- `bcrypt`, `jsonwebtoken`, `cors`, `express`, `dotenv`, and `mysql2` are normal Node dependencies for a serverless function.
- The SQL uses parameter placeholders for user-supplied values in the main queries, which is appropriate for MySQL drivers.
- No backend filesystem, uploaded-file, local-persistence, or hardcoded `127.0.0.1` usage was found in the application source.
- The WhatsApp URL generation endpoint is stateless and serverless-compatible, although it opens a link rather than sending a message.

### Must be changed

- `server.js` must stop calling `app.listen(5000)` for the Vercel deployment entry point and must export the Express app.
- Vercel must have a discoverable serverless entry point. The most predictable layout is `backend/api/index.js` importing the app from a separate application module, or a Vercel configuration that explicitly maps the entry point. The current top-level `server.js` alone should not be treated as a guaranteed Vercel Function entry point.
- `config/db.js` must contain a real database export. In the current worktree it contains only `r`, so imports of its default export cannot provide the required `db.query` API.
- Production database settings must not use `DB_HOST=localhost`; Vercel `localhost` means the function instance, not the developer's MySQL server.
- The scheduled reminder mechanism must be moved out of an in-process `node-cron` timer. Use a Vercel Cron invocation or a separately hosted scheduler/worker.
- Environment variables must be configured in Vercel for the deployed environment. A local `.env` file is not a production configuration mechanism.

### Recommended but optional

- Replace `mysql2.createConnection()` with a lazily initialized `mysql2` pool and configure a small connection limit. This is strongly recommended for serverless reliability, although the inspected `db.js` no longer contains a connection implementation to confirm.
- Restrict CORS to the deployed frontend origin, while allowing the local development origin in development. The current `cors()` allows every origin.
- Add explicit startup validation for required environment variables and a simple health/database readiness check.
- Add consistent async error handling, request validation, and a production error response that does not return raw database error messages.
- Correct `package.json`'s informational `main` field from `index.js` or remove it if the selected Vercel entry point does not use it. This is not normally the primary Vercel routing mechanism.
- Remove unused Sequelize and any unused model files only after confirming they are not needed. This is cleanup, not a deployment prerequisite.
- Add database indexes for the user, active, and due-date fields if production data volume warrants it.

### Not compatible / potential problems

- `node-cron` is not reliable as the source of a daily business guarantee on Vercel because serverless instances are created and stopped on demand. Importing the cron module may create a timer in an instance, but there is no guarantee that an instance remains alive at 9:00.
- The current cron job does not send WhatsApp messages. It only writes `Reminder: ...` to logs. `generateWhatsAppLink` also does not send WhatsApp messages; it returns a `wa.me` URL for a user or browser to open.
- A MySQL server bound only to the developer's local machine cannot be reached from Vercel. The database must be publicly reachable through a secured provider or a suitable managed/private network connection.
- Long-lived transactions, in-memory state, local files, and background work after a response are unsafe assumptions for a serverless request. The inspected application does not appear to use these except for the cron timer.

## 3. Required Code Changes

The following changes were identified as required and have now been implemented in the current working tree.

| File or path | Required change |
|---|---|
| `backend/server.js` or a new app module such as `backend/app.js` | Build and configure the Express app without calling `app.listen()` in the Vercel path; export the app. Keep local listening in a separate guarded/local entry point if local `npm start` is still desired. Ensure environment loading occurs before database initialization. |
| `backend/api/index.js` | Recommended Vercel entry point. Import the exported Express app and export it as the default handler. This file is needed if the project uses the conventional `api` Function layout. |
| `backend/config/db.js` | Restore a valid default database export. Prefer a lazily created `mysql2` pool using `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT`. Preserve the existing `db.query(...)` surface so the controllers do not need query-call changes. |
| `backend/cron/reminderJob.js` | Remove the import-time `node-cron` scheduling for Vercel. Extract the query/reminder work into an explicitly callable function or endpoint. Make the operation idempotent and define how already-processed reminders are prevented from being duplicated. |
| `backend/api/cron/reminders.js` or equivalent endpoint | Add a Vercel Cron handler if Vercel Cron is selected. Authenticate the invocation with a secret header or token, execute the reminder function, and return only after the work has completed. The exact path can vary with the selected layout. |
| `backend/vercel.json` | Recommended when using an explicit `api` layout or Vercel Cron. It should declare the function/runtime behavior and a `crons` schedule pointing at the reminder endpoint. The schedule must be chosen in UTC and within the limits of the Vercel plan. A rewrite is generally unnecessary when the API is intentionally served under `/api/...`. |
| `backend/package.json` | Usually no dependency change is required. Confirm the Vercel project root is `backend` and retain the existing ES module setting. Keep `start` for local development if desired; Vercel does not need `app.listen()` to serve a Function. |

The exact entry-point strategy should be chosen before implementation. Do not create both competing serverless entry points without deciding which one Vercel will invoke.

## 4. Database Compatibility

The existing application expects a shared object exposing `db.query(sql, values, callback)`. Every current database use is in the auth, loan, payment, dashboard, and reminder code listed in Section 1. There are no current imports of Sequelize models, and the deleted model files are not referenced by the inspected source.

`mysql2.createConnection()` can technically issue queries from a serverless function, but a single connection is a poor fit: functions can handle concurrent requests, instances can be reused unpredictably, and a connection can be closed or become stale between invocations. A pool is the appropriate implementation for this application. It reuses healthy connections within a warm instance, controls concurrency, and can establish connections when needed.

Changing from a `createConnection()` object to a `createPool()` object should not require controller changes if the exported object keeps the same `db.query(...)` interface. The cron extraction should use the same shared database module. The current `db.js` contains only `r`, so its prior implementation cannot be verified; the replacement must also ensure that configuration is read from runtime environment variables and that errors are surfaced rather than silently swallowed.

Required production database conditions:

- MySQL must be hosted somewhere Vercel can reach; a local MySQL service is not reachable from the deployed function.
- The provider must allow the Vercel deployment's outbound connections and support TLS where required.
- Use a connection limit appropriate for the database provider and the expected number of serverless instances.
- Do not commit credentials. The inspected `.env` contains local credentials and a weak development JWT secret; those values must not be reused in production, and any real exposed credentials should be rotated.

## 5. Cron / EMI Reminder Compatibility

`node-cron` schedules an in-memory timer when `cron/reminderJob.js` is imported. Vercel may freeze or remove the instance before the scheduled time, and another instance may be created instead. Therefore it cannot provide a reliable daily reminder guarantee on Vercel. It should not be the production scheduler.

Safest Vercel-oriented design for this project:

1. Move the query and reminder decision logic into a callable service function.
2. Add a dedicated serverless endpoint that invokes that function and is protected from arbitrary public calls.
3. Configure Vercel Cron to call the endpoint once daily at the desired UTC time, subject to the Vercel plan's cron limits.
4. Make processing idempotent. Store a reminder date/type or an equivalent delivery record if duplicate sends would be harmful.
5. Use a real WhatsApp provider/API, such as the WhatsApp Business Cloud API or another approved provider, if automatic messages are required. Store its credentials only as encrypted Vercel environment variables.

An external scheduler plus a separately hosted worker is preferable when the reminder workflow needs retries, guaranteed delivery, long-running processing, or a WhatsApp provider integration that exceeds a short serverless request. Vercel Cron is sufficient for a small daily scan only after delivery and duplicate-handling semantics are designed.

Current behavior is not automatic WhatsApp delivery: the scheduled job only logs matching loan names and day counts. The authenticated `POST /api/reminders/whatsapp` endpoint returns a `https://wa.me/...` link, and the frontend also builds links directly. Opening that link requires a user/browser action.

## 6. Environment Variables

Values below are examples of format only. No real secret values are included.

| Variable | Required? | Purpose | Example format |
|---|---|---|---|
| `DB_HOST` | Yes | Reachable hostname for the production MySQL server | `mysql.example-host.com` |
| `DB_USER` | Yes | MySQL application user | `loan_tracker_app` |
| `DB_PASSWORD` | Yes | MySQL application password | `<strong-random-password>` |
| `DB_NAME` | Yes | MySQL database/schema name | `loan_tracker` |
| `DB_PORT` | Yes | MySQL TCP port | `3306` |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs | `<long-random-secret>` |
| `FRONTEND_ORIGIN` | Recommended | Allowed deployed browser origin for restricted CORS | `https://app.example.com` |
| `CRON_SECRET` | Required if using a protected cron endpoint | Secret used to authorize scheduler calls | `<long-random-secret>` |
| `WHATSAPP_ACCESS_TOKEN` | Only if automatic WhatsApp sending is implemented | Provider credential for outbound messages | `<provider-token>` |
| `WHATSAPP_PHONE_NUMBER_ID` | Only if automatic WhatsApp sending is implemented | Provider sender identifier | `<provider-id>` |

The local `.env` currently sets `DB_HOST` to `localhost`. Configure production values in Vercel's project environment settings for Preview and Production as appropriate. Do not expose database, JWT, cron, or WhatsApp secrets in frontend `VITE_*` variables.

## 7. Recommended Final Backend Structure

One clear structure after the required changes is:

```text
backend/
  api/
    index.js                 # Vercel API entry point; exports the Express app
    cron/
      reminders.js           # Vercel Cron handler, if Vercel Cron is selected
  config/
    db.js                    # mysql2 pool and environment-based configuration
  controller/
    authController.js
    dashboardController.js
    loanController.js
    paymentController.js
    reminderController.js
  cron/
    reminderJob.js            # callable reminder service; no import-time timer
  middleware/
    authMiddleware.js
  routes/
    authRoutes.js
    dashboardRoutes.js
    loanRoutes.js
    paymentRoute.js
    reminderRoutes.js
  app.js                     # Express setup and default export, recommended
  server.js                  # optional local-only listener
  package.json
  vercel.json                # recommended when declaring Cron or custom routing
```

`app.js` and `server.js` can be combined if the local start behavior is deliberately separated from the Vercel export. The important properties are one unambiguous Vercel handler, no production `app.listen()`, and no import-time scheduler.

## 8. Deployment Process

After the proposed changes are approved:

1. Confirm the intended Vercel project root is `backend`, not the repository root. Alternatively, keep the repository root and explicitly configure the backend entry point.
2. Restore/fix the database module and choose a reachable managed MySQL database. Apply the required schema and indexes.
3. Separate Express app construction from local listening and export the app through the chosen Vercel entry point.
4. Remove the production `node-cron` side effect and implement the selected Vercel Cron or external-scheduler flow.
5. Configure Vercel environment variables for the correct environments. Use a strong production JWT secret and rotate any credentials that have been exposed.
6. Configure restricted CORS with the deployed frontend origin and retain the local origin only where needed for development.
7. Push the approved changes to the already connected GitHub repository, or deploy from the local repository through the Vercel CLI. This review did not push anything.
8. In Vercel, import/select the repository, set the root directory to `backend`, and deploy with the Node runtime defaults unless an explicit runtime is needed.
9. Test `GET /`, registration, login, an authenticated loan request, payment flow, dashboard flow, and reminder-link flow against the deployed URL.
10. Test the scheduled endpoint independently with the authorized scheduler request. Confirm logs, database writes, timezone behavior, retries, and duplicate prevention.
11. Set the frontend's production `VITE_API_URL` to the deployed API origin, rebuild the frontend, and verify browser CORS and JWT requests.
12. Monitor Vercel function logs, database connection usage, error rates, and scheduler execution after release.

## 9. Frontend Changes

The frontend API client already reads `import.meta.env.VITE_API_URL`, so the production build must define that variable as the deployed backend base URL, for example `https://api.example.com` without accidentally duplicating `/api` if the client call sites already include it. The exact value should be confirmed against the frontend request paths.

The frontend must be rebuilt after changing a Vite environment variable. The deployed backend must allow the frontend's exact origin through CORS. JWT storage and the `Authorization` header can remain the same because the backend uses header-based authentication, not cookies.

The frontend's direct WhatsApp links will continue to require user interaction. Deploying the backend will not turn those links, or the backend reminder endpoint, into automatic messages.

## 10. Breaking Changes / Risks

- Removing `app.listen()` from the only entry point can break local `npm start` unless a local listener is retained separately.
- Changing the API base URL requires a new frontend build and correct Vercel environment configuration.
- Restrictive CORS will reject unlisted origins, including forgotten preview URLs.
- Moving from local MySQL to hosted MySQL may require TLS settings, firewall changes, schema migration, and different date/time behavior.
- A pool can expose database connection-limit problems if configured too high across many serverless instances.
- Vercel Cron invocation time is UTC and plan-dependent; a local interpretation of 9:00 may be wrong.
- A cron endpoint that is publicly callable can be abused to repeat reminders unless it has strong authorization and idempotency.
- Serverless retries or concurrent invocations can duplicate side effects unless reminder delivery is recorded transactionally.
- The current payment and dashboard handlers contain asynchronous database calls without a shared transaction or complete error handling. This is not caused by Vercel, but serverless retries make partial updates especially important to test.
- The current code returns raw database error messages in some responses, which can disclose implementation details.
- The current `db.js` and deleted model files are already modified in the working tree. Those user changes should be reviewed separately before deployment.

## 11. Final Deployment Checklist

- [ ] Review and approve the proposed code changes; none were made during this report.
- [ ] Confirm the Vercel project root and one unambiguous serverless entry point.
- [ ] Export the Express app and remove production `app.listen()`.
- [ ] Restore a valid `config/db.js` implementation.
- [ ] Use a lazy `mysql2` pool that preserves `db.query(...)` compatibility.
- [ ] Confirm all database consumers still work: auth, loans, payments, dashboard, and reminders.
- [ ] Use a remotely reachable production MySQL database with required schema and TLS/firewall settings.
- [ ] Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, and `JWT_SECRET` in Vercel.
- [ ] Use a strong production JWT secret and rotate exposed credentials.
- [ ] Replace or remove the import-time `node-cron` scheduler for production.
- [ ] Choose Vercel Cron or an external scheduler and document the UTC schedule.
- [ ] Protect the scheduler endpoint and make reminder processing idempotent.
- [ ] Decide whether reminders are only WhatsApp links or true provider-based outbound messages.
- [ ] Configure `FRONTEND_ORIGIN` and test local, preview, and production CORS behavior.
- [ ] Set the frontend `VITE_API_URL` to the deployed API origin and rebuild the frontend.
- [ ] Test public health and auth endpoints.
- [ ] Test authenticated loan, payment, dashboard, and reminder endpoints.
- [ ] Test invalid/missing JWTs and malformed request data.
- [ ] Test database failures and function cold starts.
- [ ] Test the scheduler endpoint, logs, retries, timezone, and duplicate prevention.
- [ ] Review Vercel logs and MySQL connection usage after deployment.
- [ ] Confirm no `.env` credentials or frontend-exposed secrets are committed.