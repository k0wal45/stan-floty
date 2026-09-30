# Stan Floty — Financial Rules

This document defines monetary storage, payment-status derivation, ledger behavior, and required financial invariants/tests.

---

# 1. Monetary Storage

All monetary values MUST be stored as integer grosz.

Examples:

```text
10000 = 100.00 PLN
1 = 0.01 PLN
```

Never store monetary values as floating-point numbers.

---

# 2. Payment Status

Payment status is derived dynamically:

```text
Total Paid = Σ payments.amount
Balance Due = rental.total_price - Total Paid
```

Status:

```text
PAID            => Balance Due <= 0
PARTIALLY_PAID  => Total Paid > 0 AND Balance Due > 0
UNPAID          => Total Paid = 0
```

Do not create a separate mutable `payment_status` field unless explicitly required by a future architectural decision.

---

# 3. Financial Ledger

Payments are financial history.

Do not silently mutate historical payment records to repair mistakes.

If corrections or refunds are introduced (e.g., due to rental cancellation), implement an explicit ledger mechanism. A refund MUST be recorded as a new payment entry with a negative `amount` (e.g., `-20000` for a 200.00 PLN refund), rather than overwriting or deleting the original historical payment fact.

When a rental is `CANCELLED`, future unbilled charges must be voided, but the existing payment ledger entries remain intact.

---

# 4. Rental Pricing and Extensions

`rate_snapshot` and `rate_unit_snapshot` are fixed when the rental is created.

The billing unit determines how time is measured:

```text
HOUR   → count of billing-hour periods
DAY    → count of billing-day periods (24-hour cycles, grace period applies)
WEEK   → count of billing-week periods (7 × 24-hour cycles)
MONTH  → count of billing-month periods (calendar months)
```

For extensions:

```text
Extra Cost = Δunits × rate_snapshot
```

The extension operation must update the rental price, rental end date, extension record, and optional immediate payment atomically as defined in `docs/domain.md`.

---

# 5. Financial Test Requirements

Financial tests MUST cover at least:

- zero where valid
- one grosz
- ordinary values
- multiple partial payments
- exact payment
- overpayment
- extension charges
- cumulative extensions
- negative-value rejection
- exact integer result validation

Example:

```text
Total = 10000
Payments = 3000 + 2500 + 4500
Balance = 0
Status = PAID
```

Example overpayment:

```text
Total = 10000
Payments = 12000
Balance = -2000
Status = PAID
```

The expected treatment of overpayments MUST remain consistent with the financial model.
