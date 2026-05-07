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
MAX_THEME_ARCHIVE_BYTES = 95 * 1024 * 1024

THEME_DEFINITIONS = [
    {
        "slug": "bear-collection",
        "title": "Bear Series Collection",
        "description": "Grouped bear carving model series packaged together.",
    },
    {
        "slug": "owl-collection",
        "title": "Owl Series Collection",
        "description": "Grouped owl carving model series packaged together.",
    },
    {
        "slug": "rabbit-collection",
        "title": "Rabbit Series Collection",
        "description": "Grouped rabbit carving model series packaged together.",
    },
    {
        "slug": "fox-raccoon-collection",
        "title": "Fox & Raccoon Collection",
        "description": "Grouped fox and raccoon carving model series packaged together.",
    },
    {
        "slug": "bigfoot-collection",
        "title": "Bigfoot Collection",
        "description": "Grouped Bigfoot carving model series packaged together.",
    },
]


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


def build_zip_variant(entries: list[tuple[Path, str]], method: int, compresslevel: int | None) -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    with zipfile.ZipFile(tmp_path, "w", compression=method, compresslevel=compresslevel) as archive:
        for file_path, arcname in entries:
            archive.write(file_path, arcname=arcname)
    return tmp_path


def choose_archive(entries: list[tuple[Path, str]], final_path: Path) -> int:
    stored_path = build_zip_variant(entries, zipfile.ZIP_STORED, None)
    deflated_path = build_zip_variant(entries, zipfile.ZIP_DEFLATED, 6)
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


def classify_theme_slug(series_slug: str) -> str:
    slug = series_slug.lower()
    if "bigfoot" in slug:
        return "bigfoot-collection"
    if "owl" in slug:
        return "owl-collection"
    if "rabbit" in slug:
        return "rabbit-collection"
    if "fox" in slug or "raccoon" in slug:
        return "fox-raccoon-collection"
    return "bear-collection"


def split_theme_series(series_list: list[dict], max_bundle_bytes: int) -> list[list[dict]]:
    chunks: list[list[dict]] = []
    current: list[dict] = []
    current_bytes = 0
    for entry in series_list:
        series_bytes = sum(int(image.get("bytes", 0)) for image in entry.get("images", []))
        if current and current_bytes + series_bytes > max_bundle_bytes:
            chunks.append(current)
            current = []
            current_bytes = 0
        current.append(entry)
        current_bytes += series_bytes
    if current:
        chunks.append(current)
    return chunks


def bundle_suffix(index: int) -> str:
    value = index
    out = ""
    while True:
        out = chr(ord("a") + (value % 26)) + out
        value = value // 26 - 1
        if value < 0:
            return out


def remove_stale_theme_archives() -> None:
    for theme in THEME_DEFINITIONS:
        slug = theme["slug"]
        for candidate in ARCHIVE_ROOT.glob(f"{slug}*.zip"):
            if candidate.is_file():
                candidate.unlink()


def build_manifest(now_iso: str) -> dict:
    series_entries: list[dict] = []
    theme_groups: dict[str, list[dict]] = {theme["slug"]: [] for theme in THEME_DEFINITIONS}
    remove_stale_theme_archives()
    for series_dir in iter_series_dirs():
        files = iter_series_images(series_dir)
        if not files:
            continue

        archive_path = ARCHIVE_ROOT / f"{series_dir.name}.zip"
        archive_entries = [(file_path, f"{series_dir.name}/{file_path.name}") for file_path in files]
        archive_size = choose_archive(archive_entries, archive_path)
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

        series_entry = {
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
        }
        series_entries.append(series_entry)
        theme_groups[classify_theme_slug(series_dir.name)].append(series_entry)

    theme_archives: list[dict] = []
    for theme in THEME_DEFINITIONS:
        slug = theme["slug"]
        series_list = theme_groups.get(slug, [])
        if not series_list:
            continue
        chunks = split_theme_series(series_list, MAX_THEME_ARCHIVE_BYTES)
        total_chunks = len(chunks)
        for chunk_index, chunk in enumerate(chunks):
            suffix = bundle_suffix(chunk_index)
            archive_stem = slug if total_chunks == 1 else f"{slug}-{suffix}"
            archive_path = ARCHIVE_ROOT / f"{archive_stem}.zip"
            theme_entries: list[tuple[Path, str]] = []
            for entry in chunk:
                for image in entry["images"]:
                    file_path = IMAGE_ROOT / entry["slug"] / image["file_name"]
                    theme_entries.append((file_path, f"{archive_stem}/{entry['slug']}/{image['file_name']}"))
            archive_size = choose_archive(theme_entries, archive_path)
            latest_mtime = max([archive_path.stat().st_mtime] + [file_path.stat().st_mtime for file_path, _ in theme_entries])
            created_at = iso_from_timestamp(latest_mtime)
            part_label = "" if total_chunks == 1 else f" {suffix.upper()}"
            description = theme["description"]
            if total_chunks > 1:
                description += f" Part {suffix.upper()} of {total_chunks}."
            theme_archives.append({
                "id": f"{archive_stem}-archive-01",
                "slug": archive_stem,
                "title": theme["title"] + part_label,
                "description": description,
                "series_slugs": [entry["slug"] for entry in chunk],
                "series_count": len(chunk),
                "url": f"https://chainandchisel.art/assets/model-repository-archives/{archive_stem}.zip",
                "public_id": "",
                "file_name": f"{archive_stem}.zip",
                "mime_type": "application/zip",
                "bytes": archive_size,
                "created_at": created_at,
            })

    return {
        "version": 1,
        "updated_at": now_iso,
        "series": series_entries,
        "theme_archives": theme_archives,
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
