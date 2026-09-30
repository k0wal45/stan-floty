# Stan Floty — Testing Contract for AI Development

Tests are part of implementation, not a separate phase.

---

# 1. Core Rule: Test-First

**Tests MUST be written before the feature implementation code.**

The required order is:

```text
1. Define the feature contract / acceptance criteria
2. Define relevant edge cases and domain invariants
3. Write the tests
4. Confirm the tests initially fail for the expected reason
5. Implement the feature
6. Run the tests
7. Fix implementation defects, not tests, when the contract is correct
8. Refactor while keeping tests green
```

Do NOT use this workflow:

```text
implement feature → feature works → add tests later
```

For AI-assisted development, tests written after implementation are considered weaker evidence because they can unintentionally encode the implementation's behavior instead of the intended business contract.

### Important Clarification

Test-first does not mean inventing tests without defining the feature first.

For every feature:

```text
FEATURE CONTRACT / ACCEPTANCE CRITERIA
        ↓
TESTS UNDER THAT FEATURE CONTRACT
        ↓
FEATURE IMPLEMENTATION
        ↓
TEST EXECUTION
        ↓
REFACTOR
```

The agent should describe the feature behavior first, then write its tests before writing the production implementation.

---

# 2. Test Pyramid

## Unit Tests

Use for pure logic such as:

- price calculations
- extension calculations
- payment balance
- payment status
- date calculations
- utilization calculations
- validation helpers

## Integration Tests

Use for:

- database behavior
- transactions
- Server Actions
- authorization
- tenant isolation
- cross-tenant protection
- domain invariants
- concurrency-sensitive operations

These tests are especially important for this project.

## E2E Tests

Use for critical end-to-end workflows rather than every small UI component.

At minimum, cover the main rental lifecycle:

```text
login
→ create/view item
→ create rental
→ record payment
→ extend rental
→ verify balance
→ complete rental
```

Also cover critical authorization and tenant-isolation user journeys where practical.

Do not replace integration tests with E2E tests when the behavior can be tested reliably at a lower level.

---

# 3. Mandatory Domain-Test Coverage

Every critical domain invariant defined in `docs/domain.md` MUST have automated test coverage.

Examples:

- payments cannot have a negative or zero amount
- rental extension cannot shorten the rental
- `rate_snapshot` and `rate_unit_snapshot` cannot change after rental creation
- a rental must belong to the same tenant as its item
- a payment must belong to the same tenant as its rental
- conflicting active rentals for the same item must not be possible
- financial totals must remain internally consistent

---

# 4. Mandatory Security Tests

Every tenant-scoped feature must test at least:

```text
Tenant A can read A      ✅
Tenant A cannot read B   ❌
Tenant A can update A    ✅
Tenant A cannot update B ❌
Tenant A can delete A    ✅ where deletion is allowed
Tenant A cannot delete B ❌
```

Also test forged/client-supplied `tenant_id`, missing authentication, wrong role, cross-tenant foreign-key relationships, and direct invocation of protected Server Actions.

See `docs/security.md` for the full security contract.

---

# 5. Mandatory Financial Tests

Financial tests MUST cover:

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

See `docs/financial-rules.md` for examples and financial rules.

---

# 6. Mandatory Concurrency Tests

Where two requests can race, tests must verify that the final state remains valid.

At minimum, cover:

- two users trying to rent the same item
- two simultaneous extensions of the same rental
- completion versus extension race
- availability change versus rental creation
- multiple concurrent financial mutations where applicable

A passing concurrency test must verify final database state, not merely response codes.

See `docs/availability.md` for the availability/concurrency contract.

---

# 7. Test Quality Rules

Prefer behavior-based assertions:

```text
input → business operation → observable result
```

over implementation-detail assertions:

```text
input → mocked internal function was called
```

Mocks are allowed when appropriate, but MUST NOT replace integration tests for database integrity, authorization, tenant isolation, or transaction behavior.

Tests must not depend on execution order or shared mutable state.

Do not add tests that merely duplicate framework behavior.

---

# 8. Failing Tests — Agent Rules

When a test fails:

1. Determine whether the failure is in the implementation, test, or environment.
2. If the test reflects intended domain behavior, fix the implementation.
3. Never change a test merely to make it green.
4. Never weaken an assertion just because implementation is inconvenient.
5. Do not disable or skip a failing test without an explicit documented reason.
6. If business behavior intentionally changes, update the feature contract, relevant documentation, and tests together.

The agent MUST treat unexpected test failures as useful evidence, not as obstacles to bypass.

---

# 9. Repository Test Workflow

Before implementation:

1. inspect existing tests
2. identify relevant invariants
3. define acceptance criteria
4. write tests
5. run tests and confirm expected initial failure

After implementation:

1. run targeted tests
2. run related integration tests
3. run E2E tests when the feature affects a critical workflow
4. run TypeScript typecheck
5. run lint
6. inspect the final diff

---

# 10. Test Fixtures

Use reusable fixtures/factories rather than rebuilding test setup in every test.

Prefer shared helpers such as:

```text
createTestTenant()
createTestUser()
createTestItem()
createTestRental()
createTestPayment()
```

Tests should be isolated and should make tenant boundaries explicit.
