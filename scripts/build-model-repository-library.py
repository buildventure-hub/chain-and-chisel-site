#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
IMAGE_ROOT = REPO_ROOT / "assets" / "model-repository-images"
ARCHIVE_ROOT = REPO_ROOT / "assets" / "model-repository-archives"
DEFAULT_CHAIN_MANIFEST = REPO_ROOT / "model-repository-seed.json"


def titleize(slug: str) -> str:
    words = slug.replace("-", " ").split()
    lowers = {"and", "with", "on", "of", "in", "a", "b"}
    out: list[str] = []
    for index, word in enumerate(words):
        if word in {"a", "b"} and index == len(words) - 1:
            out.append(word.upper())
        elif index and word in lowers:
            out.append(word)
        else:
            out.append(word.capitalize())
    return " ".join(out)


def series_description(slug: str) -> str:
    if "turnaround" in slug:
        return "Seeded turnaround reference series from the Chain & Chisel reference library."
    if "reference-sheet" in slug or "reference-sheets" in slug:
        return "Seeded reference-sheet series from the Chain & Chisel reference library."
    if "preview" in slug or "previews" in slug:
        return "Seeded preview image series from the Chain & Chisel reference library."
    return "Seeded model series from the Chain & Chisel reference library."


def iso_from_timestamp(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def iter_series_dirs() -> list[Path]:
    return sorted(
        path
        for path in IMAGE_ROOT.iterdir()
        if path.is_dir() and not path.name.startswith(".")
    )


def iter_series_images(series_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in series_dir.iterdir()
        if path.is_file() and path.suffix.lower() == ".png" and not path.name.startswith(".")
    )


def build_zip_variant(series_dir: Path, files: list[Path], method: int, compresslevel: int | None) -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    with zipfile.ZipFile(tmp_path, "w", compression=method, compresslevel=compresslevel) as archive:
        for file_path in files:
            archive.write(file_path, arcname=f"{series_dir.name}/{file_path.name}")
    return tmp_path


def choose_archive(series_dir: Path, files: list[Path], final_path: Path) -> int:
    stored_path = build_zip_variant(series_dir, files, zipfile.ZIP_STORED, None)
    deflated_path = build_zip_variant(series_dir, files, zipfile.ZIP_DEFLATED, 6)
    try:
        stored_size = stored_path.stat().st_size
        deflated_size = deflated_path.stat().st_size
        winner = deflated_path if deflated_size < stored_size else stored_path
        final_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(winner), final_path)
        return final_path.stat().st_size
    finally:
        for candidate in (stored_path, deflated_path):
            if candidate.exists():
                candidate.unlink()


def build_manifest(now_iso: str) -> dict:
    series_entries: list[dict] = []
    for series_dir in iter_series_dirs():
        files = iter_series_images(series_dir)
        if not files:
            continue

        archive_path = ARCHIVE_ROOT / f"{series_dir.name}.zip"
        archive_size = choose_archive(series_dir, files, archive_path)
        latest_mtime = max(path.stat().st_mtime for path in files + [archive_path])
        created_at = iso_from_timestamp(latest_mtime)

        images: list[dict] = []
        for index, file_path in enumerate(files, start=1):
            images.append({
                "id": f"{series_dir.name}-image-{index:02d}",
                "url": f"https://chainandchisel.art/assets/model-repository-images/{series_dir.name}/{file_path.name}",
                "public_id": "",
                "file_name": file_path.name,
                "folder_path": series_dir.name,
                "title": "",
                "description": "",
                "cropX": 50,
                "cropY": 50,
                "zoom": 1,
                "mime_type": "image/png",
                "bytes": file_path.stat().st_size,
                "created_at": created_at,
            })

        series_entries.append({
            "id": f"seed-{series_dir.name}",
            "slug": series_dir.name,
            "title": titleize(series_dir.name),
            "description": series_description(series_dir.name),
            "created_at": created_at,
            "updated_at": now_iso,
            "images": images,
            "archives": [{
                "id": f"{series_dir.name}-archive-01",
                "url": f"https://chainandchisel.art/assets/model-repository-archives/{series_dir.name}.zip",
                "public_id": "",
                "file_name": f"{series_dir.name}.zip",
                "mime_type": "application/zip",
                "bytes": archive_size,
                "created_at": created_at,
            }],
        })

    return {
        "version": 1,
        "updated_at": now_iso,
        "series": series_entries,
    }


def write_manifest(path: Path, manifest: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build model repository ZIP archives and seed manifests.")
    parser.add_argument(
        "--chain-manifest",
        default=str(DEFAULT_CHAIN_MANIFEST),
        help="Path to the chain site seed manifest output.",
    )
    parser.add_argument(
        "--extra-manifest",
        action="append",
        default=[],
        help="Additional manifest path(s) to write with the same data.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    now_iso = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    manifest = build_manifest(now_iso)
    write_manifest(Path(args.chain_manifest), manifest)
    for target in args.extra_manifest:
        write_manifest(Path(target), manifest)

    total_images = sum(len(entry.get("images", [])) for entry in manifest["series"])
    total_archive_bytes = sum(int(entry["archives"][0]["bytes"]) for entry in manifest["series"] if entry.get("archives"))
    print(f"series {len(manifest['series'])}")
    print(f"images {total_images}")
    print(f"archives {len(manifest['series'])}")
    print(f"archive_bytes {total_archive_bytes}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
