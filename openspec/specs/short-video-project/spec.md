### Requirement: User can browse short video projects

The system SHALL provide a list of short video projects scoped to the authenticated user.

#### Scenario: List projects

- **WHEN** user requests `GET /short-video/projects`
- **THEN** the response includes id, title, updatedAt, and summary counts (entity count, segment count when available) ordered by updatedAt descending

#### Scenario: Empty project list

- **WHEN** user has no projects
- **THEN** the list response is an empty array

### Requirement: User can create and manage a short video project

The system SHALL allow the authenticated user to create, read, update, and delete owned short video projects.

#### Scenario: Create project

- **WHEN** user sends `POST /short-video/projects` with `{ "title": "我的短剧" }`
- **THEN** a project is created with empty `rawScript`, null `parsedEntities`, and null `segments`

#### Scenario: Get owned project

- **WHEN** user requests `GET /short-video/projects/:id` for their project
- **THEN** the response includes title, rawScript, parsedEntities, segments, createdAt, and updatedAt

#### Scenario: Update script

- **WHEN** user sends `PATCH /short-video/projects/:id` with `{ "rawScript": "..." }`
- **THEN** the project rawScript is updated and updatedAt changes

#### Scenario: Delete project

- **WHEN** user sends `DELETE /short-video/projects/:id` for their project
- **THEN** the project is removed and subsequent GET returns 404

#### Scenario: Access other user's project

- **WHEN** user requests a project owned by another user
- **THEN** the system responds with HTTP 404

### Requirement: Global navigation includes short video module

The web application SHALL add a sidebar nav item linking to `/short-video` labeled 短视频.

#### Scenario: Nav item visible

- **WHEN** logged-in user views the workspace sidebar
- **THEN** a nav item 短视频 links to `/short-video`

### Requirement: Project page has inner sidebar with three tabs

The web application SHALL provide a project layout at `/short-video/[projectId]` with an inner sidebar linking to 剧本, 资产, and 视频编辑 routes. Tabs MUST be freely navigable without enforcing completion order.

#### Scenario: Inner sidebar links

- **WHEN** user opens a project
- **THEN** inner sidebar links to `/short-video/[projectId]/script`, `/assets`, and `/edit`

#### Scenario: Free tab navigation

- **WHEN** user opens 视频编辑 before parsing entities
- **THEN** the page loads without blocking; empty or partial states are shown with guidance

### Requirement: Script tab supports entity parsing via DeepSeek

The system SHALL parse the project rawScript into characters, scenes, and props using DeepSeek `deepseek-chat` when user triggers entity parsing.

#### Scenario: Parse entities success

- **WHEN** user sends `POST /short-video/projects/:id/parse-entities` with non-empty rawScript
- **THEN** parsedEntities JSON is stored with arrays `characters`, `scenes`, and `props`, each item having id, name, description, and imagePrompt

#### Scenario: Parse entities empty script

- **WHEN** user triggers parse-entities with empty rawScript
- **THEN** the system responds with HTTP 400

#### Scenario: Re-parse preserves existing asset bindings

- **WHEN** user re-triggers parse-entities and an existing entity with the same id already has assetId
- **THEN** that entity retains assetId and imageTaskId; newly parsed fields update name, description, and imagePrompt

### Requirement: Assets tab supports manual reference image generation

The system SHALL allow the user to manually trigger image generation for each parsed entity. Generated images SHALL appear in that entity's reference image history. The entity field `assetId` SHALL represent only the user-adopted reference image used for video editing, and MUST NOT be updated automatically when a generation task completes.

#### Scenario: Generate entity image

- **WHEN** user sends `POST /short-video/projects/:id/entities/:entityId/generate-image` with optional prompt override
- **THEN** an image GenerationTask is created, entity `imageTaskId` is set, and on task completion an Asset with source `short_video` and metadata linking `shortVideoProjectId` and `shortVideoEntityId` is created without changing entity `assetId`

#### Scenario: Skip entity images allowed

- **WHEN** user navigates to 视频编辑 without generating or adopting any entity reference images
- **THEN** the system does not block segment parsing or video generation

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

### Requirement: Edit tab supports segment parsing via DeepSeek

The system SHALL parse the project rawScript and parsedEntities into ordered video segments using DeepSeek `deepseek-chat`.

#### Scenario: Parse segments success

