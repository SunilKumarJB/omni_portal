import httpx
import time
import os
import sys

BASE_URL = "http://localhost:8000"

# Resolve paths relative to this script's location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_PATH = os.path.abspath(
    os.path.join(SCRIPT_DIR, "../../frontend/public/assets/characters/char_01.png")
)


def test_prompts_endpoint():
    print("\n=== Testing Gemini Pro via /api/generate/prompts ===")
    url = f"{BASE_URL}/api/generate/prompts"

    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Sample image not found at {IMAGE_PATH}", file=sys.stderr)
        return False

    print(f"Uploading image: {IMAGE_PATH}")
    try:
        with open(IMAGE_PATH, "rb") as f:
            files = {"file": ("char_01.png", f, "image/png")}
            resp = httpx.post(url, files=files, timeout=30.0)

        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print("Gemini Pro: SUCCESS!")
            print("Response Data (snippet):")
            data = resp.json()
            print(f"Product Description: {data.get('product_description')}")
            print(
                f"Suggested Styles: {[s['name'] for s in data.get('suggested_styles', [])]}"
            )
            print(
                f"Suggested Themes: {[t['name'] for t in data.get('suggested_themes', [])]}"
            )
            print(f"Sample Prompts (count): {len(data.get('sample_prompts', []))}")
            return True
        else:
            print("Gemini Pro: FAILED!")
            print(f"Response: {resp.text}")
            return False
    except Exception as e:
        print(f"Error testing prompts endpoint: {e}", file=sys.stderr)
        return False


def test_video_endpoint():
    print("\n=== Testing Gemini Omni via /api/generate/video ===")
    url = f"{BASE_URL}/api/generate/video"

    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Sample image not found at {IMAGE_PATH}", file=sys.stderr)
        return False

    data = {
        "prompt": "A simple test video of a cute cartoon character walking in a park.",
        "style_id": "lifestyle",
        "theme_id": "nature",
    }

    print("Sending video generation request...")
    try:
        with open(IMAGE_PATH, "rb") as f:
            files = {
                "character_image": ("char_01.png", f, "image/png"),
                "product_image": ("", b"", "application/octet-stream"),
                "audio_file": ("", b"", "application/octet-stream"),
                "source_video": ("", b"", "application/octet-stream"),
            }
            resp = httpx.post(url, data=data, files=files, timeout=30.0)

        print(f"Status Code: {resp.status_code}")
        if resp.status_code != 200:
            print(f"Video Request: FAILED! Response: {resp.text}")
            return False

        res_data = resp.json()
        request_id = res_data.get("request_id")
        print(f"Video Request: SUCCESS! Request ID: {request_id}")

        # Poll status
        status_url = f"{BASE_URL}/api/generate/status/{request_id}"
        print("Polling status...")
        # Poll up to 30 times (90 seconds max) since real video generation takes some time
        for i in range(30):
            time.sleep(3)
            status_resp = httpx.get(status_url)
            if status_resp.status_code != 200:
                print(f"Failed to get status: {status_resp.text}", file=sys.stderr)
                return False

            status_data = status_resp.json()
            status = status_data.get("status")
            progress = status_data.get("progress")
            print(f"Poll #{i + 1}: Status={status}, Progress={progress}%")

            if status == "completed":
                print("Gemini Omni: SUCCESS!")
                print(f"Video URL: {status_data.get('video_url')}")
                return True
            elif status == "failed":
                print("Gemini Omni: FAILED (As expected or encountered error)!")
                print(f"Error Message: {status_data.get('error')}")
                return False

        print("Polling timed out.")
        return False
    except Exception as e:
        print(f"Error testing video endpoint: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    prompts_ok = test_prompts_endpoint()
    video_ok = test_video_endpoint()

    print("\n=== SUMMARY ===")
    print(f"Gemini Pro (Prompts): {'PASSED' if prompts_ok else 'FAILED'}")
    print(f"Gemini Omni (Video): {'PASSED' if video_ok else 'FAILED'}")
