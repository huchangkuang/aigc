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
