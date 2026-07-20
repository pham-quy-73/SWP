---
description: Codebase Production Readiness and Security Review Workflow
---

# Defensive Code Review & Production Readiness Workflow

Follow these structured steps when conducting a code review or auditing production readiness for this project.

## Step 1: Authentication & Authorization Review

- Verify JWT generation, secret management, and expiration times.
- Check that routes requiring user authentication use `auth` middleware.
- Confirm role-based checks (`CUSTOMER`, `MANAGER`, `ADMIN`) are enforced on sensitive endpoints.
- Ensure resources scope queries to the authenticated user ID (`user_id`).

## Step 2: Input Validation & Controller Safety

- Inspect API input handling in request bodies, query params, and route parameters.
- Verify payload fields are validated and sanitized before database calls.
- Ensure array and nested object operations do not allow unexpected schema injections.

## Step 3: Transaction & Inventory Resiliency

- Verify multi-document operations (orders, stock reduction, status updates) use MongoDB sessions/transactions where atomicity is required.
- Check for race conditions in variant inventory updates during checkout.

## Step 4: File Upload & Media Handling

- Inspect Multer middleware configuration for file size limits and MIME type filtering.
- Ensure uploaded file paths are properly sanitized before saving to disk.
- Verify image URL helper methods correctly format absolute and relative static URLs.

## Step 5: Error Handling & Logging

- Ensure global error handler returns consistent JSON error structures (`code`, `message`).
- Confirm stack traces and sensitive database credentials are excluded from production error responses.
- Verify sensitive user parameters (passwords, tokens) are stripped from loggers.

## Step 6: Frontend State & Component Performance

- Inspect React Query / Zustand store interactions for proper cache invalidation and cleanup.
- Check for component memory leaks or dangling state references across page switches.

## Step 7: Sub-Agent Execution & Verification Task Breakdown

When running a production review across large projects:
- **Browser Sub-Agent**: Use browser sub-agents to verify UI workflows (e.g. checkout, prescription image view, manager dashboard widgets).
- **Backend Route Review Sub-Agent**: Parallelize inspection of backend API controllers (`OrderController.js`, `DashboardController.js`, `RefundController.js`).
- **Frontend State Review Sub-Agent**: Parallelize inspection of frontend store hooks (`useCheckoutFlow.js`, `usePrescriptionStore.js`, `useCartStore.js`).

---

## Production Audit Checklist

- [ ] **Auth**: JWT verification present on protected routes (`auth.js`).
- [ ] **RBAC**: Customer vs Manager vs Admin permission validation present.
- [ ] **Transactions**: Multi-document operations (Order creation + stock update) use MongoDB session transactions.
- [ ] **File Upload**: Multer MIME filter, file size limit (5MB), and filename sanitization enforced.
- [ ] **Static Assets**: Helper `getDisplayImageUrl` properly resolves relative and absolute server URLs without 404s.
- [ ] **Error Handling**: Standardized JSON error response (`code`, `message`) returned without sensitive stack trace leaks in production.
- [ ] **Prescription Flow**: Single and multi-item orders properly separate image uploads vs manual OD/OS diopter inputs.
- [ ] **State Cleanup**: Zustand stores (`usePrescriptionStore`) reset form data when changing products or submitting orders.
- [ ] **Dashboard Metrics**: Analytics endpoints filter out cancelled orders and compute top products & lenses accurately.


