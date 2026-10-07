# Bookmark Notes

A lightweight, self-hosted bookmark manager. Bookmarks are grouped into
sections (like folders). No database — everything is stored in a single
JSON file on disk, so it's easy to back up or share between people running
their own instance.

## Running with Docker (recommended)

```bash
docker compose up --build -d
```

This builds the app and bind-mounts `./data` into the container so your
bookmarks persist outside of it. `data/bookmarks.json` is gitignored —
only `data/bookmarks.example.json` is committed as a template.

To update to the latest version later, just pull and rebuild:

```bash
git pull
docker compose up --build -d
```

By default the app serves from the root (`/`) on port 3000. To serve it
under a URL subpath instead (e.g. alongside another app behind the same
reverse proxy), see the `APP_BASE` build-arg documented directly in
`docker-compose.yml`.

## Running locally (alternative to Docker)

```bash
npm install
npm run dev -- --open
```

By default, data is stored at `data/bookmarks.json`, which is created
automatically on first run. Override the location with the
`BOOKMARK_DATA_FILE` environment variable.

### Production build without Docker

```bash
npm run build
node build
```

## Chrome extension

A read-only Chrome extension lets you browse your workspaces, sections,
and bookmarks from the toolbar and jump to one with a click. It never
writes anything back — all editing still happens in the web UI above.

The extension's source lives in `chrome-extension/import-to-chrome/`.
Before loading it into Chrome, point it at your own instance:

1. Open `import-to-chrome/config.js` and set `BOOKMARKS_URL` to your own
   export URL — the same one you'd use to download a backup, e.g.
   `https://your-domain.example/api/export`.
2. Open `import-to-chrome/manifest.json` and update the
   `host_permissions` entry to match that URL's domain.

Then install it:

1. Go to `chrome://extensions` in Chrome.
2. Turn on "Developer mode".
3. Click "Load unpacked" and select the `import-to-chrome` folder.

See `chrome-extension/instructions.txt` for the full walkthrough, including
how to package it into a zip for moving to another machine.
