#!/usr/bin/env python3
"""Draw the transparency log: events, tree, signed head, counter-signatures."""

from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "docs" / "diagrams" / "transparency-log.svg"

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
W, H = 920, 446
M = 19

p = []
add = p.append
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">')
add(STYLE)
add(f'  <rect width="{W}" height="{H}" fill="#ffffff"/>')


def box(x, y, w, h, fill=FILL):
    add(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" '
        f'stroke="{INK}" stroke-width="1.25"/>')


def txt(cls, x, y, s):
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    add(f'  <text class="{cls}" x="{x}" y="{y}">{s}</text>')


def line(x1, y1, x2, y2):
    add(f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="1.25"/>')


def tip_down(cx, y):
    add(f'  <polygon points="{cx - 4},{y - 6} {cx + 4},{y - 6} {cx},{y}" fill="{INK}"/>')


def tip_up(cx, y):
    add(f'  <polygon points="{cx - 4},{y + 6} {cx + 4},{y + 6} {cx},{y}" fill="{INK}"/>')


def tip_right(x, cy):
    add(f'  <polygon points="{x - 6},{cy - 4} {x - 6},{cy + 4} {x},{cy}" fill="{INK}"/>')


# Leaves
txt("head", M, 30, "Every event becomes one leaf, in the order it was stored")
leaf_y, leaf_h = 44, 58
leaf_w, gap = 158, 14
leaves = [
    ("harvest", "H-1041"),
    ("merge", "M-220"),
    ("accept", "M-220"),
    ("process", "K-220A"),
    ("pack", "K-220A"),
]
centres = []
for i, (kind, lot) in enumerate(leaves):
    x = M + i * (leaf_w + gap)
    box(x, leaf_y, leaf_w, leaf_h)
    txt("chip", x + 12, leaf_y + 20, f"leaf {i}")
    txt("small", x + 12, leaf_y + 40, f"{kind} · {lot}")
    centres.append(x + leaf_w // 2)

# Rail from the leaves down into the tree
tree_y, tree_h = 162, 76
tree_w = 436
rail = 126
for cx in centres:
    line(cx, leaf_y + leaf_h, cx, rail)
line(centres[0], rail, centres[-1], rail)
drop = M + tree_w // 2
line(drop, rail, drop, tree_y - 6)
tip_down(drop, tree_y)

box(M, tree_y, tree_w, tree_h)
txt("title", M + 16, tree_y + 25, "Merkle tree")
txt("sub", M + 16, tree_y + 45, "Leaves hashed in pairs, up to one root.")
txt("sub", M + 16, tree_y + 63, "Append only. Nothing is removed or reordered.")

head_x, head_w = 483, 418
box(head_x, tree_y, head_w, tree_h)
txt("title", head_x + 16, tree_y + 25, "Signed tree head")
txt("sub", head_x + 16, tree_y + 45, "Tree size, root hash, timestamp.")
txt("sub", head_x + 16, tree_y + 63, "Signed by the operator.")

line(M + tree_w, tree_y + tree_h // 2, head_x - 6, tree_y + tree_h // 2)
tip_right(head_x, tree_y + tree_h // 2)

# Organizations counter-signing, joined by a rail up to the head
org_y, org_h = 316, 58
orgs = ["Coop", "Plant", "Buyer", "Origin authority"]
ow = 208
org_centres = []
for i, org in enumerate(orgs):
    x = M + i * (ow + 14)
    box(x, org_y, ow, org_h)
    txt("title", x + 12, org_y + 25, org)
    txt("sub", x + 12, org_y + 44, "counter-signs the head")
    org_centres.append(x + ow // 2)

up_rail = 278
for cx in org_centres:
    line(cx, org_y, cx, up_rail)
line(org_centres[0], up_rail, org_centres[-1], up_rail)
rise = head_x + head_w // 2
line(rise, up_rail, rise, tree_y + tree_h + 6)
tip_up(rise, tree_y + tree_h)

# Footer
txt("small", M, 404,
    "To change anything an endorsed head covers, the operator must publish two histories for the same tree size.")
txt("muted", M, 424,
    "Any two of these organizations see that the moment they compare heads. No consensus network, no token.")

add("</svg>")
OUT.write_text("\n".join(p) + "\n", encoding="utf-8")
print(f"{OUT.name}: {W} x {H}")