- **WHEN** user sends `POST /short-video/projects/:id/parse-segments`
- **THEN** segments JSON is stored with ordered items including durationSec, sceneDescription, characterRefIds, sceneRefId, propRefIds, and seedancePrompt

#### Scenario: Re-parse preserves segment video bindings

- **WHEN** user re-triggers parse-segments and an existing segment with the same id already has videoAssetId
- **THEN** that segment retains videoTaskId and videoAssetId; text fields update from the new parse result

### Requirement: Edit tab supports per-segment Seedance video generation

The system SHALL allow the user to generate a video for each segment using Seedance models 2.0, 2.0-fast, or 2.0-mini via existing video_seedance_r2v generation.

#### Scenario: Generate segment video

- **WHEN** user sends `POST /short-video/projects/:id/segments/:segmentId/generate-video` with optional model
- **THEN** a video_seedance_r2v GenerationTask is created using seedancePrompt and signed image_urls from linked entity assets when available

#### Scenario: Generate without reference images

- **WHEN** user generates a segment whose referenced entities have no assetId
- **THEN** the task is still created with text-only prompt and the UI shows a warning on that segment

#### Scenario: Segment video appears in assets

- **WHEN** segment video generation completes
- **THEN** an Asset with source `short_video` and type `video` exists and is linked via segment videoAssetId metadata

### Requirement: Script tab shows loading during entity parsing

The web application SHALL show an immediate loading state when the user triggers entity parsing on the script tab, persisting until the parse-entities request completes or fails.

#### Scenario: Immediate loading on parse click

- **WHEN** user clicks the parse entities control
- **THEN** the control shows a spinner and loading label, is disabled, and the script textarea is disabled until the request settles

#### Scenario: Loading covers save and parse

- **WHEN** user clicks parse entities and the client saves the script before parsing
- **THEN** the loading state is active for the entire save-and-parse sequence without a gap between save completion and parse start

### Requirement: Assets tab polls entity image generation tasks

The web application SHALL keep a visible generating state for each entity while its linked `imageTaskId` GenerationTask is pending or processing, and refresh entity image history when the task completes or fails.

#### Scenario: Generating state after submit

- **WHEN** user triggers generate-image for an entity and the API returns a GenerationTask
- **THEN** that entity's generate control and preview area remain in a generating state until the task status is done or failed

#### Scenario: History updates on completion

- **WHEN** an entity image GenerationTask completes successfully
- **THEN** the assets page refreshes the entity's reference image history and clears the generating state

#### Scenario: Resume polling on page load

- **WHEN** user opens the assets tab and an entity has an `imageTaskId` whose task is still pending or processing
- **THEN** the UI shows generating state for that entity and polls until the task settles

#### Scenario: Failed generation feedback

- **WHEN** an entity image GenerationTask fails
- **THEN** the generating state clears and the user sees an error indication

### Requirement: Edit tab shows loading during segment parsing

The web application SHALL show an immediate loading state when the user triggers segment parsing on the edit tab, persisting until the parse-segments request completes or fails.

#### Scenario: Immediate loading on parse segments

- **WHEN** user clicks the parse segments control
- **THEN** the control shows a spinner and loading label and is disabled until the request settles

### Requirement: Edit tab polls segment video generation tasks

The web application SHALL keep a visible generating state for each segment while its linked `videoTaskId` GenerationTask is pending or processing, and refresh segment preview when the task completes or fails.

#### Scenario: Generating state after video submit

- **WHEN** user triggers generate-video for a segment and the API returns a GenerationTask
- **THEN** that segment's generate control and video preview area remain in a generating state until the task status is done or failed

#### Scenario: Segment preview updates on completion

- **WHEN** a segment video GenerationTask completes successfully
- **THEN** the edit page refreshes project and asset data so the segment shows the new video preview

#### Scenario: Resume video polling on page load

- **WHEN** user opens the edit tab and a segment has a `videoTaskId` whose task is still pending or processing
- **THEN** the UI shows generating state for that segment and polls until the task settles

#### Scenario: Failed video generation feedback

- **WHEN** a segment video GenerationTask fails
- **THEN** the generating state clears and the user sees an error indication

### Requirement: DeepSeek API key is server-side only

The system SHALL call DeepSeek from the backend using `DEEPSEEK_API_KEY` and MUST NOT expose the key to the web client.

#### Scenario: Missing API key

- **WHEN** parse-entities or parse-segments is called without DEEPSEEK_API_KEY configured
- **THEN** the system responds with HTTP 400 indicating LLM is not configured
