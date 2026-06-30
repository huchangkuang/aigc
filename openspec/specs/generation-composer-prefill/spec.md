### Requirement: Composer accepts prefilled draft from asset actions

The web application SHALL prefill the generation composer on `/generate` when a composer draft was written by an asset card action.

#### Scenario: Generate similar prefills all parameters

- **WHEN** user chooses「同款生成」on an asset with full task context
- **THEN** the user is navigated to `/generate` with type, prompt, reference images, frames, aspect ratio, and recamera settings restored

#### Scenario: Image only prefills reference images

- **WHEN** user chooses「仅用图片」and the asset compose context includes image_urls
- **THEN** the user is navigated to `/generate` with reference images filled and prompt cleared

#### Scenario: Image only without reference images

- **WHEN** user chooses「仅用图片」and compose context has empty image_urls
- **THEN** the system shows an error toast and does not navigate

#### Scenario: Prompt only prefills prompt

- **WHEN** user chooses「仅用提示词」and the asset has a prompt
- **THEN** the user is navigated to `/generate` with prompt filled and reference images cleared

#### Scenario: Prompt only without prompt

- **WHEN** user chooses「仅用提示词」and the asset has no prompt
- **THEN** the system shows an error toast and does not navigate

#### Scenario: Draft consumed once

- **WHEN** the generate page applies a composer draft on mount
- **THEN** the draft is cleared so revisiting `/generate` does not reapply the same values
