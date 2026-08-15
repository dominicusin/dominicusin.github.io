#!/usr/bin/env python3
"""Generate a minimal valid 1200x630 PNG (OpenGraph default social image).

No third-party deps: uses only stdlib zlib + struct + the PNG CRC.
Solid dark background with a light border so shared links have a preview.
"""
import struct
import zlib
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "og-default.png")

BG = (23, 23, 23)        # matches Blowfish dark #171717
FG = (240, 240, 240)


def chunk(tag: bytes, data: bytes) -> bytes:
    c = struct.pack(">I", len(data)) + tag + data
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return c + struct.pack(">I", crc)


def main() -> None:
    # raw image: each row prefixed with filter byte 0
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        for x in range(W):
            # border frame
            if x < 12 or x >= W - 12 or y < 12 or y >= H - 12:
                raw += bytes(FG)
            else:
                raw += bytes(BG)
    compressed = zlib.compress(bytes(raw), 9)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", compressed)
    png += chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "wb") as f:
        f.write(png)
    print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    main()
