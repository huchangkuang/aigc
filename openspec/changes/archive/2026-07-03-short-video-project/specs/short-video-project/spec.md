## ADDED Requirements

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

The system SHALL allow the user to manually trigger image generation for each parsed entity and bind the resulting asset to that entity.

#### Scenario: Generate entity image

- **WHEN** user sends `POST /short-video/projects/:id/entities/:entityId/generate-image` with optional prompt override
- **THEN** an image GenerationTask is created, entity imageTaskId is set, and on task completion an Asset with source `short_video` is linked via entity assetId

#### Scenario: Skip entity images allowed

- **WHEN** user navigates to 视频编辑 without generating any entity images
- **THEN** the system does not block segment parsing or video generation

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

### Requirement: DeepSeek API key is server-side only

The system SHALL call DeepSeek from the backend using `DEEPSEEK_API_KEY` and MUST NOT expose the key to the web client.

#### Scenario: Missing API key

- **WHEN** parse-entities or parse-segments is called without DEEPSEEK_API_KEY configured
- **THEN** the system responds with HTTP 400 indicating LLM is not configured
