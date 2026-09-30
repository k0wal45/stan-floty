# AGENT.md — Stan Floty

## Core Engineering Contract for AI Agents

> **Version:** 2.1
> **Status:** Active
> **Purpose:** Always-loaded engineering contract for AI agents and developers working in the **Stan Floty** repository.

This file contains only rules that are expected to apply to almost every task. Detailed domain, testing, permissions, financial, availability, and security rules live in `docs/` and MUST be read when the task touches those areas.

---

# 1. Project Mission

- **Project name:** Stan Floty
- **Application type:** Multi-tenant B2B SaaS, mobile-first Web App
- **Primary market:** Poland
- **Target customers:** car rentals, construction equipment rentals, machinery rentals, event equipment rentals
- **Primary value:** replace Excel-based operations with dynamic resource availability, fast check-out/check-in, one-step rental extensions, and clear tracking of partial payments

Core entities: Tenant, User, Item, Rental, Rental Extension, Payment.

---

# 2. Source-of-Truth Hierarchy

When information conflicts, use this order:

1. Explicit user instruction for the current task.
2. Non-negotiable rules in `AGENT.md` and the relevant `docs/*` contract.
3. Database schema and committed migrations.
4. Existing automated tests representing intended business behavior.
5. Existing implementation and repository conventions.
6. Other documentation.
7. Agent assumptions.

The agent MUST NOT silently invent missing business rules.

When a business rule is genuinely undefined, choose the smallest safe implementation compatible with the existing contract and clearly flag the ambiguity. Do not silently redefine the domain.

Any intentional change to a domain rule MUST update the relevant documentation and tests.

---

# 3. Non-Negotiable Rules

1. **Multi-tenancy is mandatory.** Tenant isolation failures are critical defects.
2. **Financial values are integer grosz values.** Never use floating-point numbers for money.
3. **Server-side authorization is mandatory.** Client-side checks are never sufficient.
4. **`tenant_id` comes from authenticated server context, never from untrusted client input.**
5. **No `any`.** TypeScript remains strictly typed.
6. **Protected UI mutations use Server Actions** unless the operation is specifically a webhook/external API concern.
7. **External/webhook entry points validate signatures/authentication and input.**
8. **PII and secrets must never be written to logs.**
9. **Financial records are immutable ledger entries.** Do not silently edit or delete financial history.
10. **Critical business logic requires automated tests.**
11. **Tests are written BEFORE production implementation for every feature.**
12. **Never implement a feature first and add its tests afterwards.**
13. **A green build without relevant tests does not mean a feature is complete.**
14. **Schema changes require migrations.**
15. **Business-critical operations must be safe under concurrent requests.**
16. **Do not bypass existing architecture to ship a shortcut.**
17. **Always pull API keys and credentials from .env.** never under any circumstances use API/Private keys and token in files always refer to variables inside of .env

---

# 4. Required Documentation by Task

Before implementation, read the documentation relevant to the feature:

- Rental/domain behavior → `docs/domain.md`
- Authorization/RBAC → `docs/permissions.md`
- Payments/pricing → `docs/financial-rules.md`
- Availability/concurrency → `docs/availability.md`
- Security/tenant isolation/PII/audit → `docs/security.md`
- Tests/testing workflow → `docs/testing.md`

When a task touches multiple areas, read all applicable documents.

---

# 5. Technology Stack

- **Framework:** Next.js App Router
- **Mutations:** Next.js Server Actions
- **Webhooks / external API endpoints:** Route Handlers
- **Language:** TypeScript with strict typing
- **Database:** PostgreSQL (Supabase)
- **Object Storage:** Supabase Storage (for binary files, images, and attachments)
- **ORM:** Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui + Lucide Icons
- **Forms:** React Hook Form + Zod
- **Hosting:** Vercel
- **Application timezone:** `Europe/Warsaw`
- **Database time storage:** UTC using appropriate PostgreSQL timestamp semantics

### Database & Storage Provider Rule

Supabase is the strict provider for both PostgreSQL and Object Storage. Do not introduce Prisma, Vercel Blob, Amazon S3, or a second ORM without an explicit architectural decision.

Never store binary files directly in the database. Use Supabase Storage for files and store only the resulting URLs or JSONB metadata in the PostgreSQL schema.

### ORM Rule

Drizzle ORM is the project ORM. Do not introduce Prisma or a second ORM unless the architecture is explicitly changed and this file is updated first.

---

# 6. Architecture

## 6.1. Directory Structure

```text
@/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── items/
│   │   ├── rentals/
│   │   ├── analytics/
│   │   └── settings/
│   └── api/
├── components/
│   ├── ui/
│   ├── forms/
│   └── modules/
├── db/
│   ├── schema/
│   └── index.ts
├── server/
│   ├── actions/
│   ├── services/
│   └── repositories/
├── lib/
└── types/
```

