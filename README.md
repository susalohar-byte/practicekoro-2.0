# PracticeKoro 2.0

[![CI](https://github.com/susalohar-byte/practicekoro-2.0/actions/workflows/ci.yml/badge.svg)](https://github.com/susalohar-byte/practicekoro-2.0/actions/workflows/ci.yml)
[![DB Security Assertions](https://github.com/susalohar-byte/practicekoro-2.0/actions/workflows/db-security.yml/badge.svg)](https://github.com/susalohar-byte/practicekoro-2.0/actions/workflows/db-security.yml)
[![Live App](https://img.shields.io/badge/Live_App-practicekoro.online-2563eb)](https://practicekoro.online)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

PracticeKoro is a bilingual mock-test and practice platform for West Bengal competitive
examinations. It includes student test-taking workflows, topic-wise practice, results and
solutions, subscriptions, and an administration CMS.

[Open the live application →](https://practicekoro.online)

![PracticeKoro homepage preview](docs/homepage-preview.webp)

## Highlights

- Bengali-first and English learning experience
- Full mock tests, topic practice, PYQs, results and detailed solutions
- Student subscriptions with server-verified Razorpay payments
- Administration CMS for exams, questions, tests, banners and content
- Web app plus a Flutter mobile client
- Supabase Row Level Security (RLS) assertions and automated quality checks

## Stack

- React, TypeScript, Vite and Tailwind CSS
- Supabase Auth, PostgreSQL, RLS and Edge Functions
- TanStack Query
- Razorpay
- Vitest, Testing Library and Playwright

## Architecture

```text
React + TypeScript web app ─┐
                           ├─ Supabase Auth + PostgreSQL + RLS
Flutter mobile app ────────┘             │
                                         ├─ Edge Functions
Admin CMS ────────────────────────────────┤
                                         └─ Razorpay payment verification
```

## Repository layout

| Path                   | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `src/`                 | React web application, services and unit tests |
| `practicekoro_mobile/` | Flutter mobile application                     |
| `supabase/migrations/` | Ordered database migrations                    |
| `supabase/functions/`  | Server-side Edge Functions                     |
| `supabase/tests/`      | Database and RLS security assertions           |
| `tests/e2e/`           | Playwright end-to-end tests                    |
| `docs/`                | Deployment and operational documentation       |

## Local setup

1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env.local`.
3. Add the public Supabase URL and anonymous key.
4. Install dependencies and start the app:

```bash
npm ci
npm run dev
```

Never add the Supabase service-role key, Razorpay key secret, or webhook secret to a
`VITE_` environment variable.

The app uses local/demo data when demo mode is enabled. Automated unit tests force demo mode so
they never access the production Supabase project.

## Commands

| Command                 | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start the development server             |
| `npm run build`         | Type-check and create a production build |
| `npm run lint`          | Run ESLint                               |
| `npm run format:check`  | Verify formatting                        |
| `npm test`              | Run unit tests                           |
| `npm run test:coverage` | Run unit tests with coverage             |
| `npm run test:e2e`      | Run Playwright tests                     |
| `npm run check`         | Run all pull-request quality checks      |

## Supabase

Apply migrations in numeric order from `supabase/migrations`. Review every migration before
running it against production and take a database backup first.

Deploy Edge Functions with the Supabase CLI and configure server-only secrets in the Supabase
project:

```bash
supabase secrets set RAZORPAY_KEY_SECRET=... RAZORPAY_WEBHOOK_SECRET=...
supabase functions deploy verify-payment
supabase functions deploy razorpay-webhook --no-verify-jwt
```

Webhook endpoints intentionally verify Razorpay's HMAC signature. Do not add fallback secrets.

## Deployment

Build with `npm run build` and publish the `dist` directory. The host must rewrite unknown
client routes to `/index.html` for React Router. See [the deployment guide](docs/DEPLOYMENT.md).

## Testing payments

Use a Razorpay test account and Supabase staging project. Do not run automated tests against
live payment credentials. Verify successful, failed, duplicate, amount-mismatch and
signature-mismatch scenarios before launch.

## Security

Read [SECURITY.md](SECURITY.md). Report vulnerabilities privately rather than opening a public
issue containing exploit details or credentials.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Run `npm run check` locally
and keep database changes covered by the RLS assertions.

## License

Released under the [MIT License](LICENSE).
