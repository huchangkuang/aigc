## MODIFIED Requirements

### Requirement: Five generation types are supported

The system SHALL support submission for all five Jimeng capability types (`image`, `video_t2v`, `video_i2v_first`, `video_i2v_first_tail`, `video_i2v_recamera`). Each capability SHALL resolve to a Jimeng `req_key` based on the pair `(type, model)` where `model` is an optional string on the create-task request defaulting to the legacy tier for that type.

Supported `(type, model)` mappings SHALL include at minimum:

| type | model | req_key |
|------|-------|---------|
| image | seedream46 (default) | jimeng_seedream46_cvtob |
| image | v31 | jimeng_t2i_v31 |
| image | v40 | jimeng_t2i_v40 |
| video_t2v | 720 (default) | jimeng_t2v_v30 |
| video_t2v | 1080 | jimeng_t2v_v30_1080p |
| video_t2v | pro | jimeng_ti2v_v30_pro |
| video_i2v_first | 720 (default) | jimeng_i2v_first_v30 |
| video_i2v_first | 1080 | jimeng_i2v_first_v30_1080 |
| video_i2v_first | pro | jimeng_ti2v_v30_pro |
| video_i2v_first_tail | 720 (default) | jimeng_i2v_first_tail_v30 |
| video_i2v_first_tail | 1080 | jimeng_i2v_first_tail_v30_1080 |
| video_i2v_recamera | 720 (default) | jimeng_i2v_recamera_v30 |

When `model` is omitted, the system MUST use the default row for that type (same req_key as before this change).

#### Scenario: Submit text-to-image with default model

- **WHEN** user submits type `image` with prompt and no `model` field
- **THEN** the system creates a GenerationTask with req_key `jimeng_seedream46_cvtob` and stores `model: seedream46` in inputParams

#### Scenario: Submit text-to-image with v40 model

- **WHEN** user submits type `image` with `model: v40` and prompt
- **THEN** the system creates a GenerationTask with req_key `jimeng_t2i_v40`

#### Scenario: Submit text-to-video 1080P task

- **WHEN** user submits type `video_t2v` with `model: 1080`, prompt, frames, and aspect_ratio
- **THEN** the system creates a GenerationTask with req_key `jimeng_t2v_v30_1080p`

#### Scenario: Submit Pro text-to-video task

- **WHEN** user submits type `video_t2v` with `model: pro`, prompt, frames, and aspect_ratio, and no image_urls
- **THEN** the system creates a GenerationTask with req_key `jimeng_ti2v_v30_pro`

#### Scenario: Submit Pro image-to-video first frame task

- **WHEN** user submits type `video_i2v_first` with `model: pro`, prompt, image_urls, and frames
- **THEN** the system creates a GenerationTask with req_key `jimeng_ti2v_v30_pro`

#### Scenario: Submit image-to-video first frame 1080P task

- **WHEN** user submits type `video_i2v_first` with `model: 1080`, prompt, image_urls, and frames
- **THEN** the system creates a GenerationTask with req_key `jimeng_i2v_first_v30_1080`

#### Scenario: Submit recamera task requires template

- **WHEN** user submits type `video_i2v_recamera` without template_id or camera_strength
- **THEN** the system responds with HTTP 400 validation error

#### Scenario: Invalid model for type

- **WHEN** user submits a `model` value not defined for the given `type`
- **THEN** the system responds with HTTP 400 validation error

## ADDED Requirements

### Requirement: Available models are exposed per generation type

The system SHALL expose `GET /generation/models?type=<GenerationType>` for authenticated users, returning the list of enabled model tiers for that capability. Each item SHALL include `id` and `label` only; `req_key` MUST NOT be returned to clients.

#### Scenario: List models for video text-to-video

- **WHEN** user requests `GET /generation/models?type=video_t2v`
- **THEN** the response includes entries for 720P, 1080P, and Pro with stable `id` values `720`, `1080`, and `pro`

#### Scenario: List models for recamera

- **WHEN** user requests `GET /generation/models?type=video_i2v_recamera`
- **THEN** the response includes only the 720P tier

#### Scenario: List models for image generation

- **WHEN** user requests `GET /generation/models?type=image`
- **THEN** the response includes Seedream 4.6, 即梦 3.1, and 即梦 4.0 entries

#### Scenario: Unknown generation type

- **WHEN** user requests models for an invalid `type` query parameter
- **THEN** the system responds with HTTP 400 validation error

### Requirement: Model selection is persisted on generation tasks

The system SHALL store the submitted `model` value in `GenerationTask.inputParams` alongside other input fields, and SHALL persist the resolved `reqKey` on the task record at creation time.

#### Scenario: Task detail includes model

- **WHEN** user retrieves a task created with `model: 1080`
- **THEN** `inputParams` includes `model: 1080` and `reqKey` reflects the 1080P mapping for that type
