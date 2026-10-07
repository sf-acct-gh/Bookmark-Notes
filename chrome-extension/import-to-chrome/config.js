// Edit this to point at your own Bookmark Notes export endpoint, then also
// update `host_permissions` in manifest.json to match this URL's origin.
// See instructions.txt for the full setup steps.
const BOOKMARKS_URL = 'https://opentools.cudacan.com/bookmarknotes/api/export';

// How often the background service worker re-fetches BOOKMARKS_URL, in minutes.
const REFRESH_PERIOD_MINUTES = 360; // 6 hours

// How long to wait for the remote fetch before giving up and keeping the
// existing cached data.
const FETCH_TIMEOUT_MS = 15000;
