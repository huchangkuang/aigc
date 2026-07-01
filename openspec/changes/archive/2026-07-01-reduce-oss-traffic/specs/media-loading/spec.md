## ADDED Requirements

### Requirement: Polling uses lightweight active task endpoint

The frontend SHALL poll `GET /generation-tasks/active` while any task is `pending` or `processing`, and SHALL NOT poll the full `GET /generation-tasks` endpoint on an interval.

#### Scenario: Active tasks present

- **WHEN** the generate page detects one or more tasks in `pending` or `processing` status
- **THEN** it polls `/generation-tasks/active` every 5 seconds instead of `/generation-tasks`

#### Scenario: All tasks complete

- **WHEN** a poll of `/generation-tasks/active` returns an empty array after previously having active tasks
- **THEN** the frontend fetches `/generation-tasks` once to load preview URLs and assets

#### Scenario: Initial page load

- **WHEN** the generate page mounts
- **THEN** it fetches `/generation-tasks` once for full task and asset data

### Requirement: Stable preview URLs across poll cycles

The frontend SHALL preserve existing `previewUrl` values for assets whose `id` and `ossKey` are unchanged when merging polled task data, so that media elements do not receive a new `src` unnecessarily.

#### Scenario: Merge after active poll

- **WHEN** active poll updates task status but assets are unchanged
- **THEN** existing `previewUrl` values on rendered media are not replaced

#### Scenario: New asset appears

- **WHEN** a task transitions to `done` and a new asset is present in the full list response
- **THEN** the new asset receives a `previewUrl` from the API and is rendered

### Requirement: Polling pauses when tab is hidden

The frontend SHALL stop the polling interval when `document.visibilityState` is `hidden` and resume when it becomes `visible`.

#### Scenario: Tab hidden

- **WHEN** user switches to another browser tab
- **THEN** the polling interval is cleared and no further poll requests are sent until visible again

#### Scenario: Tab visible again

- **WHEN** user returns to the generate page tab
- **THEN** the frontend immediately refreshes task data once and restarts polling if active tasks exist

### Requirement: Video thumbnails in grid views do not preload full video

List and grid components (`GenerationHistoryGrid`, asset cards) SHALL use thumbnail mode for video assets, which MUST NOT set `<video src>` until the user opens the lightbox preview.

#### Scenario: Video in history grid

- **WHEN** a completed video asset is shown in the generation history grid
- **THEN** no HTTP request is made to OSS for the video file until user clicks to open lightbox

#### Scenario: Video in main preview panel

- **WHEN** the latest output asset is shown in the main preview panel after generation completes
- **THEN** the full video MAY be loaded for inline preview
