# Backend ↔ UI Realignment

**Date:** 2026-06-23
**Branch:** `feat/adhish-dev`
**Context:** The frontend was redesigned from a **product-ad generator** (upload a
product photo → Gemini suggests styles/themes → product video) into a
**character-driven cinematic generator** (pick a scenario template carrying a
`[REF_Character]` placeholder → write dialogue in one of 10 Indian languages → drop
in a character → pick audio → generate). The backend still encoded the old product,
so several assumptions had gone silently wrong. This pass realigns the backend's
generation contract with the new UI.

Each change below is grouped so it can be **reverted independently**, matching the
convention in `docs/1-backend-optimizations.md`.

---

## Summary

| # | Change | Severity | File(s) | Reversible |
|---|--------|----------|---------|------------|
| A | Dialogue + language are first-class; style/theme modifiers dropped; `[REF_Character]` casing fixed | 🔴 Critical | `omni_service.py`, `api/routes/generate.py`, `lib/api.js`, `pages/Home.jsx` | Yes |
| B | Remove orphaned product/Gemini/preset surface | 🟠 High | `gemini_service.py` (del), `api/routes/assets.py` (del), `main.py`, `schemas.py`, `config.py`, `.env.example`, `lib/api.js`, `pages/VideoView.jsx` | Yes |
| C | Harden Cloud Run for multi-minute background jobs | 🟠 High | `deploy-cloud-run.sh` | Yes |

---

## A. Dialogue + language first-class (was: dead style/theme enrichment)

**Symptom:** The UI sent `style_id` = template id (`cyberpunk`, …) and a hardcoded
`theme_id: 'default'`. Neither matched `_STYLE_MODIFIERS` / `_THEME_MODIFIERS` keys,
so every modifier lookup returned `""` — the entire enrichment system was a no-op.
Separately, the marquee multilingual feature collected a language but never sent it;
dialogue was concatenated into the prompt client-side, so Omni got no explicit
"speak this line in Tamil with lip-sync" instruction. The backend also appended
`[REF_CHARACTER]` (uppercase) while templates use `[REF_Character]`.

**Fix:**
- `omni_service._enrich_prompt` rewritten: the scenario template **is** the style
  (baked into the prompt), so style/theme modifier injection is removed. It now
  (1) binds the character via `[REF_Character]` (matching template casing) only when
  the prompt lacks the token, and (2) when dialogue is present appends
  `The character speaks the following line in {Language}, with natural, accurate
  lip-sync: "..."`. A `_LANGUAGE_NAMES` map mirrors the UI's 10 languages.
- `generate_video()` signature: `style_id`/`theme_id`/`product_*` removed; `dialogue`
  and `language` added.
- `generate.py`: route accepts `dialogue` + `language` (Form), stores them on the
  record, and threads them through `_run_generation` to both the primary and
  silent-audio-fallback Omni calls. `_to_status` exposes them; `theme_id` /
  `product_image_url` dropped.
- Frontend: `generateVideo()` sends `dialogue` + `language`; `Home.handleGenerate`
  stops concatenating dialogue into the prompt.

**To revert:** restore `_STYLE_MODIFIERS`/`_THEME_MODIFIERS` and the old
`_enrich_prompt`/`generate_video` signatures, re-add `theme_id` to the route and the
client, and restore the client-side dialogue concatenation.

## B. Remove orphaned product / Gemini / preset surface

**Symptom:** The new flow has no product image and no Gemini step, leaving a large
unused surface: `gemini_service`, `POST /generate/prompts`, the entire `/assets`
router (the UI hardcodes its own character/audio lists with different field names),
product-image threading, and most of `schemas.py`.

**Fix (deleted / trimmed):**
- Deleted `app/services/gemini_service.py`, `app/api/routes/assets.py`,
  `tests/test_gemini_service.py`.
- `main.py`: dropped the `assets` router; `/health` `models` now reports only `omni`.
- `generate.py`: removed `/prompts` and the `gemini_service` import; removed product
  upload + threading.
- `schemas.py`: reduced to `VideoRequestStatus` (added `dialogue`/`language`, removed
  `theme_id`/`product_image_url`). Removed the now-unused style/theme/preset/upload
  models.
- `config.py` + `.env.example`: removed `GEMINI_PRO_MODEL` / `GEMINI_FLASH_MODEL`
  (their only consumer was the deleted Gemini service). **`OMNI_MODEL` and all other
  model/endpoint settings remain env-driven via pydantic-settings.**
- Frontend `lib/api.js`: removed `suggestPrompts`, `uploadImage`, `uploadAudio`,
  `getPresetCharacters`, `getPresetAudio`. `VideoView.jsx`: removed the dead product
  card/poster and `theme_id` badge.

**To revert:** `git checkout <pre-change-commit> -- <the files above>`.

## C. Harden Cloud Run for multi-minute jobs

**Symptom:** Generation runs 3–8 min in a FastAPI `BackgroundTask` *after* the HTTP
response returns. With no `--no-cpu-throttling` and no `--min-instances`, Cloud Run
throttles CPU to ~0 after the response and can reap the instance on scale-in → the
task dies, the request is stuck at `processing` forever, and the polling UI spins.

**Fix:** `deploy-cloud-run.sh` backend deploy now passes `--no-cpu-throttling` (CPU
stays allocated so the task keeps running) and `--min-instances 1` (a warm instance
survives scale-in).

**Residual limitation:** This is the pragmatic fix. The fully robust design moves
generation to a Cloud Tasks / Pub/Sub worker decoupled from the request lifecycle —
noted, not built here.

**To revert:** remove the two flags from the backend `gcloud run deploy` block.

---

## Tests

- `tests/test_generate_pipeline.py` rewritten to the new contract (character image as
  primary media, `dialogue`/`language` instead of `theme_id`/product).
- `tests/test_omni_service.py` gains `_enrich_prompt` coverage (dialogue/language
  injection, `[REF_Character]` binding, unknown-language → English default).
- Full suite: **10 passed** (`make test` / `.venv/bin/pytest` from `backend/`).