## 6.2. Layer Responsibilities

### Client Components

Responsible for rendering, interaction, local form state, and client-side UX validation. They MUST NOT be the authoritative layer for security or business rules.

### Server Actions

Responsible for authentication, authorization, trusted tenant context, server-side Zod validation, invoking domain services, and returning safe results. Keep Server Actions thin.

### Services

Contain business operations such as `createRental`, `extendRental`, `recordPayment`, `completeRental`, `cancelRental`, and `setItemMaintenance`. Services enforce domain invariants and transaction boundaries.

### Repositories / Database Access

Database access is server-only. Repository methods receive trusted tenant context and enforce tenant scoping.

### Route Handlers

Use for webhooks, external machine-to-machine APIs, and integration callbacks. Do not use them as an alternative to Server Actions for normal authenticated UI mutations.

---

# 7. Validation & Error Handling

Every mutation MUST validate input on the server with Zod. Client-side validation may exist for UX, but server validation is authoritative.

Validation must cover both structural validity and business/domain validity.

Use consistent internal error categories:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `BUSINESS_RULE_VIOLATION`
- `INFRASTRUCTURE_ERROR`

Do not silently swallow errors or expose sensitive internal errors to users.

UI-facing errors must be natural Polish. Code identifiers and internal error codes remain English.

---

# 8. AI Feature Development Workflow — Mandatory

For every new feature or meaningful behavior change, follow this exact order:

```text
1. INSPECT
2. READ RELEVANT DOCS
3. DEFINE FEATURE CONTRACT / ACCEPTANCE CRITERIA
4. IDENTIFY INVARIANTS + EDGE CASES
5. WRITE TESTS
6. RUN TESTS AND CONFIRM EXPECTED INITIAL FAILURE
7. IMPLEMENT FEATURE
8. RUN TESTS
9. FIX IMPLEMENTATION, NOT TESTS, WHEN CONTRACT IS CORRECT
10. REFACTOR WHILE KEEPING TESTS GREEN
11. TYPECHECK + LINT
12. REVIEW FINAL DIFF
```

**Never implement the feature first and write its tests afterwards.**

The tests are the executable contract; `AGENT.md` and `docs/*` define the intended rules.

Before changing code, inspect existing components, utilities, services, schema, migrations, tests, and established patterns. Reuse existing abstractions where appropriate.

During implementation:

- make the smallest coherent change
- keep business logic on the server
- preserve tenant isolation and authorization
- preserve existing invariants
- avoid duplicated business logic
- avoid unrelated refactors unless required for correctness

---

# 9. Database Migration Rules

Every schema change MUST use a migration.

The agent MUST NOT:

- manually alter production schema as a shortcut
- silently remove data-bearing columns
- rename/drop columns without a migration strategy
- introduce destructive migrations without considering production data
- mix incompatible schema versions inside the application

After schema changes, migrations, integration tests, and fixtures must remain valid.

---

# 10. Definition of Done

A feature is **NOT DONE** when:

- only the happy path works
- implementation exists but tests were added afterwards
- critical business logic lacks relevant tests
- authorization is not verified
- tenant isolation is not verified
- a failing test was weakened, skipped, or deleted to make CI green
- database changes have no migration
- business assumptions are undocumented
- financial behavior is untested where money is involved
- concurrency-sensitive operations rely only on UI checks

A feature is **DONE** when applicable requirements are satisfied:

- feature contract/acceptance criteria are defined
- tests were written before production implementation
- relevant tests pass
- authorization is implemented and tested
- tenant isolation is implemented and tested
- domain invariants are preserved and tested
- financial calculations are tested when applicable
- concurrency behavior is safe and tested when applicable
- typecheck passes
- lint passes
- migration exists when schema changed
- no `any` was introduced
- no PII is emitted in logs
- no unrelated architecture was introduced
- final diff matches the requested feature

---

# 11. UI & Language Rules

Always use English for code identifiers, database objects, internal enums, internal error codes, service/repository names, and component names.

Always use natural Polish for user-facing labels, buttons, validation messages, errors, toasts, notifications, empty states, and descriptions.

Use Tailwind CSS and shadcn/ui. Do not create redundant custom CSS when existing primitives are sufficient.

---

# 12. Final Agent Directive

Build the application as a production system, not as a demo.

When choosing between a convenient shortcut and a design that preserves tenant isolation, authorization, financial correctness, data integrity, domain invariants, testability, and concurrency safety, preserve the contract.

When a requested task touches a detailed domain area, read its relevant `docs/*` contract before implementing.
