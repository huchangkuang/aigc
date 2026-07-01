## ADDED Requirements

### Requirement: Active generation tasks can be queried without asset URLs

The system SHALL expose `GET /generation-tasks/active` for authenticated users, returning only tasks in `pending` or `processing` status with fields sufficient for progress display (`id`, `status`, `errorMessage`, `type`, `createdAt`), without asset data or signed OSS URLs.

#### Scenario: List active tasks

- **WHEN** user requests `GET /generation-tasks/active` and has tasks in `pending` or `processing`
- **THEN** the response includes only those tasks with status fields and no `previewUrl` or asset signing

#### Scenario: No active tasks

- **WHEN** user requests `GET /generation-tasks/active` and all tasks are `done` or `failed`
- **THEN** the response is an empty array

#### Scenario: Active endpoint excludes other users tasks

- **WHEN** user requests `GET /generation-tasks/active`
- **THEN** the response includes only tasks owned by that user

## MODIFIED Requirements

### Requirement: User can query own generation tasks

The system SHALL allow authenticated users to list and retrieve their generation tasks with current status. The full list endpoint `GET /generation-tasks` SHALL include signed preview URLs for assets and is intended for initial load and post-completion refresh, not for high-frequency status polling.

#### Scenario: List recent tasks

- **WHEN** user requests `GET /generation-tasks`
- **THEN** the response includes only tasks owned by that user ordered by createdAt desc

#### Scenario: Get single task detail

- **WHEN** user requests `GET /generation-tasks/:id` for their task
- **THEN** the response includes status, type, inputParams, errorMessage, and linked asset ids when done
