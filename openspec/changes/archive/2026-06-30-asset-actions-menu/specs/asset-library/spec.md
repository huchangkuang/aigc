## ADDED Requirements

### Requirement: User can rename an asset display title

The system SHALL allow the authenticated owner to set a display title on an asset without modifying the original generation prompt stored in metadata.

#### Scenario: Rename success

- **WHEN** user sends `PATCH /assets/:id` with body `{ "title": "我的橘猫" }` for their asset
- **THEN** the asset metadata includes `title: "我的橘猫"` and `prompt` remains unchanged if it existed

#### Scenario: Title shown in asset grid

- **WHEN** an asset has `metadata.title` set
- **THEN** the assets page card heading displays the title instead of truncating `metadata.prompt`

### Requirement: User can soft-delete an asset

The system SHALL soft-delete assets by setting `deletedAt` and SHALL NOT remove the OSS object.

#### Scenario: Soft delete success

- **WHEN** user sends `DELETE /assets/:id` for their non-deleted asset
- **THEN** the asset record has `deletedAt` set and the asset no longer appears in `GET /assets`

#### Scenario: Delete other user's asset

- **WHEN** user sends `DELETE /assets/:id` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: User can fetch compose context for an asset

The system SHALL expose generation context needed to prefill the composer, resolved from the asset and its linked generation task when available.

#### Scenario: Compose context for video asset

- **WHEN** user requests `GET /assets/:id/compose-context` for a video asset linked to a task with prompt and image_urls
- **THEN** the response includes prompt, fresh signed image_urls, generation type, frames, aspect_ratio, and recamera fields when present on the task

#### Scenario: Compose context without reference images

- **WHEN** user requests compose context for an asset whose task has no image_urls
- **THEN** the response includes `imageUrls: []` and still includes prompt and generation type when available

### Requirement: Asset card exposes action menu

The web application SHALL provide a working overflow menu on each asset card with actions: rename, delete, generate similar, image only, prompt only.

#### Scenario: Delete requires confirmation

- **WHEN** user chooses Delete from the asset card menu
- **THEN** a confirmation dialog appears and the asset is only removed after confirm

#### Scenario: Menu does not trigger media preview

- **WHEN** user clicks the overflow menu button
- **THEN** the media lightbox does not open
