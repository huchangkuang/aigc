## MODIFIED Requirements

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
