## MODIFIED Requirements

### Requirement: Assets tab supports manual reference image generation

The system SHALL allow the user to manually trigger image generation for each parsed entity. Generated images SHALL appear in that entity's reference image history. The entity field `assetId` SHALL represent only the user-adopted reference image used for video editing, and MUST NOT be updated automatically when a generation task completes.

#### Scenario: Generate entity image

- **WHEN** user sends `POST /short-video/projects/:id/entities/:entityId/generate-image` with optional prompt override
- **THEN** an image GenerationTask is created, entity `imageTaskId` is set, and on task completion an Asset with source `short_video` and metadata linking `shortVideoProjectId` and `shortVideoEntityId` is created without changing entity `assetId`

#### Scenario: Skip entity images allowed

- **WHEN** user navigates to 视频编辑 without generating or adopting any entity reference images
- **THEN** the system does not block segment parsing or video generation

## ADDED Requirements

### Requirement: Entity reference image history and preview

The system SHALL expose each parsed entity's reference image candidates (AI-generated and uploaded) as an ordered history list scoped to the project and entity.

#### Scenario: List entity reference images

- **WHEN** user requests `GET /short-video/projects/:id/entities/:entityId/images` for an owned project and valid entity
- **THEN** the response includes image items with id, previewUrl, createdAt, and adopted flag where adopted is true when item id equals entity assetId, ordered by createdAt descending

#### Scenario: List empty history

- **WHEN** user requests entity images for an entity with no generated or uploaded reference images
- **THEN** the response items array is empty

### Requirement: User can adopt an entity reference image

The system SHALL allow the user to explicitly adopt one historical reference image as the entity's active reference for video editing.

#### Scenario: Adopt reference image

- **WHEN** user sends `POST /short-video/projects/:id/entities/:entityId/adopt-image` with `{ "assetId": "..." }` for an asset that belongs to the user, has source `short_video`, type `image`, is not deleted, and metadata matches the project and entity
- **THEN** entity `assetId` is set to the given asset id

#### Scenario: Reject adopt for foreign asset

- **WHEN** user sends adopt-image with an asset that does not match the project and entity metadata
- **THEN** the system responds with HTTP 400 or 404

### Requirement: User can upload a custom entity reference image

The system SHALL allow the user to upload a local image file as a reference image candidate for a parsed entity without automatically adopting it.

#### Scenario: Upload entity reference image

- **WHEN** user uploads a file via storage upload and sends `POST /short-video/projects/:id/entities/:entityId/upload-image` with `{ "ossKey": "...", "mimeType": "..." }`
- **THEN** an Asset with source `short_video`, type `image`, and metadata linking the project and entity is created and entity `assetId` is unchanged

### Requirement: Assets tab UI shows history and adopt controls

The web application SHALL display each entity's reference image preview, history thumbnails below the preview, an adopt action, and local upload on the project assets page.

#### Scenario: Preview latest without adopt

- **WHEN** user generates a new reference image and the task completes
- **THEN** the UI shows the new image in the main preview and in the history list, does not show adopted state unless entity assetId matches that image, and offers an adopt control

#### Scenario: Adopted badge

- **WHEN** the main preview displays the entity's adopted reference image (preview matches entity assetId)
- **THEN** the UI shows an adopted indicator on the preview

#### Scenario: Local upload adds to history

- **WHEN** user uploads a local image for an entity
- **THEN** the uploaded image appears in the history list and main preview without changing entity assetId until user adopts
