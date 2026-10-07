#!/bin/sh
# Packages the workspace-bookmarks/ folder into a zip you can move to another
# machine. This does NOT install the extension — see instructions.txt for
# that (Chrome always installs from the unzipped folder, never the zip
# directly).
set -e
cd "$(dirname "$0")"
rm -f workspace-bookmarks.zip
# Zipped from here (not from inside workspace-bookmarks/) so the archive
# contains a top-level workspace-bookmarks/ folder, matching what
# instructions.txt tells you to look for after unzipping.
zip -r workspace-bookmarks.zip workspace-bookmarks
echo "Created $(pwd)/workspace-bookmarks.zip"
