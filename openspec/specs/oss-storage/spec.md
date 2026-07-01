### Requirement: Generated media is persisted to Alibaba OSS

The system MUST download media from Jimeng temporary URLs and upload to configured Alibaba OSS before marking a generation task complete. Jimeng URLs expire (images ~24h, videos ~1h); OSS objects MUST remain accessible for asset library use.

#### Scenario: Successful image persistence

- **WHEN** a Jimeng image task completes with image_urls
- **THEN** each image is uploaded to OSS under `assets/{userId}/{assetId}.{ext}` and an Asset record is created

#### Scenario: Successful video persistence

- **WHEN** a Jimeng video task completes with video_url
- **THEN** the video is uploaded to OSS and an Asset record with type `video` is created

#### Scenario: OSS upload failure

- **WHEN** OSS upload fails after Jimeng success
- **THEN** the GenerationTask is marked `failed` with a descriptive error and no partial Asset without ossKey

### Requirement: Reference images for generation are stored via backend upload

The system SHALL accept user reference images through an authenticated upload endpoint and store them in OSS (temporary or asset path) for use in Jimeng image_urls parameters.

#### Scenario: Upload reference image

- **WHEN** user uploads a JPEG/PNG via `POST /storage/upload` within size limits
- **THEN** the system returns an OSS URL or key usable in subsequent generation requests

#### Scenario: Reject invalid file type

- **WHEN** user uploads a non-image file
- **THEN** the system responds with HTTP 400

### Requirement: Asset access uses secure URLs

The system SHALL serve asset preview/download via signed OSS URLs or authenticated proxy, not expose bucket credentials to clients. Signed URLs for the same `ossKey` MUST remain identical for the duration of the cache TTL (at least 50 minutes when default expiry is 3600 seconds), so that repeated API calls within that window do not produce different URL strings.

#### Scenario: Get asset download URL

- **WHEN** user requests download URL for their asset
- **THEN** the system returns a time-limited signed URL or streams via authenticated API

#### Scenario: Repeated signed URL requests within cache window

- **WHEN** `getSignedUrl` is called multiple times for the same `ossKey` within the cache TTL
- **THEN** the system returns the same URL string each time

#### Scenario: Signed URL cache expiry

- **WHEN** the cache entry for an `ossKey` has expired
- **THEN** the system generates a new signed URL and updates the cache
