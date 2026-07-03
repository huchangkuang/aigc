### Requirement: Completed generations appear in asset library

The system SHALL automatically create Asset records when generation tasks complete and media is persisted to OSS.

#### Scenario: Asset created after image generation

- **WHEN** an image generation task completes successfully
- **THEN** one or more Asset records exist linked to the task with type `image` and metadata including prompt

#### Scenario: Asset created after video generation

- **WHEN** a video generation task completes successfully
- **THEN** an Asset record exists with type `video` and metadata including frames and aspect_ratio when applicable

### Requirement: Assets have a source dimension

The system SHALL store an `source` field on each Asset with values `material` (default, from `/generate`) or `short_video` (from short video project workflows).

#### Scenario: Material generation asset source

- **WHEN** an asset is created from the standard generation composer flow
- **THEN** the asset source is `material`

#### Scenario: Short video entity image source

- **WHEN** an asset is created from short video entity image generation
- **THEN** the asset source is `short_video` and metadata includes projectId and entityId

#### Scenario: Short video segment video source

- **WHEN** an asset is created from short video segment Seedance generation
- **THEN** the asset source is `short_video` and metadata includes projectId and segmentId

### Requirement: User can browse their assets

The system SHALL provide a paginated list of assets scoped to the authenticated user.

#### Scenario: List all assets

- **WHEN** user requests `GET /assets`
- **THEN** the response includes only that user's assets with id, type, source, createdAt, thumbnail or preview hint, and metadata summary

#### Scenario: Filter by type

- **WHEN** user requests `GET /assets?type=video`
- **THEN** the response includes only video assets for that user

#### Scenario: Filter by source

- **WHEN** user requests `GET /assets?source=short_video`
- **THEN** the response includes only assets with source `short_video` for that user

#### Scenario: Filter by source and type combined

- **WHEN** user requests `GET /assets?source=material&type=image`
- **THEN** the response includes only material image assets for that user

### Requirement: User can view asset detail

The system SHALL return full asset detail including OSS-backed preview URL for owned assets.

#### Scenario: Get owned asset

- **WHEN** user requests `GET /assets/:id` for their asset
- **THEN** the response includes type, metadata, createdAt, taskId, and previewUrl

#### Scenario: Access other user's asset

- **WHEN** user requests `GET /assets/:id` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: Frontend asset page displays grid with preview

The web application SHALL provide an assets page showing user's generated images and videos with source filter (全部 / 素材 / 短视频), format filter (全部 / 图片 / 视频), and link to download or open preview.

#### Scenario: Assets page shows items

- **WHEN** logged-in user opens `/assets` with existing assets
- **THEN** the page displays a grid of previews with type badges

#### Scenario: Empty state

- **WHEN** logged-in user opens `/assets` with no assets
- **THEN** the page shows an empty state with link to generate page

#### Scenario: Source and format filters

- **WHEN** user selects source 短视频 and format 图片 on the assets page
- **THEN** the page requests assets with `source=short_video&type=image` and displays only matching items

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
- **THEN** a confirmation dialog appears explaining the asset will be moved to trash (recoverable from the trash page) and the asset is only soft-deleted after confirm

#### Scenario: Menu does not trigger media preview

- **WHEN** user clicks the overflow menu button
- **THEN** the media lightbox does not open

### Requirement: User can list trashed assets

The system SHALL provide an API to list soft-deleted assets (`deletedAt IS NOT NULL`) scoped to the authenticated user, with optional type filter and signed preview URLs.

#### Scenario: List all trashed assets

- **WHEN** user requests `GET /assets/trash`
- **THEN** the response includes only that user's assets where `deletedAt` is set, ordered by `deletedAt` descending, each with id, type, createdAt, deletedAt, metadata summary, and previewUrl

#### Scenario: Filter trashed assets by type

- **WHEN** user requests `GET /assets/trash?type=video`
- **THEN** the response includes only soft-deleted video assets for that user

#### Scenario: Active assets excluded from trash list

- **WHEN** user requests `GET /assets/trash`
- **THEN** assets with `deletedAt IS NULL` are not included

### Requirement: User can restore a soft-deleted asset

The system SHALL allow the authenticated owner to restore a trashed asset by clearing `deletedAt`.

#### Scenario: Restore success

- **WHEN** user sends `POST /assets/:id/restore` for their soft-deleted asset
- **THEN** the asset has `deletedAt` cleared and appears in `GET /assets` but not in `GET /assets/trash`

#### Scenario: Restore non-trashed asset

- **WHEN** user sends `POST /assets/:id/restore` for an active asset
- **THEN** the system responds with HTTP 404

#### Scenario: Restore other user's asset

- **WHEN** user sends `POST /assets/:id/restore` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: User can permanently destroy a trashed asset

The system SHALL permanently remove a soft-deleted asset by deleting its OSS object and database record. This operation MUST NOT be available for active (non-trashed) assets.

#### Scenario: Permanent destroy success

- **WHEN** user sends `DELETE /assets/:id/permanent` for their soft-deleted asset
- **THEN** the OSS object at `ossKey` is deleted, the asset database row is removed, and the asset appears in neither `GET /assets` nor `GET /assets/trash`

#### Scenario: Destroy active asset rejected

- **WHEN** user sends `DELETE /assets/:id/permanent` for an asset with `deletedAt IS NULL`
- **THEN** the system responds with HTTP 404

#### Scenario: Destroy other user's asset

- **WHEN** user sends `DELETE /assets/:id/permanent` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: Frontend trash page displays grid with preview

The web application SHALL provide a trash page at `/trash` showing the user's soft-deleted assets with type filter, keyword search, preview, and download consistent with the asset library grid.

#### Scenario: Trash page shows trashed items

- **WHEN** logged-in user opens `/trash` with soft-deleted assets
- **THEN** the page displays a grid of previews with type badges and deleted date

#### Scenario: Trash empty state

- **WHEN** logged-in user opens `/trash` with no soft-deleted assets
- **THEN** the page shows an empty state indicating the trash is empty

#### Scenario: Sidebar navigation to trash

- **WHEN** logged-in user views the workspace sidebar
- **THEN** a fourth nav item links to `/trash` labeled 回收站

### Requirement: Trash card exposes restore and destroy actions

The web application SHALL provide an overflow menu on each trash page asset card with actions: restore and permanently destroy. Trash cards SHALL NOT expose rename, soft-delete, or compose actions.

#### Scenario: Restore from trash card

- **WHEN** user chooses Restore from the trash card menu and confirms
- **THEN** the asset is restored and removed from the trash grid after refresh

#### Scenario: Destroy requires confirmation

- **WHEN** user chooses Destroy from the trash card menu
- **THEN** a confirmation dialog appears warning the action is irreversible and the asset is only destroyed after confirm

#### Scenario: Trash card supports preview and download

- **WHEN** user interacts with a trash card preview or download control
- **THEN** the media lightbox or download link works the same as on the asset library page
