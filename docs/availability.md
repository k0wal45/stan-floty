# Stan Floty — Availability & Concurrency

Availability is a domain concern, not merely a UI label.

---

# 1. Core Rule

The system MUST prevent conflicting active rentals for the same item.

A single item must not be rentable through two overlapping conflicting active rentals.

---

# 2. Do Not Rely on Check-Then-Insert

Do not rely only on:

```text
SELECT → check availability → INSERT
```

because concurrent requests can both observe availability.

Use an explicit database-level/concurrency-safe strategy such as appropriate transactions, constraints, locking, or PostgreSQL exclusion mechanisms where applicable.

The chosen mechanism must be documented in the implementation and covered by integration tests.

---

# 3. Operational Status vs Availability

`items.status` is an operational state.

It must not become an undocumented alternative source of truth that contradicts rental records.

Any denormalized status must have a clearly defined update strategy and tests.

A maintenance item cannot be issued for a new rental while its operational state forbids rental use.

---

# 4. Concurrency-Sensitive Operations

Business-critical operations must remain valid under concurrent requests.

At minimum, consider and test:

- two users trying to rent the same item
- two simultaneous extensions of the same rental
- completion versus extension race
- availability change versus rental creation
- multiple concurrent financial mutations where applicable

A passing concurrency test must verify the final database state, not merely response codes.

---

# 5. Required Invariant

A concurrent request must not be able to create an invalid domain state that a sequential request could not create.

