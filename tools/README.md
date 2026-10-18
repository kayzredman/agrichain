# Tools

Scripts that rebuild the generated files in [docs/](../docs). They used to live in `/tmp` and were lost twice. They live here now.

| Script | Rebuilds |
| --- | --- |
| `build-diagrams.py` | The SVGs in `docs/diagrams/`, except the transparency log |
| `build-log-diagram.py` | `docs/diagrams/transparency-log.svg` |
| `build-docx.py` | `docs/agriChain Solution Blueprint.docx` from `docs/blueprint.md` |
| `reference.docx` | Pandoc style reference used by `build-docx.py`. Not generated. Do not delete. |

Run them from anywhere. They resolve paths from their own location.

```sh
python3 tools/build-diagrams.py
python3 tools/build-log-diagram.py
python3 tools/build-docx.py
```

## Things that cost time to learn

**Pandoc must use `--from=markdown`, not `gfm`.** GitHub-flavoured markdown has implicit figures off, which silently drops every figure caption. The images still appear, so the loss is easy to miss. Check by looking for text in the `Image Caption` paragraphs.

**The SVGs are turned into PNGs by headless Chrome**, screenshotted at the exact `viewBox` size with `--force-device-scale-factor=2`. Inside a sandbox Chrome exits 0 and writes nothing, with no error, so this step needs to run unsandboxed.

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=WIDTH,HEIGHT \
  --screenshot=out.png "file:///abs/path/to/in.svg"
```

**zsh does not word-split an unquoted parameter.** Looping over `"name 720 802"` strings and calling `set -- $pair` gives one argument, not three. Write the calls out instead.

## Previewing the mockups

The browser blocks `file://`, so serve the folder:

```sh
cd mockups && python3 -m http.server 8731
```

Then open `http://localhost:8731/index.html`. Any screen is linkable by hash, for example `#dashboard` or `#countersign`.
