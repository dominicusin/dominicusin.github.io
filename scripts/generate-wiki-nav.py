#!/usr/bin/env python3
"""
Generate Hugo navigation front matter for the GitHub Wiki section.

The wiki lives in `content/wiki/` as a git *submodule* (read-only during
build). Blowfish does NOT ship a hierarchical docs-tree sidebar — it only
renders a flat `menu.main` built from front matter. This script therefore:

  1. Reads the wiki submodule files (never writes to them).
  2. Copies each page into `content/wiki-build/` (git-ignored intermediate
     dir) and injects front matter: title (from the first H1), a stable
     `weight`, and a `menu.main` entry so the page appears in the nav.
  3. Writes `content/wiki-build/_index.md` for the "Wiki" section itself.

Run this BEFORE `hugo` in CI (and locally). See ADR-00XX (wiki sync).
"""
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIKI_SRC = os.path.join(ROOT, "content", "wiki")          # submodule (read-only)
WIKI_BUILD = os.path.join(ROOT, "content", "wiki-build")  # generated, git-ignored

# Section landing weight is lower so "Wiki" sits above its child pages.
SECTION_WEIGHT = 110
# Child pages get weights 111..; order by filename for determinism.
CHILD_BASE = 111


def extract_title(md_text: str, fallback: str) -> str:
    """Use the first Markdown H1 as the title, else the file stem."""
    m = re.search(r"^#\s+(.+?)\s*$", md_text, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return fallback


def split_front_matter(md_text: str):
    """Return (front_matter_dict_lines, body) — body starts after '---' pair."""
    if md_text.startswith("---"):
        end = md_text.find("\n---", 3)
        if end != -1:
            fm = md_text[3:end].strip()
            body = md_text[end + 4:].lstrip("\n")
            return fm, body
    return "", md_text


def build_page(src_path: str, out_path: str, weight: int, title: str):
    raw = open(src_path, encoding="utf-8").read()
    _, body = split_front_matter(raw)
    # Keep the original H1 in the body (don't duplicate it as a title heading
    # clash — Hugo still renders the heading, that's fine for a wiki page).
    fm = [
        "---",
        f"title: {title!r}",
        "description: Documentation mirrored from the repository GitHub Wiki.",
        "type: wiki",
        f"weight: {weight}",
        "menu:",
        "  main:",
        f"    name: {title!r}",
        f"    weight: {weight}",
        f"    identifier: wiki-{weight}",
        "---",
        "",
    ]
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(fm) + "\n" + body)


def main():
    if not os.path.isdir(WIKI_SRC):
        raise SystemExit(f"Wiki submodule not found at {WIKI_SRC}. "
                         "Run `git submodule update --init --recursive` first.")

    shutil.rmtree(WIKI_BUILD, ignore_errors=True)
    os.makedirs(WIKI_BUILD, exist_ok=True)

    md_files = sorted(
        f for f in os.listdir(WIKI_SRC)
        if f.endswith(".md") and f.lower() != "_index.md"
    )

    index_fm = [
        "---",
        "title: Wiki",
        "description: Operational & security documentation mirrored from the GitHub Wiki.",
        f"weight: {SECTION_WEIGHT}",
        "menu:",
        "  main:",
        "    name: Wiki",
        f"    weight: {SECTION_WEIGHT}",
        "    identifier: wiki-section",
        "---",
        "",
        "This section mirrors the [repository GitHub Wiki](https://github.com/"
        "dominicusin/dominicusin.github.io/wiki). It is regenerated automatically "
        "during the CI build from the `content/wiki` submodule.",
        "",
    ]
    with open(os.path.join(WIKI_BUILD, "_index.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(index_fm) + "\n")

    for i, fname in enumerate(md_files):
        src = os.path.join(WIKI_SRC, fname)
        out = os.path.join(WIKI_BUILD, fname)
        weight = CHILD_BASE + i
        title = extract_title(open(src, encoding="utf-8").read(),
                              os.path.splitext(fname)[0])
        build_page(src, out, weight, title)
        print(f"  generated {out} (weight={weight}, title={title!r})")

    print(f"Wiki nav generated: {len(md_files)} pages -> {WIKI_BUILD}")


if __name__ == "__main__":
    main()
