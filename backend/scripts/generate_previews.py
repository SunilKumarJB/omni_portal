import asyncio
import httpx
import os
import sys

BASE_URL = "http://localhost:8000"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../frontend/public/assets/videos"))


# Resolve character image path helper
def get_char_image_path(char_id: str) -> str:
    return os.path.abspath(
        os.path.join(SCRIPT_DIR, f"../../frontend/public/assets/characters/{char_id}.png")
    )


SCENARIOS = [
    {
        "style_id": "cyberpunk_bengaluru",
        "theme_id": "cyberpunk",
        "title": "Cyberpunk Bengaluru",
        "char_id": "char_03",  # Rohan (Techie Boy)
        "prompt": "One continuous tracking shot on a 35mm lens, gliding in front of a young Indian man wearing a hoodie and glasses as he walks through a futuristic Bengaluru at night. The scene is illuminated by vibrant orange and deep teal neon lights. Hovering vehicles fly in the background, and glowing holographic billboards light up the rain-slicked streets.",
        "dialogue": "They said the city never sleeps. Good… neither do my innovations.",
        "language": "en",
    },
]


async def generate_scenario_preview(client: httpx.AsyncClient, scenario: dict):
    style_id = scenario["style_id"]
    char_id = scenario.get("char_id", "char_01")
    char_image_path = get_char_image_path(char_id)

    print(f"[{style_id}] Starting generation using character {char_id}...")

    if not os.path.exists(char_image_path):
        print(f"[{style_id}] Error: Character image not found at {char_image_path}")
        return False

    # Open character image
    with open(char_image_path, "rb") as f:
        files = {
            "character_image": (f"{char_id}.png", f, "image/png"),
            "product_image": ("", b"", "application/octet-stream"),
            "audio_file": ("", b"", "application/octet-stream"),
            "source_video": ("", b"", "application/octet-stream"),
        }
        data = {
            "prompt": scenario["prompt"],
            "style_id": style_id,
            "theme_id": scenario["theme_id"],
            "dialogue": scenario["dialogue"],
            "language": scenario["language"],
        }

        resp = await client.post(
            f"{BASE_URL}/api/generate/video", data=data, files=files, timeout=60.0
        )

    if resp.status_code != 200:
        print(f"[{style_id}] Failed to trigger: {resp.text}")
        return False

    res_data = resp.json()
    request_id = res_data.get("request_id")
    print(f"[{style_id}] Triggered successfully. Request ID: {request_id}")

    # Poll status
    status_url = f"{BASE_URL}/api/generate/status/{request_id}"
    for poll in range(60):  # Poll up to 60 times (180 seconds max)
        await asyncio.sleep(4)
        status_resp = await client.get(status_url)
        if status_resp.status_code != 200:
            print(f"[{style_id}] Poll #{poll + 1} failed to get status: {status_resp.text}")
            return False

        status_data = status_resp.json()
        status = status_data.get("status")
        progress = status_data.get("progress")
        print(f"[{style_id}] Poll #{poll + 1}: Status={status}, Progress={progress}%")

        if status == "completed":
            video_url = status_data.get("video_url")
            print(f"[{style_id}] Completed! Video URL: {video_url}")

            # Download video
            print(f"[{style_id}] Downloading video...")
            video_resp = await client.get(f"{BASE_URL}{video_url}", timeout=60.0)
            if video_resp.status_code != 200:
                print(f"[{style_id}] Failed to download video: {video_resp.text}")
                return False

            # Save video
            output_path = os.path.join(OUTPUT_DIR, f"template_{style_id}.mp4")
            with open(output_path, "wb") as out_f:
                out_f.write(video_resp.content)
            print(f"[{style_id}] Saved to {output_path}")
            return True
        elif status == "failed":
            print(f"[{style_id}] Generation failed! Error: {status_data.get('error')}")
            return False

    print(f"[{style_id}] Polling timed out.")
    return False


async def main():
    for s in SCENARIOS:
        char_id = s.get("char_id", "char_01")
        path = get_char_image_path(char_id)
        if not os.path.exists(path):
            print(f"Error: Character image not found at {path}", file=sys.stderr)
            return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Starting parallel generation of {len(SCENARIOS)} scenario previews...")
    async with httpx.AsyncClient() as client:
        tasks = [generate_scenario_preview(client, s) for s in SCENARIOS]
        results = await asyncio.gather(*tasks)

    print("\n=== GENERATION SUMMARY ===")
    for s, success in zip(SCENARIOS, results):
        print(f"{s['title']}: {'SUCCESS' if success else 'FAILED'}")


if __name__ == "__main__":
    asyncio.run(main())
