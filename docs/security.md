# Stan Floty — Security, Tenant Isolation, PII & Auditability

Tenant isolation failures are critical defects.

---

# 1. Tenant Isolation

Every tenant-owned read, insert, update, or delete MUST be scoped to the authenticated tenant.

The application MUST NOT trust `tenant_id` supplied by the browser.

Correct pattern:

```ts
const session = await requireAuthenticatedUser();
const tenantId = session.tenantId;
```

Incorrect pattern:

```ts
const tenantId = input.tenantId;
```

unless the value is independently verified against trusted server-side context.

---

# 2. Cross-Tenant Relations

The following relationships MUST remain inside the same tenant:

- User → Tenant
- Item → Tenant
- Rental → Tenant
- Payment → Tenant
- Rental → Item
- Payment → Rental
- Rental Extension → Rental

A cross-tenant relation MUST be rejected.

---

# 3. Authorization

Authorization is always checked on the server.

UI visibility is not authorization.

A hidden button does not protect a Server Action.

Every protected mutation MUST independently verify the user's role/permission.

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

Also test:

- forged/client-supplied `tenant_id`
- missing authentication
- wrong role
- cross-tenant foreign-key relationships
- direct invocation of protected Server Actions

Security tests MUST NOT rely only on hidden UI controls.

---

# 5. PII

Customer data may include:

- full name
- phone number
- PESEL/NIP or another customer identifier

Rules:

- never log PESEL/NIP or other PII
- do not expose unnecessary customer fields to clients
- do not return more data than the requesting screen requires
- avoid storing duplicated PII without a business reason
- preserve existing data-retention and deletion policies when they are introduced

Never log passwords, authentication tokens, session secrets, full payment credentials, or unnecessary customer PII.

---

# 6. Auditability

For operations that materially change operational or financial state, the architecture should support identifying:

- who performed the action
- which tenant it affected
- when it happened
- what entity changed
- what business operation occurred

When an audit-log subsystem exists, critical mutations MUST write audit entries as part of the same business operation/transaction when appropriate.

Do not put PII or secrets into generic logs.

---

# 7. Logging & Observability

Logs must help diagnose technical problems without exposing secrets or unnecessary personal data.

Prefer structured technical context such as:

- operation name
- tenant identifier where appropriate and safe
- entity identifier
- request/correlation identifier
- error category
