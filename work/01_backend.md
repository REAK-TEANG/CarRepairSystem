# PHP Backend Performance Optimization, Full Backend Audit & WebSocket Real-Time Synchronization

## 1. Your Role

Act as a senior PHP backend engineer, database performance specialist, API architect, and real-time systems engineer.

Your mission is to deeply inspect my existing project, understand its architecture, identify technical debt and performance bottlenecks, and implement reliable backend optimizations with WebSocket-based real-time synchronization.

**My requirements:**
- Backend technology: Unknown. Discover it by inspecting the existing codebase.
- Database: Discover the database engine, schema, relationships, and configuration.
- Real-time communication: WebSockets.
- Main priority: Reliable, low-latency synchronization across authorized users and connected clients.
- Scope: Backend only, including database, API contracts, and backend integration with the existing frontend.
- Existing functionality and business logic must be preserved.

Do not assume I am using Laravel, core PHP, a particular database, or a specific WebSocket library. Verify the actual stack before making decisions.

## 2. Mandatory Rules

1. Inspect before modifying.
2. Reuse existing architecture, utilities, dependencies, and conventions wherever practical.
3. Do not rewrite the entire backend simply because you prefer another architecture.
4. Do not introduce unnecessary frameworks, packages, services, or infrastructure.
5. Never delete files, database tables, routes, or functionality without verifying their purpose and dependencies.
6. Do not replace real database operations with mock data or hardcoded responses.
7. Do not claim performance improvements without measurements or supporting evidence.
8. Do not modify the frontend's design, UI, styling, or unrelated components.
9. Never expose credentials, environment variables, session tokens, or private user data in logs or WebSocket messages.
10. Back up or establish a reversible migration strategy before making risky changes.

## 3. Phase One — Complete Backend Codebase Audit

Before editing any code, inspect the backend systematically.

### A. Architecture and dependencies
- Identify the PHP version, framework, runtime, entry points, and application structure.
- Inspect Composer configuration, installed dependencies, autoloading, and dependency versions.
- Identify API routes, controllers, services, middleware, models, repositories, helpers, and background jobs.
- Inspect authentication, authorization, sessions, configuration, environment handling, and error reporting.
- Identify the deployment and hosting environment where possible.
- Trace the request lifecycle from API entry point to business logic and database operations.

### B. Database audit
- Inspect the database engine, schema, tables, relationships, constraints, indexes, and migration history.
- Identify duplicate or redundant queries, N+1 query patterns, full-table scans, inefficient joins, and missing indexes.
- Check pagination, filtering, sorting, aggregation, and transaction usage.
- Identify unnecessary queries, excessive database connections, and inefficient data retrieval.
- Review transaction boundaries, race conditions, deadlocks, and inconsistent updates.
- Check for missing foreign keys or integrity constraints where appropriate.
- Recommend schema changes only when evidence supports them.

### C. API and integration audit
- Inspect every relevant API endpoint, HTTP method, request validation rule, response structure, and error-handling path.
- Trace important operations from request through database commit to response.
- Identify slow endpoints, duplicate requests, excessive payloads, inconsistent status codes, and missing authorization checks.
- Verify compatibility with the existing frontend's expected API contracts.
- Identify operations that currently require manual page refreshes to display updated data.

### D. Technical debt and unused code
- Identify unused PHP files, unreachable functions, duplicate business logic, obsolete dependencies, dead routes, and redundant database operations.
- Verify references and runtime usage before classifying any code as unused.
- Distinguish confirmed dead code from code whose usage is uncertain.
- Remove only verified dead code when safe, and report the removals.

Deliver an audit report containing findings, severity, affected files, evidence, root causes, and recommended fixes.

## 4. Phase Two — Backend Performance Optimization

Prioritize measurable improvements rather than superficial code cleanup.

### Database performance
- Optimize expensive SQL queries and query execution plans.
- Add indexes based on actual query patterns and measured bottlenecks.
- Eliminate N+1 queries and redundant database calls.
- Select only required columns instead of retrieving entire records unnecessarily.
- Implement appropriate pagination and query limits.
- Use transactions for logically related writes.
- Reduce lock contention and avoid long-running transactions.
- Introduce caching only when useful, with explicit invalidation and consistency rules.

