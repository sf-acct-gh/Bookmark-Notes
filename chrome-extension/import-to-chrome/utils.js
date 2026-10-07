// Loaded via a plain <script> tag in popup.html, not a module — there's no
// bundler in this extension.

// Only ever treat plain http(s) URLs as clickable/navigable. Bookmark data
// comes from a remote, untrusted JSON file, so this is a defense-in-depth
// check against something like a crafted `javascript:` URL ending up in it.
function isSafeUrl(url) {
	if (typeof url !== 'string') return false;
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

function formatTimestamp(ms) {
	if (typeof ms !== 'number' || !Number.isFinite(ms)) return 'never';
	return new Date(ms).toLocaleString();
}
