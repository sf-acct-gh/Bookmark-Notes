# Changelog

## Unreleased

### Fixed

- All internal API calls and links (`fetch`, `EventSource`, backup download
  links) now use relative paths instead of hardcoded root-absolute paths.
  This lets the app be reverse-proxied under a URL prefix (e.g.
  `/bookmarknotes`) without any extra configuration, while standalone
  root-mounted deployments (e.g. plain `docker compose up`) continue to
  work exactly as before.
