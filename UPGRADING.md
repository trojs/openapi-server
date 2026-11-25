# Upgrading to Sentry v11

`@trojs/openapi-server` now uses `@sentry/node` v11 (previously v10).
This guide describes what changes for applications that use this package.

Sentry itself has more changes than are listed here, see the
[official 10.x to 11.x migration guide](https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#upgrading-from-10x-to-11x).
They only matter if your application uses the Sentry SDK directly.

## Requirements

- Node.js `>= 24` (this package already required it; Sentry v11 needs at least 20.19).

## Changes in the `sentry` option of `setupServer`

```javascript
const { app } = await setupServer({
  apis: [api],
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    // new
    profileSessionSampleRate: 1.0,
    profileLifecycle: 'trace',
    dataCollection: { /* see below */ }
  }
})
```

### `profilesSampleRate` is deprecated and ignored

Sentry v11 removed per-transaction profiling. If you pass `profilesSampleRate`,
remove it, or replace it with the session based options:

| Before | After |
| ------ | ----- |
| `profilesSampleRate: 0.5` | `profileSessionSampleRate: 0.5` |
| (implicit) | `profileLifecycle: 'trace'` (start/stop with active traces) or `'manual'` |

Profiling only works when `@sentry/profiling-node` is installed and its
integration is enabled.

### New option: `dataCollection`

Sentry v11 replaced `sendDefaultPii` with `dataCollection`, and its defaults collect
**more** data than v10 (user info and IP address, cookies, request and response bodies,
database queries).

To avoid silently sending more data after the upgrade, this package keeps the
v10 behaviour by default: no user info, no cookies, no request bodies,
no database query data, and IP related headers are denied.

You can override this with your own `dataCollection` object. It replaces the
default completely, so set every category you care about:

```javascript
sentry: {
  dsn: process.env.SENTRY_DSN,
  // e.g. the Sentry v11 default behaviour:
  dataCollection: {
    userInfo: true,
    cookies: true,
    httpBodies: ['incomingRequest', 'outgoingRequest', 'incomingResponse', 'outgoingResponse'],
    databaseQueryData: true
  }
}
```

See the [Sentry `dataCollection` docs](https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection)
for all categories and values.

### Unchanged

`dsn`, `tracesSampleRate`, `release`, `environment` and `serverName` work as before.
Express errors are still captured by this package, you do not need to call
`Sentry.setupExpressErrorHandler(app)` yourself.

## If your application also uses `@sentry/node` directly

1. Upgrade your own dependency to the same major version: `npm install @sentry/node@^11`.
   Two different major versions result in two separate SDK instances, and calls
   like `Sentry.captureException` in your code would not use the instance that
   `setupServer` initialized.
2. Do not call `Sentry.init` yourself in addition to `setupServer({ sentry })`.
3. Import types from `@sentry/core` instead of `@sentry/types`, which is no longer published.
4. Review the Sentry v11 behaviour changes that affect your code:
   - Span streaming is the default. `beforeSendTransaction` and `ignoreTransactions` do nothing;
     use `ignoreSpans` and `beforeSendSpan` (or set `traceLifecycle: 'static'`).
   - Scope tags and extras are no longer added to spans, use `Sentry.setAttribute(s)`.
   - `attachStacktrace` defaults to `true`, so `captureMessage` events get a stack trace
     and you may see new issue groups.
   - `enableLogs` was removed; logs are captured when you use `Sentry.logger` or a logging integration.
   - `--require` is no longer supported for loading an instrument file, use `--import`.

## Checklist

- [ ] Remove `profilesSampleRate` from your `sentry` config (optionally add `profileSessionSampleRate`).
- [ ] Decide whether the default `dataCollection` (v10-like) suits you, or configure your own.
- [ ] Upgrade `@sentry/node` in your application to `^11` if you use it directly.
- [ ] Replace `@sentry/types` imports by `@sentry/core`.
- [ ] Check Sentry for new issue groups and changed transaction data after deploying.
