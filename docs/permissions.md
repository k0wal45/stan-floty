# Stan Floty — RBAC & Permissions

The permission matrix is the contract for protected operations. When adding a new operation, define its required role before implementation.

---

# 1. Roles

## OWNER

Full tenant permissions, including:

- subscription/billing management
- user management
- all operational functionality
- analytics
- configuration

## MANAGER

Operational management, including:

- item management
- full rental operations
- reporting/analytics

MANAGER does not access SaaS billing/subscription administration.

## STAFF

Operational execution, including:

- item visibility
- check-out
- check-in
- recording payments
- rental extensions

STAFF must not access SaaS billing/subscription administration or user administration unless explicitly granted by a future permission model.

---

# 2. Authorization Matrix

| Capability | OWNER | MANAGER | STAFF |
|---|---:|---:|---:|
| View items | ✅ | ✅ | ✅ |
| Create item | ✅ | ✅ | ❌ |
| Edit item | ✅ | ✅ | ❌ |
| View rentals | ✅ | ✅ | ✅ |
| Create rental | ✅ | ✅ | ✅ |
| Extend rental | ✅ | ✅ | ✅ |
| Record payment | ✅ | ✅ | ✅ |
| Complete rental | ✅ | ✅ | ✅ |
| Cancel rental | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Manage SaaS billing | ✅ | ❌ | ❌ |

When business requirements change, update this matrix and its tests together.

---

# 3. Authorization Rules

Authorization is always checked on the server.

UI visibility is not authorization.

A hidden button does not protect a Server Action.

Every protected mutation MUST independently verify the user's role/permission.

Every tenant-scoped feature must include tests for:

- valid role can perform the operation
- insufficient role is rejected
- unauthenticated request is rejected
- direct invocation of the protected Server Action is still rejected when unauthorized

