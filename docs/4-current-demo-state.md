# Current Demo State

**Date:** 2026-06-23  
**Purpose:** Fast handoff summary for the current Omni Portal state after the UI polish and TypeScript migration.

## Audience & Event

The Omni Portal is being prepared for a Google Marketing Live India executive demo. The app is expected to be cast from a Mac or Chromebook to a larger display for CxO-level attendees.

Design implications:

- Large type.
- Touch-friendly targets.
- Strong hierarchy.
- No page-level scrolling in the wizard.
- Premium, controlled Google-brand visual language.
- Local Test Mode must work without GCP credentials on a laptop.

## Current Wizard Behavior

1. **Scenario**
   - Dense 3x2 scenario card grid.
   - Cards use media, title, style chip, prompt/dialogue cue, and location.
   - Custom prompt remains available.

2. **Dialogue**
   - Ten language options.
   - Spoken preview and editor stay aligned on the right.
   - Dialogue is optional.

3. **Presenter**
   - Presenter workbench layout.
   - Preset portraits, camera, and upload all feed the same right-side readiness preview.
   - Continue is blocked until a preset or custom presenter image exists.

4. **Audio**
   - Audio is optional.
   - Presets, Record, and Upload use full-height panels.
   - Right-side preview shows ready/optional state.

5. **Review**
   - Launch checklist, prompt, Google Cloud path, and render CTA.
   - Generate button has animated Google-color border on hover/focus.
   - Test Mode changes the CTA copy and uses local mock generation.

## Current Result Screen

The result state now uses:

- Large video panel on the left.
- Compact action buttons below the video.
- One generation inputs strip for scenario/dialogue.
- One right-side delivery panel containing:
  - QR code
  - Copyable link
  - Render details
  - Prompt summary

![Result delivery layout](assets/screenshots/result-delivery-layout.png)

## TypeScript State

The frontend is now strict TypeScript.

Important files:

- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.ts`
- `frontend/src/lib/types.ts`
- `frontend/src/lib/prompt.ts`

Rules:

- Do not add frontend source files as `.js` or `.jsx`.
- Do not enable `allowJs`.
- Keep `npm run typecheck` and `npm run build` passing.

## Prompt Token Handling

Preset prompts may contain `[REF_Character]` internally. This token tells the generation flow where to bind the selected presenter image.

User-facing UI must not display `[REF_Character]`.

Use:

```ts
formatPromptForDisplay(prompt)
```

from:

```text
frontend/src/lib/prompt.ts
```

## Local Demo Rules

For laptop/local smoke tests:

1. Run `make start`.
2. Open `http://localhost:5173`.
3. Turn on **Test mode** in the side rail.
4. Generate normally.

Do not expect real Omni generation to work locally unless the backend has intentional GCP/Omni credentials and environment configuration.

## Screenshots

Current documentation screenshots:

- [Step 1 scenario cards](assets/screenshots/step-1-scenario-cards.png)
- [Step 1 selected scenario](assets/screenshots/step-1-scenario-selected.png)
- [Step 2 dialogue](assets/screenshots/step-2-dialogue.png)
- [Step 3 presenter](assets/screenshots/step-3-presenter.png)
- [Step 4 audio](assets/screenshots/step-4-audio.png)
- [Step 5 review and generate](assets/screenshots/step-5-review-generate.png)
- [Result delivery layout](assets/screenshots/result-delivery-layout.png)
- [Portal brand reset](assets/screenshots/portal-brand-reset.png)

## Verification Commands

Frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
uv run pytest
```

Full repo:

```bash
make check
```
