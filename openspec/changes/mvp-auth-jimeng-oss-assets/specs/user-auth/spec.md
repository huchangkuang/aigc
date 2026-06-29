## ADDED Requirements

### Requirement: Preset users are seeded on application startup

The system SHALL create user accounts from the `PRESET_USERS` environment variable at startup or via database seed. Each preset entry MUST include email and password. The system MUST NOT expose a public registration endpoint.

#### Scenario: Seed creates preset account

- **WHEN** the API starts with `PRESET_USERS=admin@example.com:secret123`
- **THEN** a user with email `admin@example.com` exists in the database with a bcrypt password hash

#### Scenario: Registration endpoint unavailable

- **WHEN** an unauthenticated client sends `POST /auth/register`
- **THEN** the system responds with HTTP 404 or 405

### Requirement: User can log in with email and password

The system SHALL authenticate preset users via email and password and return a JWT access token on success.

#### Scenario: Successful login

- **WHEN** a preset user submits valid email and password to `POST /auth/login`
- **THEN** the response includes a JWT access token and user id/email

#### Scenario: Invalid credentials

- **WHEN** a client submits wrong password to `POST /auth/login`
- **THEN** the system responds with HTTP 401 and no token

### Requirement: Protected API routes require valid JWT

The system MUST reject unauthenticated access to generation, asset, and task endpoints.

#### Scenario: Missing token

- **WHEN** a client calls `GET /assets` without Authorization header
- **THEN** the system responds with HTTP 401

#### Scenario: Valid token

- **WHEN** a client calls `GET /assets` with a valid Bearer JWT
- **THEN** the system processes the request for the authenticated user

### Requirement: Frontend redirects unauthenticated users to login

The web application MUST prevent access to workspace pages without a valid session token.

#### Scenario: Unauthenticated visit to generate page

- **WHEN** a user without token navigates to `/generate`
- **THEN** the user is redirected to `/login`

#### Scenario: Authenticated visit to login page

- **WHEN** a logged-in user navigates to `/login`
- **THEN** the user is redirected to `/generate` or home workspace
