#!/usr/bin/env python3
"""Load music.json, or create it by scanning music/*.mp3."""

import json
import subprocess
from pathlib import Path


RADIO_DIRECTORY = Path(__file__).resolve().parent
MUSIC_DIRECTORY = RADIO_DIRECTORY / "music"
MANIFEST_FILE = RADIO_DIRECTORY / "music.json"


def get_duration(file: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(file),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return round(float(result.stdout.strip()), 3)


def scan_music() -> list[dict]:
    files = sorted(MUSIC_DIRECTORY.glob("*.mp3"), key=lambda file: file.name.casefold())
    return [
        {
            "name": file.stem,
            "duration": get_duration(file),
            "file": f"music/{file.name}",
        }
        for file in files
    ]


def load_or_create_manifest() -> list[dict]:
    if MANIFEST_FILE.exists():
        with MANIFEST_FILE.open(encoding="utf-8") as file:
            return json.load(file)

    tracks = scan_music()
    with MANIFEST_FILE.open("w", encoding="utf-8") as file:
        json.dump(tracks, file, ensure_ascii=False, indent=2)
        file.write("\n")
    return tracks


if __name__ == "__main__":
    music = load_or_create_manifest()
    print(f"{len(music)} tracks in {MANIFEST_FILE}")