### PHP performance
- Remove unnecessary computation, repeated processing, and avoidable I/O.
- Reuse shared business logic instead of duplicating operations.
- Review connection management, serialization, file operations, and expensive external requests.
- Evaluate OPcache and PHP runtime settings when deployment access permits.
- Add asynchronous background processing only when the current infrastructure supports it and the use case justifies it.

### API performance
- Reduce unnecessary payload size and repeated requests.
- Keep response formats consistent and backward-compatible.
- Apply appropriate timeouts, error handling, and resource limits.
- Avoid adding caching or batching mechanisms that introduce stale data or incorrect business behavior.

Establish baseline measurements before optimization whenever possible. Compare the same representative operations after changes, including response latency, query counts, database execution time, and throughput where measurable.

## 5. Phase Three — Design and Implement WebSocket Real-Time Synchronization

First inspect the current architecture and hosting constraints. Then choose a suitable WebSocket implementation compatible with the existing project.

Evaluate options based on:
- PHP version and framework compatibility.
- Persistent process and hosting support.
- Existing infrastructure and deployment capabilities.
- Authentication and per-user or per-role authorization.
- Expected concurrent connections and message volume.
- Operational complexity, reliability, and maintenance costs.

Do not select a WebSocket library before verifying compatibility. If the existing hosting cannot support persistent WebSocket connections, explain the limitation and propose a practical compatible deployment approach before proceeding.

### A. Real-time event architecture

Implement a clear event flow:

1. An authorized client submits an operation through the existing API.
2. PHP validates the request, authenticates the user, and authorizes the operation.
3. The backend applies business rules and persists the change in MySQL.
4. After the transaction successfully commits, the backend publishes the corresponding event.
5. The WebSocket server delivers the event to authorized, relevant connections.
6. Connected clients update the affected data without requiring a full-page refresh.
7. If delivery fails or a client disconnects, provide a recovery mechanism.

Database persistence must remain authoritative. A WebSocket message must never be treated as proof that a database operation succeeded.

Where reliable event delivery is required, assess an outbox pattern, durable queue, or equivalent mechanism to prevent committed database changes from silently losing their corresponding events.

### B. Event design

Define a consistent event contract containing appropriate fields, such as:
- Event type.
- Event identifier.
- Entity type and identifier.
- Relevant change or safe payload.
- Event timestamp and version where useful.

Use explicit event names that reflect actual business operations.

Avoid broadcasting entire database records by default. Send only the information clients need, and require clients to fetch authorized details through existing APIs when appropriate.

### C. Authentication and authorization

- Authenticate WebSocket connections using a secure, supported mechanism.
- Validate authorization for subscriptions, channels, rooms, and individual events.
- Restrict messages to the correct user, role, branch, tenant, or other access boundary where applicable.
- Do not trust client-supplied user IDs, room names, or entity IDs as authorization.
- Protect against unauthorized subscriptions, replayed operations, message abuse, and excessive connection attempts.
- Avoid placing long-lived secrets in URLs or logs.
- Handle expired sessions and revoked permissions safely.

Never broadcast sensitive data globally just to simplify implementation.

### D. Reliability and synchronization

Implement and test:
- Connection establishment and graceful disconnection.
- Heartbeats or liveness checks where supported.
- Reconnection with bounded exponential backoff and jitter.
- Resubscription and reauthentication where necessary.
- Duplicate-event handling and idempotent client processing.
- Event ordering or entity version checks where ordering matters.
- Recovery of changes missed while disconnected.
- A REST/API resynchronization mechanism when event history is unavailable.
- Backpressure, message size limits, connection limits, and graceful shutdown.

Do not assume WebSocket delivery is guaranteed or exactly once.

### E. Performance and scalability

- Avoid broadcasting every event to every connected client.
- Use targeted channels or subscriptions.
- Avoid blocking database requests while sending WebSocket messages.
- Assess the need for a message broker or shared event transport if multiple backend or WebSocket processes are required.
- Prevent slow clients from blocking unrelated clients.
- Measure event publication latency, end-to-end synchronization latency, dropped connections, and message delivery failures where instrumentation permits.

Keep the initial implementation as simple as possible while meeting the reliability and performance requirements.

## 6. Phase Four — Security and Data Integrity

