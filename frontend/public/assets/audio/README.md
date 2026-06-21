# Audio Placeholders

Place audio preview files here using the naming convention below.
The `AudioSelector` component will automatically render an inline `<audio>` player
for each preset when its file is present.

## Expected files

| File               | Preset name        | BPM | Mood         |
|--------------------|--------------------|-----|--------------|
| `audio_01.mp3`     | Upbeat Corporate   | 128 | Energetic    |
| `audio_02.mp3`     | Cinematic Epic     |  90 | Dramatic     |
| `audio_03.mp3`     | Calm Ambient       |  70 | Peaceful     |
| `audio_04.mp3`     | Energetic Pop      | 138 | Fun          |
| `audio_05.mp3`     | Inspirational      | 100 | Uplifting    |
| `audio_06.mp3`     | Minimal Modern     | 110 | Contemporary |

## Supported formats
MP3 recommended (best browser compatibility). WAV, OGG, and WebM also work.

## Notes
- Clip length: 20–30 seconds is ideal for a preview loop.
- Files are served statically from `/assets/audio/` by the Vite dev server and Nginx.
- If a file is missing the player is simply hidden — no error is shown to the user.
- When a user uploads their own audio file (`audio_file` form field), that file is
  passed to Omni for lip-sync / audio-driven generation regardless of these presets.
