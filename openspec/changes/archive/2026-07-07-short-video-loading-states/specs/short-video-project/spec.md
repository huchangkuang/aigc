## ADDED Requirements

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
