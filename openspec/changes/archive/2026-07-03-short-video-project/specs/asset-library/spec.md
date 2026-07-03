## ADDED Requirements

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

## MODIFIED Requirements

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
