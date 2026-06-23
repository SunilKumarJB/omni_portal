# Frontend Redesign & TypeScript Migration

**Date:** 2026-06-23
**Branch:** `feat/adhish-dev`
**Scope:** `frontend/` UI, TypeScript migration, local demo behavior
**Audience:** Future agents and engineers extending the GML India demo UI

## Context

The Omni Portal is an executive demo surface for Google Marketing Live India. It is cast from a Mac or Chromebook to a large screen and shown to CxO-level attendees. The interface must feel premium, reliable, and easy to operate live.

The core UI is now a **fixed-viewport control deck**, not a scrolling web app. Every wizard step must fit in the viewport at 1280x720 and larger.

## Current Frontend Stack

- React 19
- Vite 6
- TypeScript strict mode
- Tailwind CSS
- Radix/shadcn-style local primitives
- `next-themes`
- `sonner`
- `react-router-dom`
- `react-webcam` lazy-loaded only when the camera tab is opened

Important files:

```text
frontend/
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── lib/
    │   ├── api.ts
    │   ├── prompt.ts
    │   ├── types.ts
    │   └── utils.ts
    ├── pages/
    │   ├── Home.tsx
    │   └── VideoView.tsx
    └── components/
        ├── SideRail.tsx
        ├── PromptSelector.tsx
        ├── DialogueSelector.tsx
        ├── CharacterSelector.tsx
        ├── AudioSelector.tsx
        ├── ReviewGenerate.tsx
        ├── ResultPanel.tsx
        └── ui/
```

## TypeScript Migration

The frontend was migrated from `.js` / `.jsx` to `.ts` / `.tsx`.

What changed:

- Added `frontend/tsconfig.json` with strict checking.
- Removed `frontend/jsconfig.json`.
- Renamed Vite, Tailwind, and PostCSS configs to TypeScript.
- Added `frontend/src/lib/types.ts` for shared domain objects:
  - `VideoTemplate`
  - `CharacterPreset`
  - `AudioPreset`
  - `GenerationStatus`
  - `VideoRequestData`
  - `LanguageCode`
- Typed all local UI primitives in `src/components/ui`.
- Typed refs for file inputs, webcam, `MediaRecorder`, `MediaStream`, timers, and video elements.
- Added `npm run typecheck`.
- Changed `npm run build` to run `tsc --noEmit && vite build`.

Rules:

- No `.js` / `.jsx` files under `frontend/src`.
- Do not relax TypeScript to `allowJs`.
- Prefer shared domain types over local ad hoc object shapes.
- Keep `npm run typecheck` passing before handing off UI work.

## Product Flow

The wizard has five steps:

1. **Scenario**: choose a cinematic template or custom prompt.
2. **Dialogue**: choose language and optional spoken line.
3. **Presenter**: choose preset, camera capture, or upload.
4. **Audio**: choose preset, record, upload, or skip.
5. **Review**: inspect inputs and generate with Omni or Test Mode.

Result flow:

- Large video preview on the left.
- One coherent delivery panel on the right.
- QR, copy link, render details, and prompt summary are grouped together.
- Scenario/dialogue metadata is condensed into one generation inputs strip.

## Layout Rules

This app is not allowed to behave like a normal scroll page during the wizard.

- Use `h-dvh` / `min-h-dvh` for full-screen surfaces.
- Use `overflow-hidden` on the shell.
- Use `min-h-0` aggressively inside CSS grid/flex layouts.
- Footer/action bars should be `shrink-0`.
- Avoid page-level scroll in the wizard.
- At 1280x720, every step should be operable without scrolling.
- Cards should have internal sectioning and meaningful middle/bottom content.

Current density decisions:

- Step 1 scenario cards use media, title, prompt/dialogue cue, style chip, and location footer.
- Step 2 language cards are aligned with a right-side spoken preview/editor.
- Step 3 is a presenter workbench: 3x2 presets plus right-side readiness preview.
- Step 4 uses audio tiles with waveform/metadata plus right-side audio preview.
- Step 5 uses a launch checklist, prompt card, cloud path, and Generate surface.
- Result screen uses one delivery panel instead of three floating cards.

## Brand & Visual System

The UI is monochrome-first with restrained Google-color moments.

Core colors:

- Blue `#2986FF`
- Red `#EA4335`
- Yellow `#FFC30E`
- Green `#2EBA53`

Current uses:

- Top AI gradient band.
- Step accents in the side rail.
- Final step segmented Google-color ring.
- Thin card hairlines where helpful.
- Generate button animated Google-color border on hover/focus.
- Functional status colors.

Avoid:

- Full-screen rainbow washes.
- Google-blue chrome everywhere.
- Raw hex colors for normal UI surfaces.
- One-off color palettes that ignore the token system.

Use semantic Tailwind tokens from `index.css` and `tailwind.config.ts`.

## Internal Prompt Token

Preset prompts contain `[REF_Character]`. That is an internal generation placeholder that tells Omni where the selected presenter image should be bound.

Rules:

- It can remain inside internal preset prompts.
- It can be sent to the backend generation flow.
- It must not appear in user-facing review/result prompt summaries.
- Use `formatPromptForDisplay()` from `src/lib/prompt.ts` before rendering prompt text to users.

## Local Test Mode

Test Mode is now frontend-local for the normal demo flow.

When enabled in the side rail:

- `Home.handleGenerate()` creates a mock completed request.
- No GCP/Omni calls are made.
- The result page uses a placeholder public video URL.
- This is the safe local laptop path.

Rule: for local smoke tests, turn on Test Mode before clicking Generate unless a real GCP environment is intentionally configured.

## Interaction Fixes

- The Omni Portal brand area in the side rail is a reset action and returns the wizard to Step 1.
- The same reset behavior exists in the compact mobile header.
- The final Step 5 badge no longer shows a stray incoming connector line when active.
- The Generate button hover/focus border animates through Google colors.

## Screenshots

Screenshots live in `docs/assets/screenshots/`.

### Step 1 Scenario Cards

![Step 1 scenario cards](assets/screenshots/step-1-scenario-cards.png)

### Result Delivery Layout

![Result delivery layout](assets/screenshots/result-delivery-layout.png)

### Brand Reset Control

![Portal brand reset](assets/screenshots/portal-brand-reset.png)

## Verification

Current frontend verification used during this pass:

```bash
cd frontend
npm run typecheck
npm run build
```

Known non-blocking build warning:

- Vite warns that the main chunk is larger than 500 KB after minification.
- `VideoView` and `react-webcam` are still split into separate chunks.
- This warning does not fail the build.
