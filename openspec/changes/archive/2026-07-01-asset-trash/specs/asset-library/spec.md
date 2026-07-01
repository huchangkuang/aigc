## ADDED Requirements

### Requirement: User can list trashed assets

The system SHALL provide an API to list soft-deleted assets (`deletedAt IS NOT NULL`) scoped to the authenticated user, with optional type filter and signed preview URLs.

#### Scenario: List all trashed assets

- **WHEN** user requests `GET /assets/trash`
- **THEN** the response includes only that user's assets where `deletedAt` is set, ordered by `deletedAt` descending, each with id, type, createdAt, deletedAt, metadata summary, and previewUrl

#### Scenario: Filter trashed assets by type

- **WHEN** user requests `GET /assets/trash?type=video`
- **THEN** the response includes only soft-deleted video assets for that user

#### Scenario: Active assets excluded from trash list

- **WHEN** user requests `GET /assets/trash`
- **THEN** assets with `deletedAt IS NULL` are not included

### Requirement: User can restore a soft-deleted asset

The system SHALL allow the authenticated owner to restore a trashed asset by clearing `deletedAt`.

#### Scenario: Restore success

- **WHEN** user sends `POST /assets/:id/restore` for their soft-deleted asset
- **THEN** the asset has `deletedAt` cleared and appears in `GET /assets` but not in `GET /assets/trash`

#### Scenario: Restore non-trashed asset

- **WHEN** user sends `POST /assets/:id/restore` for an active asset
- **THEN** the system responds with HTTP 404

#### Scenario: Restore other user's asset

- **WHEN** user sends `POST /assets/:id/restore` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: User can permanently destroy a trashed asset

The system SHALL permanently remove a soft-deleted asset by deleting its OSS object and database record. This operation MUST NOT be available for active (non-trashed) assets.

#### Scenario: Permanent destroy success

- **WHEN** user sends `DELETE /assets/:id/permanent` for their soft-deleted asset
- **THEN** the OSS object at `ossKey` is deleted, the asset database row is removed, and the asset appears in neither `GET /assets` nor `GET /assets/trash`

#### Scenario: Destroy active asset rejected

- **WHEN** user sends `DELETE /assets/:id/permanent` for an asset with `deletedAt IS NULL`
- **THEN** the system responds with HTTP 404

#### Scenario: Destroy other user's asset

- **WHEN** user sends `DELETE /assets/:id/permanent` for another user's asset
- **THEN** the system responds with HTTP 404

### Requirement: Frontend trash page displays grid with preview

The web application SHALL provide a trash page at `/trash` showing the user's soft-deleted assets with type filter, keyword search, preview, and download consistent with the asset library grid.

#### Scenario: Trash page shows trashed items

- **WHEN** logged-in user opens `/trash` with soft-deleted assets
- **THEN** the page displays a grid of previews with type badges and deleted date

#### Scenario: Trash empty state

- **WHEN** logged-in user opens `/trash` with no soft-deleted assets
- **THEN** the page shows an empty state indicating the trash is empty

#### Scenario: Sidebar navigation to trash

- **WHEN** logged-in user views the workspace sidebar
- **THEN** a fourth nav item links to `/trash` labeled 回收站

### Requirement: Trash card exposes restore and destroy actions

The web application SHALL provide an overflow menu on each trash page asset card with actions: restore and permanently destroy. Trash cards SHALL NOT expose rename, soft-delete, or compose actions.

#### Scenario: Restore from trash card

- **WHEN** user chooses Restore from the trash card menu and confirms
- **THEN** the asset is restored and removed from the trash grid after refresh

#### Scenario: Destroy requires confirmation

- **WHEN** user chooses Destroy from the trash card menu
- **THEN** a confirmation dialog appears warning the action is irreversible and the asset is only destroyed after confirm

#### Scenario: Trash card supports preview and download

- **WHEN** user interacts with a trash card preview or download control
- **THEN** the media lightbox or download link works the same as on the asset library page

## MODIFIED Requirements

### Requirement: Asset card exposes action menu

The web application SHALL provide a working overflow menu on each asset card with actions: rename, delete, generate similar, image only, prompt only.

#### Scenario: Delete requires confirmation

- **WHEN** user chooses Delete from the asset card menu
- **THEN** a confirmation dialog appears explaining the asset will be moved to trash (recoverable from the trash page) and the asset is only soft-deleted after confirm

#### Scenario: Menu does not trigger media preview

- **WHEN** user clicks the overflow menu button
- **THEN** the media lightbox does not open
