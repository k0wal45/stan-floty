# Stan Floty — Domain Contract

This document contains the domain model, core data entities, domain invariants, date semantics, rental lifecycle, and glossary.

---

# 1. Core Domain

- **Tenant / Organization** — rental company using the SaaS platform
- **User** — employee belonging to a tenant
- **Item / Resource** — a car, machine, tool, or other rentable asset
- **Rental** — rental contract for one item and one customer over a defined period
- **Rental Extension** — an extension of a rental period that creates an additional charge
- **Payment** — an immutable financial ledger entry assigned to a rental

---

# 2. Database & Data Model

## `tenants`

- `id`
- `name`
- `nip`
- `currency` (default `PLN`)
- `plan` (`STARTER` / `PRO` / `BUSINESS`)
- `created_at`

## `users`

- `id`
- `tenant_id`
- `email`
- `role` (`OWNER` / `MANAGER` / `STAFF`)
- `full_name`

## `items`

- `id`
- `tenant_id`
- `name`
- `category`
- `identifier` (VIN / registration number / serial number)
- `rate` — integer grosz (price per billing unit)
- `rate_unit` — enum (`HOUR` / `DAY` / `WEEK` / `MONTH`)
- `status` (`AVAILABLE` / `RENTED` / `MAINTENANCE`)
- `image_url` — optional text (URL pointing to Supabase Storage for the main thumbnail)
- `gallery` — optional JSONB (array of URLs for additional item photos)
- `metadata` — optional JSONB

## `rentals`

- `id`
- `tenant_id`
- `item_id`
- `customer_name`
- `customer_phone`
- `customer_identifier` (PESEL/NIP)
- `start_date`
- `end_date`
- `initial_end_date`
- `rate_snapshot` — integer grosz (rate at time of rental creation)
- `rate_unit_snapshot` — enum (`HOUR` / `DAY` / `WEEK` / `MONTH`) (billing unit at time of rental creation)
- `total_price` — integer grosz
- `status` (`ACTIVE` / `COMPLETED` / `CANCELLED`)
- `attachments` — optional JSONB (structured array of file metadata, e.g., URL, file type, notes for damages)

## `rental_extensions`

- `id`
- `rental_id`
- `previous_end_date`
- `new_end_date`
- `additional_cost` — integer grosz
- `created_at`

## `payments`

- `id`
- `rental_id`
- `tenant_id`
- `amount` — integer grosz
- `method` (`CASH` / `CARD` / `BLIK` / `TRANSFER`)
- `paid_at`

---

_Note for MVP:_ Customer data (`customer_name`, `customer_phone`, `customer_identifier`) is denormalized directly into the `rentals` table. A dedicated `customers` table with a foreign key relationship is planned for v2. Do not introduce a `customers` table in the current implementation.

# 3. Data Integrity

Where practical, business invariants MUST be enforced at both application and database levels.

Examples of database constraints to consider:

- required tenant foreign keys are `NOT NULL`
- financial amounts cannot be negative
- rental dates must be valid
- foreign keys must preserve tenant ownership
- identifiers that are required to be unique must have database uniqueness constraints

Do not rely only on client validation or Zod for data integrity.

---

# 4. Domain Invariants

These rules define states that must never become invalid.

1. A rental belongs to exactly one tenant.
2. An item belongs to exactly one tenant.
3. A payment belongs to the same tenant as its rental.
4. A rental's item belongs to the same tenant as the rental.
5. `rate_snapshot` and `rate_unit_snapshot` are fixed when the rental is created and do not change later.
6. `Payment.amount` must be greater than zero unless an explicit future ledger model defines another transaction type.
7. `Rental.total_price` must not become negative.
8. A rental extension cannot shorten a rental.
9. A normal rental extension must use the current rental end date as the previous end date.
10. A completed or cancelled rental cannot be extended through the normal extension flow.
11. Financial calculations use integer grosz values.
12. Payment status is derived from the payment ledger, not stored as an independent mutable state.
13. Conflicting active rentals for the same item must not be possible.
14. A maintenance item cannot be issued for a new rental while its operational state forbids rental use.
15. A concurrent request must not be able to create an invalid domain state that a sequential request could not create.

Whenever a new invariant is discovered, add it here and add/adjust automated tests.

---

# 5. Dates & Time

## Storage and Display

- Store timestamps in UTC where a real point in time is required.
- Present dates/times to users in `Europe/Warsaw`.
- Do not mix calendar dates with timestamps without an explicit domain reason.

## Billing Semantics

Billing periods depend on the item's `rate_unit`:

- **HOUR** — each billing-hour period = 1 hour from start
- **DAY** — each billing-day period = 24 hours from start. A standard grace period (e.g., 59 minutes) may be applied before charging for the next 24-hour cycle.
- **WEEK** — each billing-week period = 7 × 24 hours from start
- **MONTH** — each billing-month period = 1 calendar month from start

The meaning of `start_date` and `end_date` MUST be treated consistently across creation, extension, pricing, availability, and reporting.

For every new date rule, include boundary examples such as:

- 01.09 10:00 → 02.09 10:00 (1 day)
- 01.09 10:00 → 02.09 11:30 (2 days, grace period exceeded)
- month boundary
- year boundary
- DST boundary where timestamps are involved

Never rely on implicit JavaScript date arithmetic when the business rule is 24-hour cycle-based.

---

# 6. Rental Lifecycle

## Rental Creation

A rental creation flow MUST:

1. authenticate the user
2. authorize the role
3. obtain trusted tenant context
4. validate input using Zod
5. verify item ownership by tenant
6. verify item can be rented
7. verify no conflicting active rental exists
8. calculate the initial price using the defined billing rule for the item's `rate_unit`
9. snapshot the applicable rate and rate unit
10. persist the rental atomically
11. update `items.status` to `RENTED` inside the exact same database transaction as the rental persistence.

## Extension

Extension flow:

1. User provides `new_end_date`.
2. Load the rental using trusted tenant context.
3. Verify rental is eligible for extension.
4. Verify `new_end_date > current_end_date`.
5. Calculate additional billing units according to the project's billing rule for the rental's `rate_unit_snapshot`.
6. Calculate `Extra Cost = Δunits × rate_snapshot`.
7. Inside one database transaction:
   - increase `rentals.total_price` by `Extra Cost`
   - update `rentals.end_date`
   - create `rental_extensions` record
   - if an immediate payment is part of the operation, create the corresponding payment entry

The entire operation must succeed atomically or roll back.

## Completion

Completion must verify that the rental is eligible to be completed and then update all required operational state atomically. This MUST include updating `rentals.status` to `COMPLETED` and `items.status` to `AVAILABLE` within a single database transaction.

## Cancellation

Cancellation must be authorized, must preserve financial history, and must not create inconsistent item/rental state.

---

# 7. Glossary

- **Tenant / Organization:** rental company that is a customer of the SaaS platform.
- **Item / Resource:** individual car, machine, tool, or other rentable asset.
- **Rental:** rental contract for a specific item and customer over a defined period.
- **Extension:** change to rental end date that creates an additional charge.
- **Payment:** immutable financial ledger entry assigned to a rental.
- **Balance Due:** total rental price minus all recorded payments.
- **Utilization Rate:** percentage of active rentable resources currently occupied according to the project's availability definition.
- **Domain Invariant:** business condition that must never be violated.
- **Tenant Isolation:** guarantee that one organization cannot access or mutate another organization's data.
