# Bookmark Notes

A lightweight, self-hosted bookmark manager. Bookmarks are grouped into
sections (like folders). No database — everything is stored in a single
JSON file on disk, so it's easy to back up or share between people running
their own instance.

## Running locally

```bash
npm install
npm run dev -- --open
```

By default, data is stored at `data/bookmarks.json`, which is created
automatically on first run. Override the location with the
`BOOKMARK_DATA_FILE` environment variable.

## Production build

```bash
npm run build
node build
```

## Docker

```bash
docker compose up --build
```

This builds the app and bind-mounts `./data` into the container so your
bookmarks persist outside of it. `data/bookmarks.json` is gitignored —
only `data/bookmarks.example.json` is committed as a template.
