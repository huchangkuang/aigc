### Requirement: Backend proxies Jimeng API with server-side credentials

The system MUST call Volcengine Visual API using AccessKey/SecretKey stored only in server environment variables. Client applications MUST NOT receive or transmit Jimeng credentials.

#### Scenario: Submit task uses server credentials

- **WHEN** an authenticated user submits a generation request
- **THEN** the API signs the request with configured Volcengine credentials and returns a local task id

### Requirement: Five generation types are supported

The system SHALL support submission for all five Jimeng capabilities with correct `req_key` values:

- Image generation (Seedream 4.6): `jimeng_seedream46_cvtob`
- Text-to-video 720P: `jimeng_t2v_v30`
- Image-to-video first frame: `jimeng_i2v_first_v30`
- Image-to-video first and last frame: `jimeng_i2v_first_tail_v30`
- Image-to-video recamera: `jimeng_i2v_recamera_v30`

#### Scenario: Submit text-to-image task

- **WHEN** user submits type `image` with prompt and optional parameters
- **THEN** the system creates a GenerationTask with req_key `jimeng_seedream46_cvtob` and status `pending`

#### Scenario: Submit text-to-video task

- **WHEN** user submits type `video_t2v` with prompt, frames, and aspect_ratio
- **THEN** the system creates a GenerationTask with req_key `jimeng_t2v_v30`

#### Scenario: Submit image-to-video first frame task

- **WHEN** user submits type `video_i2v_first` with image reference and prompt
- **THEN** the system creates a GenerationTask with req_key `jimeng_i2v_first_v30`

#### Scenario: Submit recamera task requires template

- **WHEN** user submits type `video_i2v_recamera` without template_id or camera_strength
- **THEN** the system responds with HTTP 400 validation error

### Requirement: Generation tasks are polled until completion

The system SHALL poll Jimeng `CVSync2AsyncGetResult` for tasks in `pending` or `processing` status until status is `done`, failed, expired, or not_found.

#### Scenario: Task transitions to processing

- **WHEN** Jimeng returns status `generating` for a task
- **THEN** the local GenerationTask status is updated to `processing`

#### Scenario: Task completes successfully

- **WHEN** Jimeng returns status `done` with code 10000 and output URLs
- **THEN** the system triggers OSS persistence and marks task `done`

#### Scenario: Task fails with Jimeng error

- **WHEN** Jimeng returns a non-10000 code or failed status
- **THEN** the GenerationTask is marked `failed` with error message stored

### Requirement: User can query own generation tasks

The system SHALL allow authenticated users to list and retrieve their generation tasks with current status.

#### Scenario: List recent tasks

- **WHEN** user requests `GET /generation-tasks`
- **THEN** the response includes only tasks owned by that user ordered by createdAt desc

#### Scenario: Get single task detail

- **WHEN** user requests `GET /generation-tasks/:id` for their task
- **THEN** the response includes status, type, inputParams, errorMessage, and linked asset ids when done
