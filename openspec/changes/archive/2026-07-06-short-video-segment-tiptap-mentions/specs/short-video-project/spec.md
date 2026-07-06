## MODIFIED Requirements

### Requirement: Edit tab supports per-segment Seedance video generation

The system SHALL allow the user to generate a video for each segment using Seedance models 2.0, 2.0-fast, or 2.0-mini via existing video_seedance_r2v generation. Reference images for generation MUST come only from asset ids explicitly referenced in the segment editor via `@` mentions, not from automatic resolution of segment entity ref ids.

#### Scenario: Generate segment video with editor prompt and mentions

- **WHEN** user sends `POST /short-video/projects/:id/segments/:segmentId/generate-video` with `{ "model": "...", "prompt": "...", "assetIds": ["..."] }` where each assetId is an adopted reference image for an entity in the project
- **THEN** a video_seedance_r2v GenerationTask is created using the provided prompt and signed image_urls resolved from the provided assetIds

#### Scenario: Generate without reference images

- **WHEN** user generates a segment with a text prompt and empty or omitted assetIds
- **THEN** the task is still created with text-only prompt and no reference images

#### Scenario: Reject invalid mention asset

- **WHEN** user sends generate-video with an assetId that is not the adopted assetId of any entity in the project
- **THEN** the system responds with HTTP 400

#### Scenario: Segment video appears in assets

- **WHEN** segment video generation completes
- **THEN** an Asset with source `short_video` and type `video` exists and is linked via segment videoAssetId metadata

## ADDED Requirements

### Requirement: List adopted entity reference images for mention picker

The system SHALL expose all adopted entity reference images for a short video project as candidates for the segment editor `@` mention picker.

#### Scenario: List adopted entity images

- **WHEN** user requests `GET /short-video/projects/:id/adopted-entity-images` for an owned project
- **THEN** the response includes items with assetId, entityId, entityName, entityKind, and previewUrl for each parsed entity that has a non-empty assetId, excluding entities without an adopted reference image

#### Scenario: Empty adopted list

- **WHEN** no parsed entity in the project has assetId set
- **THEN** the response items array is empty

### Requirement: User can persist segment prompt and asset mentions

The system SHALL allow the user to save edited segment prompt content and referenced asset ids when the segment editor loses focus.

#### Scenario: Update segment prompt on blur

- **WHEN** user sends `PATCH /short-video/projects/:id/segments/:segmentId` with `{ "seedancePrompt": "...", "referenceAssetIds": ["..."], "seedancePromptDoc": { ... } }` where each referenceAssetId is an adopted entity asset in the project
- **THEN** the segment fields seedancePrompt, referenceAssetIds, and seedancePromptDoc are updated in the project segments JSON

#### Scenario: Reject invalid reference asset on save

- **WHEN** user sends PATCH with a referenceAssetId that is not an adopted entity asset for the project
- **THEN** the system responds with HTTP 400

#### Scenario: Re-parse preserves user-edited prompt fields

- **WHEN** user re-triggers parse-segments and an existing segment with the same id already has seedancePromptDoc or user-edited seedancePrompt/referenceAssetIds
- **THEN** that segment retains seedancePromptDoc, referenceAssetIds, and user-edited seedancePrompt; other text fields from parse update as before

### Requirement: Edit tab segment prompt editor supports asset mentions

The web application SHALL replace the read-only Seedance prompt textarea with a Tiptap editor on each segment card. The editor MUST support typing `@` to open a dropdown of adopted entity reference images for the project. Selecting an item inserts an inline mention chip. The editor MUST persist content on blur. Parsing segments MUST NOT pre-fill `@` mentions.

#### Scenario: Mention picker shows adopted images only

- **WHEN** user types `@` in the segment prompt editor
- **THEN** the dropdown lists adopted entity reference images for the current project with thumbnail and entity name

#### Scenario: Insert mention chip

- **WHEN** user selects an item from the `@` dropdown
- **THEN** an inline mention chip is inserted in the editor bound to that assetId

#### Scenario: No missing reference warning

- **WHEN** user views a segment card on the edit tab
- **THEN** the UI does not show a partial missing reference image warning badge

#### Scenario: Initial content without prefilled mentions

- **WHEN** segments are first parsed and the user opens the edit tab before editing
- **THEN** the editor shows seedancePrompt as plain text without `@` mention chips

#### Scenario: Blur saves editor state

- **WHEN** user edits the segment prompt and the editor loses focus
- **THEN** the client sends PATCH to persist seedancePrompt, referenceAssetIds, and seedancePromptDoc

#### Scenario: Generate sends prompt and mentioned assets

- **WHEN** user clicks AI generate on a segment
- **THEN** the client sends generate-video with the editor plain text prompt and assetIds collected from mention chips in the editor
