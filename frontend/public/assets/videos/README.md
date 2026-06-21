# Video Placeholders

Place short looping preview/thumbnail videos here.
The `PromptSelector` component renders a muted, autoplay loop thumbnail
inside each scenario card when the corresponding file is found.

## Expected files

| File                    | Template               | Accent colour |
|-------------------------|------------------------|---------------|
| `template_cyberpunk.mp4`     | The Cyberpunk Neon Hustler    | #00D4FF |
| `template_action_hero.mp4`   | The Epic Action Hero          | #F59E0B |
| `template_film_noir.mp4`     | The Vintage Film Noir Detective | #94A3B8 |
| `template_animated.mp4`      | The 3D Animated Mischief Maker | #F472B6 |
| `template_treasure_hunter.mp4` | The Desert Treasure Hunter  | #F97316 |

## Recommended specs
- Duration: 3–6 seconds (loops seamlessly)
- Resolution: 640 × 360 (or 720p) is sufficient for thumbnails
- Format: MP4 (H.264) for widest browser support; WebM also works
- Size: aim for < 2 MB per clip to keep page load fast

## Poster / thumbnail images
You can also add static poster images used before the video loads:

| File                          | Used by             |
|-------------------------------|---------------------|
| `poster_cyberpunk.jpg`        | Cyberpunk card      |
| `poster_action_hero.jpg`      | Action Hero card    |
| `poster_film_noir.jpg`        | Film Noir card      |
| `poster_animated.jpg`         | Animated card       |
| `poster_treasure_hunter.jpg`  | Treasure Hunter card|

## Notes
- Files are served statically from `/assets/videos/` by Vite dev server and Nginx.
- If a file is missing, the card simply falls back to the emoji icon — no error shown.
- The `custom` template card has no video placeholder (it uses a pen icon instead).
