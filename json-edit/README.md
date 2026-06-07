# JSON Editor — `lang.json` admin tool

A standalone, local-only bilingual editor for `ot265/lang.json`. Two columns (or tabs) of EN/TH text, dark mode, search, diff-before-save, automatic backups. Self-hosted assets, no CDN, no auth (local dev only).

---

## Quick start

```bash
# From the project root:
php -S 0.0.0.0:8000 router.php
# Then open:
http://localhost:8000/json-edit/
```

That's it. The editor fetches `../ot265/lang.json` directly, posts changes to `php/save.php`, and writes back to the same file with 2-space indentation, UTF-8 unescaped (Thai stays readable).

> The trailing slash matters — relative paths (`css/style.css`, `js/app.js`, `../ot265/lang.json`) only resolve when the URL ends in `/json-edit/`. `router.php` handles the redirect in dev; real web servers (Apache/nginx) do it automatically.

---

## File map

```
json-edit/
├── README.md              ← this document
├── index.html             ← single-page editor UI (Alpine + Tailwind)
├── css/
│   ├── input.css          ← Tailwind 4 source (edit this)
│   └── style.css          ← compiled output (regenerate after edits — see below)
├── js/
│   ├── app.js             ← Alpine store: data, dirty tracking, save, backups, search
│   └── alpine.min.js      ← Alpine.js 3 (copied from ot265/)
└── php/
    ├── save.php           ← POST endpoint: validates, backs up, atomically writes
    └── backups/           ← last 30 backups, filename: lang-YYYY-MM-DD_HHMMSS.json
```

The editor reads from and writes to `../ot265/lang.json`. Nothing else outside `json-edit/` is touched (except backups, written under `json-edit/php/backups/`).

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| CSS | **Tailwind 4** (compiled to `style.css`) | New CSS-first config, class-based dark mode, ~44 KB minified |
| Reactivity | **Alpine.js 3** (self-hosted) | Already in the project, no build step, fits a single-file tool |
| Server | **PHP** (built-in dev server or Apache) | Matches the rest of the project; no Composer / no Node runtime |
| Persistence | Direct file write to `ot265/lang.json` | Source of truth lives where the listing reads it from |

No external CDN. No npm runtime dependency. Tailwind is only needed at build time (`npx`).

---

## Features

### Editing
- **EN/TH tabs** by default — switch the active language with one click.
- **Split view** toggle (desktop only) — show both languages side-by-side for direct comparison.
- **Auto-grow textareas** via CSS `field-sizing: content`; no JS resize logic.
- **Cross-language hint** in tab view — the inactive language's text appears faded under the field as a reference.
- **Per-row dirty indicator** — modified rows get an amber border and dot.
- **Char count** under every field.

### Navigation
- **Sidebar** with one entry per section (Hero, Pills, Overview, Gallery, Details, etc.), auto-grouped by key prefix. Click jumps to the section.
- **Section badges** — show field count + count of unsaved changes.
- **Collapse/expand** any section.
- **Global search (⌘K / Ctrl+K)** — filters keys, EN values, and TH values; shows match count.
- **Mobile sidebar** — hamburger menu, overlay backdrop, closes on selection.

### Quality checks
- **Parity warnings** — flags a row if:
  - One language is empty while the other has content (`EN empty` / `TH empty`)
  - One language is more than 2.2× the length of the other and both > 60 chars (`Length differs`)
- **Dirty counts** propagated everywhere — header, sidebar, section headers, tab badges, save button.

### Safety
- **Diff modal before save** — every change shown as before → after; must click "Save to lang.json" to commit.
- **Server-side backup** before every write, into `php/backups/lang-YYYY-MM-DD_HHMMSS.json`.
- **Last 30 backups** kept; older ones pruned automatically.
- **Atomic write** — writes to `lang.json.tmp`, then renames over the target.
- **Auto-save draft** to `localStorage` (debounced 400 ms) — refresh-proof. On reload, the editor offers to restore the draft if it still differs from the file.
- **beforeunload guard** — browser warns if you try to close the tab with unsaved changes.
- **Validation** — server rejects payloads where EN and TH key sets don't match, or where any value isn't a string.

### Restore
- **Backups modal** — lists all backups (newest first) with timestamp + size; one-click restore.
- Restoring also backs up the current file first, so restores are themselves reversible.

### Other utilities
- **Discard changes** — reverts in-memory edits to the last saved state.
- **Download JSON** — exports the current in-memory state as a `lang.json` download.
- **Dark mode toggle** — persisted to `localStorage`, defaults to system preference on first visit.
- **Last-saved timestamp** in the header after each successful save.
- **Toast notifications** — success / error / info, auto-dismiss after 3.2 s.

### Keyboard shortcuts
| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Focus search |
| `⌘S` / `Ctrl+S` | Open diff modal (review before saving) |
| `Esc` | Close any open modal |

---

## How it works

### Loading
On `init()`, `app.js`:
1. Applies dark mode (stored override → system preference).
2. Restores view mode (`tabs` / `split`) and active language from `localStorage`.
3. Fetches `../ot265/lang.json?t=<cache-buster>`.
4. Keeps two copies in memory: `data` (editable) and `original` (baseline for dirty detection).
5. Walks `Object.keys(data.en)` in source order and groups them into sections by prefix (`hero_`, `overview_`, `details_`, etc.) using a static `SECTION_NAMES` map. Unknown prefixes fall under "Other".
6. Checks `localStorage` for an unsaved draft; if it differs from the loaded file, prompts to restore.
7. Wires keyboard shortcuts and the `beforeunload` warning.
8. Starts a debounced effect that re-serializes `data` to localStorage whenever it changes.

