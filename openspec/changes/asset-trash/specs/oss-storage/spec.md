## ADDED Requirements

### Requirement: System can delete OSS objects

The system SHALL support deleting objects from Alibaba OSS by key, for use when permanently destroying trashed assets.

#### Scenario: Delete existing object

- **WHEN** `deleteObject` is called with a valid `ossKey` for an object that exists in the bucket
- **THEN** the object is removed from OSS

#### Scenario: Delete in mock mode

- **WHEN** `STORAGE_MOCK=true` and `deleteObject` is called
- **THEN** the call succeeds without contacting OSS (no-op)

#### Scenario: Delete missing object is idempotent

- **WHEN** `deleteObject` is called for a key that does not exist in OSS
- **THEN** the call completes successfully so permanent asset destroy can still remove the database record
