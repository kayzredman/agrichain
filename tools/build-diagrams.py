#!/usr/bin/env python3
"""Regenerate the two diagrams changed by the acceptance QA."""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "docs" / "diagrams"

STYLE = """  <style>
    .title { font: 600 15px Calibri, Segoe UI, sans-serif; fill: #143228; }
    .sub { font: 400 12px Calibri, Segoe UI, sans-serif; fill: #52636B; }
    .chip { font: 600 11px Calibri, Segoe UI, sans-serif; fill: #2D6A4F; }
    .head { font: 600 13px Calibri, Segoe UI, sans-serif; fill: #143228; }
    .small { font: 400 11px Calibri, Segoe UI, sans-serif; fill: #1F2937; }
    .muted { font: 400 11px Calibri, Segoe UI, sans-serif; fill: #52636B; }
    .on { font: 600 11px Calibri, Segoe UI, sans-serif; fill: #143228; }
    .later { font: 600 11px Calibri, Segoe UI, sans-serif; fill: #52636B; }
  </style>"""

INK = "#143228"
FILL = "#F4F7F5"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def open_svg(w, h):
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}" role="img">',
        STYLE,
        f'  <rect width="{w}" height="{h}" fill="#ffffff"/>',
    ]


def box(x, y, w, h):
    return (
        f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" '
        f'fill="{FILL}" stroke="{INK}" stroke-width="1.25"/>'
    )


def text(cls, x, y, s):
    return f'  <text class="{cls}" x="{x}" y="{y}">{esc(s)}</text>'


def arrow_down(cx, y0, length=16):
    tip = y0 + length + 6
    return (
        f'  <line x1="{cx}" y1="{y0}" x2="{cx}" y2="{y0 + length}" '
        f'stroke="{INK}" stroke-width="1.25"/>'
        f'<polygon points="{cx - 4},{y0 + length} {cx + 4},{y0 + length} {cx},{tip}" '
        f'fill="{INK}"/>'
    )


def arrow_right(cy, x0, length=12):
    tip = x0 + length + 6
    return (
        f'  <line x1="{x0}" y1="{cy}" x2="{x0 + length}" y2="{cy}" '
        f'stroke="{INK}" stroke-width="1.25"/>'
        f'<polygon points="{x0 + length},{cy - 4} {x0 + length},{cy + 4} {tip},{cy} " '
        f'fill="{INK}"/>'
    )


def lot_flow():
    steps = [
        ("Coop clerk", "Parcel",
         "Registers the season ceiling. The grower is a record, not a login."),
        ("Coop clerk", "Harvest",
         "Signs the event. The lot opens and biological origin is fixed."),
        ("Coop clerk", "Merge",
         "Signs the event. Several harvests become one lot. Inputs stay attached."),
        ("Coop clerk", "Transfer",
         "Names the plant as receiver. Custody has not moved yet."),
        ("Coop clerk", "Load",
         "Signs the event. The lot leaves the origin country."),
        ("Plant clerk", "Accept",
         "Signs on arrival. Custody moves here, and only here."),
        ("Plant clerk", "Process",
         "Signs the event. Outputs, declared loss, and the process country."),
        ("Plant clerk", "Pack",
         "Sets the packing expiry and mints the code the bag carries."),
        ("Derived", "Claim",
         "Built from the events. No one edits it. Origin is not replaced."),
    ]
    x, w, bh, gap, top = 80, 560, 66, 22, 16
    pitch = bh + gap
    width = 720
    height = top + len(steps) * bh + (len(steps) - 1) * gap + top
    cx = x + w // 2

    out = open_svg(width, height)
    for i, (who, title, sub) in enumerate(steps):
        y = top + i * pitch
        out.append(box(x, y, w, bh))
        out.append(text("chip", x + 16, y + 20, who))
        out.append(text("title", x + 16, y + 40, title))
        out.append(text("sub", x + 16, y + 58, sub))
        if i < len(steps) - 1:
            out.append(arrow_down(cx, y + bh))
    out.append("</svg>")
    return "\n".join(out) + "\n"


def write_path():
    steps = [
        ("1", "Session", "Capability, holder"),
        ("2", "Event", "Canonical JSON"),
        ("3", "Sign", "Ed25519 and key id"),
        ("4", "Verify", "Signature and head"),
        ("5", "Refuse", "Impossible writes"),
        ("6", "Store", "Event, claim, alerts"),
        ("7", "Reply", "New head and status"),
    ]
    margin, bw, bh, gap, top = 19, 132, 86, 18, 28
    width = margin * 2 + len(steps) * bw + (len(steps) - 1) * gap
    height = 134
    cy = top + bh // 2

    out = open_svg(width, height)
    for i, (num, title, sub) in enumerate(steps):
        x = margin + i * (bw + gap)
        out.append(box(x, top, bw, bh))
        out.append(text("chip", x + 12, top + 22, num))
        out.append(text("title", x + 12, top + 44, title))
        out.append(text("sub", x + 12, top + 64, sub))
        if i < len(steps) - 1:
            out.append(arrow_right(cy, x + bw))
    out.append("</svg>")
    return "\n".join(out) + "\n"


for name, svg in (("lot-flow", lot_flow()), ("write-path", write_path())):
    path = OUT / f"{name}.svg"
    path.write_text(svg, encoding="utf-8")
    first = svg.splitlines()[0]
    print(f"{path.name}: {first[first.index('width='):first.index('viewBox')].strip()}")