### Dirty detection
Every field comparison is `data[lang][key] !== original[lang][key]`. The `dirtyCount()` / `sectionDirtyCount()` / `rowDirty()` helpers are derived; nothing is cached. This keeps the model trivial and means undoing an edit cleanly re-marks the field as clean.

### Saving
1. Click Save (or `⌘S`) → opens diff modal listing every changed `(key, lang)` pair with before/after.
2. Confirm → `POST php/save.php` with the entire `{en, th}` payload as JSON.
3. Server validates structure, makes a timestamped backup of the current file, writes the new file atomically (`tmp → rename`), and prunes old backups beyond 30.
4. On 2xx: `original` is replaced with a deep clone of `data` (dirty counts go to zero), the draft is removed from localStorage, last-saved timestamp updates, toast shown.
5. On error: payload stays in memory, toast surfaces the error message.

### Restoring a backup
`POST php/save.php` with `{ "restore": "lang-2026-05-24_142643.json" }`. Server validates the filename pattern, backs up the current `lang.json`, copies the backup over, and the client reloads.

### Format preservation
PHP's `JSON_PRETTY_PRINT` uses 4-space indent, but the project file is 2-space. `save.php` halves leading indentation after `json_encode` to keep the diff clean for git/tracking.

---

## Editing the editor

### Adding a new section grouping
Edit `SECTION_NAMES` at the top of [`js/app.js`](js/app.js). Keys are prefixes (the part before the first `_`), values are display names. Any prefix not in the map falls under "Other".

### Changing the accent color
Replace `amber` with another Tailwind color in [`index.html`](index.html) (and `:focus`, `:ring`, badge backgrounds). Then recompile CSS.

### Recompiling Tailwind
Only needed when you change HTML, `app.js`, or `input.css`:

```bash
# From the project root (tailwindcss installed locally via `npm install --no-save tailwindcss@4 @tailwindcss/cli@4`):
npx @tailwindcss/cli -i json-edit/css/input.css -o json-edit/css/style.css --minify
```

Tailwind 4's `@source` directives in `input.css` already point at `../index.html` and `../js/app.js`, so the JIT picks up any new utility classes automatically.

### Bumping the cache-buster
Browsers may cache `style.css` / `app.js` / `alpine.min.js`. There's no `?v=N` on these tags currently — if you find you need it, add it in `index.html` after edits. For a personal tool a hard refresh is usually enough.

---

## Server API

### `GET php/save.php?list=1`
Returns the backup list, newest first, capped at 50.
```json
{ "backups": [ { "name": "lang-2026-05-24_142643.json", "size": 20827, "mtime": 1779625603 }, … ] }
```

### `POST php/save.php` (save)
Body: the full `{ "en": {…}, "th": {…} }` object.
- **422** if `en` / `th` keys missing, key sets diverge, or a value isn't a string.
- **200** on success: `{ "ok": true, "savedAt": "2026-05-24T14:26:43+02:00", "bytes": 21379 }`.

### `POST php/save.php` (restore)
Body: `{ "restore": "lang-YYYY-MM-DD_HHMMSS.json" }` — filename must match the exact backup name pattern.
- **400** invalid filename pattern.
- **404** backup not found.
- **200** `{ "ok": true, "restored": "lang-…json" }`. The current file is backed up before the restore.

---

## Design choices worth noting

- **No build step at runtime.** Tailwind is compiled ahead of time; PHP serves the static files plus one endpoint.
- **Source-order sections.** Section order in the sidebar follows the order keys appear in `lang.json` (the first occurrence of each prefix). Reorder keys in the file → sidebar updates after reload.
- **No translation API.** Could be added later (DeepL, Google, GPT) but kept out for now — "no CDN, all local" rules it out, and the editor is for review/refinement, not bulk translation.
- **No undo stack beyond the last save.** The backup list is the undo history; in-memory edits are tracked vs `original` only.
- **Single-user.** No concurrent-edit detection — if two browsers edit at once, last save wins. Fine for a personal admin tool.
- **No auth.** Local-only by design. If this ever ships behind a public URL, gate `save.php` behind Apache Basic Auth or an `EDITOR_PASS` header check before exposing it.

---

## Not implemented (deliberately)

- Auto-translate / suggest translation
- Adding or deleting keys (only edits existing values)
- Reordering keys
- Git commit on save
- Multi-file support (only `ot265/lang.json`)
- Field type metadata (max length, character set, etc.)

Each of these is doable but would push the tool past "edit existing copy" into "general-purpose i18n CMS" — different scope.

---

## Troubleshooting

**"Loading lang.json..." never goes away.**
The editor must be served over HTTP, not `file://`. Run `php -S` from the project root and visit `/json-edit/`.

**Edits don't persist on save.**
Check `json-edit/php/backups/` is writable by the PHP user (`www-data` on Apache, your user on `php -S`). Check `ot265/lang.json` is writable. Open browser devtools → Network → look at the `save.php` response body for the exact error.

**Thai shows as `บ้...` in the saved file.**
Shouldn't happen — `save.php` uses `JSON_UNESCAPED_UNICODE`. If you see this, you're probably looking at a backup made before this fix or you've replaced `save.php`.

**Tailwind classes don't apply after editing the HTML.**
Recompile (`npx @tailwindcss/cli …`). Tailwind 4 only generates utility classes it sees in the source files listed via `@source` in `input.css`.

**`npm install` left a `node_modules/` at the project root.**
That's expected — Tailwind 4's CLI needs to resolve its own package. The repo's `.dockerignore` and `.gitignore` exclude it, so it won't ship or be committed.
