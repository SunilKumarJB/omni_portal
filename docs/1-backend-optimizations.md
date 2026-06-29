# Backend Optimization & Hardening Log

**Date:** 2026-06-23
**Branch:** `feat/adhish-dev`
**Context:** Pre-customer-demo review of the backend against the Gemini API
integration guidance. Goal: make the live (non-`TEST_MODE`) path correct and
demo-safe. All changes below are scoped to `backend/`.

**Current local-demo note:** the preferred laptop smoke-test path is the frontend
**Test Mode** toggle in the side rail. That mode creates a completed mock request
without calling GCP. Backend `TEST_MODE` remains a backend configuration concept,
but the live wizard demo no longer depends on placing real GCP credentials on the
local laptop.

This document exists so every change can be understood and **reverted
independently** if a demo environment behaves unexpectedly.

---

## Summary

| # | Change | Severity | File(s) | Reversible |
|---|--------|----------|---------|------------|
| 1 | Fix double-base64 image encoding to Gemini | 🔴 Critical | `app/services/gemini_service.py` | Yes |
| 2 | Signed URLs instead of `make_public()` for GCS | 🟠 High | `app/services/storage_service.py` | Yes |
| 3 | Live progress during Omni generation | 🟡 Medium | `app/services/omni_service.py`, `app/api/routes/generate.py` | Yes |
| 4 | Remove dead `veo_service` | ⚪ Low | `app/services/veo_service.py` (deleted), `app/main.py`, `app/config.py`, `.env.example` | Yes |

**Deliberately NOT changed:** Gemini model names (`gemini-2.5-pro`,
`gemini-2.0-flash`) were kept as-is per explicit decision — they are tested and
working in the target project. The integration guidance lists newer model IDs,
but swapping models before a demo risks a hard `404` on stage. Revisit only
after confirming model availability in the demo project.

---

## 1. 🔴 Double-base64 image encoding to Gemini (correctness bug)

**Symptom (would have surfaced live):** Step 1 of the wizard (product-image
analysis → style/theme/prompt suggestions) returns garbage or errors. Hidden
during development because `TEST_MODE=true` short-circuits to canned responses.

**Root cause:** The `google-genai` SDK base64-encodes inline media internally
during request serialization. The code pre-encoded the bytes and passed the
encoded string into `types.Blob(data=...)`, double-encoding the image. Gemini
received corrupted data.

**Fix:** Pass **raw bytes** via the canonical helper.

```python
# Before
image_b64 = base64.b64encode(image_bytes).decode()
types.Part(inline_data=types.Blob(mime_type=mime_type, data=image_b64))

# After
types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
```

Applied in both `generate_prompts_from_image()` and `analyze_image_for_video()`.
The now-unused `import base64` was removed.

**To revert:** restore the `image_b64 = base64.b64encode(...)` lines, the
`types.Part(inline_data=types.Blob(...))` form, and the `import base64`.
(Not recommended — the old form is the bug.)

---

## 2. 🟠 Signed URLs instead of `make_public()` (GCS compatibility)

**Symptom (would have surfaced live):** Every GCS upload (assets, QR code,
generated video) raises `403 PERMISSION_DENIED` on buckets with **Uniform
Bucket-Level Access** — the GCS default for new buckets. Object ACLs /
`blob.make_public()` are disallowed under UBLA.

**Fix:** In `storage_service._upload_to_gcs`, drop `make_public()` and return a
**v4 signed URL** (default TTL 7 days, the v4 maximum — fine for an event).
A new `_signed_url(blob)` helper signs via the IAM SignBlob path
(`service_account_email` + `access_token` from ADC), which works on Cloud
Run / GCE **without** a downloaded private-key file. If signing isn't possible
it falls back to `blob.public_url` so the pipeline never hard-fails on the link
step.

**Operational note:** the runtime service account needs
`roles/iam.serviceAccountTokenCreator` (on itself) for IAM-based signing.
If you instead make the bucket public via IAM
(`gsutil iam ch allUsers:objectViewer gs://<bucket>`), the fallback path still
returns a working URL.

**Tuning:** change `_SIGNED_URL_TTL` in `storage_service.py`.

**To revert:** restore the two-line body:
```python
await asyncio.to_thread(blob.make_public)
return blob.public_url, f"gs://{settings.GCS_BUCKET_NAME}/{path}"
```
and delete `_signed_url` + the `timedelta` import. (Only safe if the bucket
has fine-grained ACLs, not UBLA.)

---

## 3. 🟡 Live progress during Omni generation (demo UX)

**Symptom:** Progress bar froze at 30% for the full multi-minute Omni call,
then jumped to 90% — reads as "hung" in front of an audience.

**Fix:** `omni_service.generate_video()` accepts an optional
`progress_callback(fraction: float)` invoked on each poll tick with
`min(elapsed / OMNI_MAX_WAIT_SECONDS, 0.95)`. The callback is best-effort —
exceptions inside it are swallowed so progress reporting can never break
generation. `generate._run_generation` passes a callback that maps the
fraction onto the **30–85%** band:

```python
async def _omni_progress(fraction: float):
    pct = 30 + int(55 * fraction)
    await db_service.update_request(request_id, {"progress": pct})
```

Passed to both the primary and the silent-audio-fallback generation calls.

**To revert:** remove the `progress_callback` parameter and its use in
`omni_service.generate_video`, and remove `_omni_progress` + the two
`progress_callback=_omni_progress` arguments in `generate.py`.

---

## 4. ⚪ Remove dead `veo_service`

`app/services/veo_service.py` was an earlier Veo-based generation path,
superseded by `omni_service.py`. It was unreferenced by any route yet still
advertised via `/health` and carried a `VEO_MODEL` setting.

**Removed:**
- `app/services/veo_service.py` (deleted)
- `app/tests/test_veo_service.py` (deleted)
- `VEO_MODEL` from `app/config.py` and `.env.example`
- `/health` now reports `"omni": settings.OMNI_MODEL` instead of `"veo": ...`

**To revert:** `git checkout <pre-change-commit> -- backend/app/services/veo_service.py backend/tests/test_veo_service.py` and re-add the `VEO_MODEL` setting + `/health` entry.

---

## Tests

`backend/tests/` updated to match changes 2 and 3:
- `test_storage_service.py` — asserts `_signed_url` is offloaded to a thread and
  `make_public` is **not** called.
- `test_generate_pipeline.py` — asserts the Omni call now includes
  `progress_callback`.

Full suite: **9 passed** (`python -m pytest -q` from `backend/`).

---

## Verification checklist before the demo

- [ ] `TEST_MODE=false` in the demo `.env`
- [ ] Step 1 (upload a product photo) returns real style/theme/prompt suggestions
- [ ] Generated video + QR resolve via signed URL (or public bucket)
- [ ] Runtime SA has `roles/iam.serviceAccountTokenCreator` **or** bucket is public
- [ ] Progress bar advances smoothly past 30% during generation
