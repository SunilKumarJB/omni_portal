# Video Placeholders

Place short looping preview/thumbnail videos here.
The `PromptSelector` component renders a muted preview loop thumbnail inside
each scenario card (playing on hover/focus) and an autoplay loop in the
detail panel when the corresponding file is found.

## Expected files

| File                                    | Template               | Accent colour |
|------------------------------------------|-------------------------|---------------|
| `template_bollywood_romance.mp4`          | Bollywood Romance        | #EA4335 |
| `template_cyberpunk_bengaluru.mp4`        | Cyberpunk Bengaluru      | #FF9900 |
| `template_monsoon_drama.mp4`              | Monsoon Backwaters       | #34A853 |
| `template_mythology_fusion.mp4`           | Ancient-Tech Hampi       | #4285F4 |
| `template_pixar_style.mp4`                | 3D Pixar Style           | #34A853 |

The `custom` template card has no video (it uses a pen icon instead).

## Current file sizes are too large for the web

These clips are full-length, ~720p, with audio. They should be re-encoded to
short, silent, 480p previews before shipping. Run this locally (ffmpeg is not
available on the machine these were authored on):

```sh
ffmpeg -i template_bollywood_romance.mp4 -t 5 -vf scale=-2:480 -an -c:v libx264 -crf 28 -movflags +faststart template_bollywood_romance.mp4.tmp && mv template_bollywood_romance.mp4.tmp template_bollywood_romance.mp4
```

Repeat for each of the five files above (or loop over them):

```sh
for f in template_bollywood_romance template_cyberpunk_bengaluru template_monsoon_drama template_mythology_fusion template_pixar_style; do
  ffmpeg -i "$f.mp4" -t 5 -vf scale=-2:480 -an -c:v libx264 -crf 28 -movflags +faststart "$f.tmp.mp4"
  mv "$f.tmp.mp4" "$f.mp4"
done
```

## Recommended specs
- Duration: 5 seconds, loops seamlessly
- Resolution: 480p (scale=-2:480) is sufficient for thumbnails
- Audio: none (`-an`) — these clips are always rendered muted
- Format: MP4 (H.264), `+faststart` for progressive playback
- Size: aim for a few hundred KB per clip

## Poster / thumbnail images
No poster images exist yet. If added, use `poster_<template_id>.jpg` and wire
them into the `poster` field on the matching `VideoTemplate` entry.

## Notes
- Files are served statically from `/assets/videos/` by Vite dev server and Nginx.
- If a file is missing, the card falls back to the emoji icon — no error shown.
