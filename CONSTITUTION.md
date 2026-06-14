# CONSTITUTION.md — Project Law

# Ratified: [DATE] | Team: [TEAM NAME] | Version: 1.1

# RULE: Any change to this document requires unanimous team approval.

## ARTICLE 1 — TECH STACK (immutable)

Runtime: Node.js 20 LTS (JavaScript / TypeScript)
Backend: Express.js 4.x
Database: MongoDB 7.x — Mongoose ODM
Frontend: React 18 + Vite (JavaScript / TypeScript)
Styling: Tailwind CSS — NO CSS-in-JS, NO custom CSS unless Tailwind insufficient
Package manager: npm (project-wide)

> MongoDB was chosen for schema flexibility. All queries must use Mongoose to prevent NoSQL injection.

## ARTICLE 2 — CODING STANDARDS

- **TypeScript (if used):** strict mode (`strict: true`) — no implicit any.
- **JavaScript:** ES6+ with `"type": "module"`; avoid `var`, prefer `const`/`let`.
- **Formatter:** Prettier — auto-format on save. Config: `singleQuote: true, semi: false, trailingComma: "all"`.
- **Linter:** ESLint + Airbnb config (adapted). **Zero warnings** before submission.
- **Max function length:** 40 lines (refactor if longer).
- **Max file length:** 300 lines (split into modules/components).
- **Comments:** explain WHY, not WHAT. Remove TODO before final submission.
- **Naming:** camelCase for variables/functions, PascalCase for classes/components, UPPER_SNAKE for constants.

## ARTICLE 3 — SECURITY POLICIES (non-negotiable)

- **Authentication:** Google OAuth 2.0 for students; Admin credentials use bcrypt with cost ≥ 12. NEVER plain text.
- **Secrets:** environment variables ONLY (`.env`). Never commit real credentials.
- **Database:** Use Mongoose query builders — **zero tolerance** for raw string queries with user input.
- **Input validation:** Validate every request body/query/params with Zod (or Joi).
- **CORS:** Whitelist frontend origin(s) only — no wildcard `*` in production.
- **HTTP headers:** Use `helmet` middleware. Set cookies with `httpOnly` and `secure` flags.
- **Rate limiting:** Apply to login and API routes to prevent brute force.

## ARTICLE 4 — TESTING REQUIREMENTS

- **Coverage:** ≥ 80% for all new service/business logic code.
- **Unit tests:** Required for all services/business logic (Jest).
- **Integration tests:** Required for all API endpoints — happy + error paths (Supertest).
- **E2E tests:** Optional but encouraged for critical flows (e.g., booking, room selection).
- **No merge/deploy** if any existing test breaks.

## ARTICLE 5 — AI AGENT RULES

- Read `AGENTS.md` before starting any session.
- Review agent plan BEFORE approving execution.
- **Human-Led Refactoring** after every 3–5 agent tasks.
- All agent-generated code must pass the Pre-Commit Checklist (lint, format, tests).
- Never approve agent output you cannot explain to another team member.

## ARTICLE 6 — REVIEW PROCESS

- **Code review:** Synchronous on scheduled review sessions (e.g., weekly).
- **Spec review:** Before any implementation — no code before spec approval.
- **Architecture changes:** Require a Constitution amendment vote (unanimous).
- **Emergency fix:** Allowed with 1 team member approval + post-mortem within 24 hours.

---

_This constitution is the single source of truth for the project. All team members must abide by it._
