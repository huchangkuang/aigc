## ADDED Requirements

### Requirement: Completed generations appear in asset library

The system SHALL automatically create Asset records when generation tasks complete and media is persisted to OSS.

#### Scenario: Asset created after image generation

- **WHEN** an image generation task completes successfully
- **THEN** one or more Asset records exist linked to the task with type `image` and metadata including prompt

#### Scenario: Asset created after video generation

- **WHEN** a video generation task completes successfully
- **THEN** an Asset record exists with type `video` and metadata including frames and aspect_ratio when applicable

### Requirement: User can browse their assets

The system SHALL provide a paginated list of assets scoped to the authenticated user.

#### Scenario: List all assets

- **WHEN** user requests `GET /assets`
- **THEN** the response includes only that user's assets with id, type, createdAt, thumbnail or preview hint, and metadata summary

#### Scenario: Filter by type

- **WHEN** user requests `GET /assets?type=video`
- **THEN** the response includes only video assets for that user

### Requirement: User can view asset detail

The system SHALL return full asset detail including OSS-backed preview URL for owned assets.

#### Scenario: Get owned asset

- **WHEN** user requests `GET /assets/:id` for their asset
- **THEN** the response includes type, metadata, createdAt, taskId, and previewUrl

#### Scenario: Access other user's asset

- **WHEN** user requests `GET /assets/:id` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: Frontend asset page displays grid with preview

The web application SHALL provide an assets page showing user's generated images and videos with type filter and link to download or open preview.

#### Scenario: Assets page shows items

- **WHEN** logged-in user opens `/assets` with existing assets
- **THEN** the page displays a grid of previews with type badges

#### Scenario: Empty state

- **WHEN** logged-in user opens `/assets` with no assets
- **THEN** the page shows an empty state with link to generate page