Audit and fix relevant vulnerabilities, including:
- SQL injection and unsafe query construction.
- Missing input validation and output encoding.
- Broken authentication and authorization.
- Insecure session or token handling.
- CSRF exposure for cookie-authenticated state-changing HTTP requests.
- Sensitive information in API responses, logs, or WebSocket events.
- Missing rate limits or resource exhaustion protections.
- Unsafe file uploads and path handling where applicable.
- Race conditions and duplicate writes.
- Inadequate transaction and error handling.

Preserve existing legitimate access rules. Do not weaken authentication to make real-time connections easier.

## 7. Phase Five — Testing and Verification

Test the existing functionality and all modified backend paths.

### Required test categories
- API regression tests.
- Database integrity and transaction tests.
- Authentication and authorization tests.
- WebSocket connection and subscription tests.
- Real-time synchronization across multiple authorized clients.
- Unauthorized event subscription and data leakage tests.
- Reconnection and missed-event recovery tests.
- Duplicate-event and out-of-order-event tests where relevant.
- Concurrent writes and race-condition tests.
- Failure handling when the database, event transport, or WebSocket server is unavailable.
- Performance comparisons before and after optimization.

Use the project's existing testing framework where available. If tests are missing, introduce a minimal appropriate test setup rather than adding an unnecessarily large testing stack.

Never use production data for destructive tests. Use a safe test environment.

If a test cannot run because infrastructure or credentials are unavailable, report that limitation explicitly. Do not mark an unexecuted test as passed.

## 8. Phase Six — Deployment and Operational Readiness

Verify that the implementation can actually run in the target environment.

Review:
- Required PHP extensions and Composer dependencies.
- Environment configuration without exposing secrets.
- WebSocket process management and automatic restart.
- Reverse proxy and WebSocket upgrade configuration where applicable.
- HTTPS/WSS requirements and secure deployment.
- Allowed origins, authentication, connection limits, and timeouts.
- Logging, health checks, and error monitoring.
- Queue or broker dependencies if introduced.
- Graceful shutdown and restart behavior.
- Database migration safety and rollback procedures.

Document any infrastructure changes separately from code changes. Do not assume a locally working WebSocket server is automatically production-ready.

## 9. Implementation Rules

After the audit, work in small, verifiable stages:

1. Establish the current architecture and baseline.
2. Identify critical bugs, bottlenecks, and architectural constraints.
3. Present the proposed WebSocket architecture and significant trade-offs.
4. Fix high-priority correctness and security issues.
5. Implement measured performance optimizations.
6. Implement real-time event publishing and delivery.
7. Add recovery, authorization, monitoring, and tests.
8. Run regression tests and compare performance.
9. Review every changed file for unintended consequences.

For significant architectural decisions or destructive changes, stop and explain the risk before proceeding.

Do not stop after generating a report when implementation is safe, authorized, and possible. Continue through the approved plan, verifying each stage.

## 10. Final Deliverables

Provide a final report with:

1. **Architecture discovered:** Actual PHP framework, PHP version, database, hosting constraints, and current API structure.
2. **Problems found:** Severity, evidence, root cause, and affected files.
3. **Files changed:** Exact paths and the purpose of each change.
4. **Database changes:** Indexes, migrations, constraints, or query changes and their rollback plans.
5. **Performance results:** Before-and-after measurements using comparable tests, including limitations.
6. **WebSocket architecture:** Chosen implementation, event flow, authentication, authorization, and recovery strategy.
7. **Real-time verification:** Which operations synchronize, which clients receive events, and measured latency where available.
8. **Security improvements:** Issues fixed and any remaining risks.
9. **Test results:** Passed, failed, skipped, and blocked tests.
10. **Deployment instructions:** Required services, environment variables, commands, configuration, and operational checks.
11. **Remaining technical debt:** Known limitations and recommended next steps.

## Definition of Done

The task is complete only when:
- The actual backend architecture has been inspected rather than assumed.
- High-priority issues have been addressed or clearly documented.
- Performance improvements are supported by measurements where feasible.
- Relevant committed database changes generate appropriate real-time events.
- Only authorized clients receive relevant updates.
- Disconnected clients can recover missed changes.
- Existing APIs and business workflows remain compatible.
- Automated tests and practical verification have been performed to the extent the environment allows.
- Deployment requirements and unresolved limitations are documented.

**Final principle:** Optimize for correctness, real-time synchronization, measured performance, security, and maintainability. Do not sacrifice data integrity or existing functionality for superficial speed gains.