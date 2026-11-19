# Browser suite

Playwright tests exercise the real TanStack Start app routes and their browser
flows. They use the actual Better Auth sign-in page and seeded SQLite data.

## Running locally

Set `E2E_EMAIL` and `E2E_PASSWORD` to the credentials of a local account with
access to the seeded clinic, then run:

```sh
bun run test:e2e
```

By default, the runner creates a separate `.wrangler/e2e/clinic.sqlite`
database, applies migrations, seeds the app data, and starts the app with
`vp dev` on port 4173. It does not use or modify the regular clinic database.
The local environment must provide `BETTER_AUTH_SECRET` and
`BETTER_AUTH_URL`; the runner overrides the app URL for its own port.

To test an already-running app instead, set `E2E_BASE_URL` and credentials.
Local database setup and the runner-managed server are skipped in this mode;
the account and clinic data must already exist on that server.

The setup project signs in once through `/login` and saves browser state under
`.wrangler/e2e/`. Specs use the browser and app UI only; none queries the
database or calls the auth server directly. The suite does not create or edit
clinical records.

Failed-run traces and screenshots are written to `test-results/e2e/`.
