// tycoon.live is static assets; this Worker runs first for /r/* (assets.run_worker_first in wrangler.jsonc) and, for any
// other path, only when no asset matches it.
// A shared map place https://tycoon.live/r/@<lat>,<lon> (the link the game shares) gets the place page. _redirects cannot
// split it from invite codes: Cloudflare stores a rule like /r/@* as /r/%40*, which never matches a literal @.
// Everything else goes to the assets unchanged (_redirects: /r/* serves the invite page), except a missing image below.

// _headers caches images under these folders for a year (immutable). Its rule also lands on the 404 for a file that is not
// there (yet), so a phone would remember the missing image for a year; that 404 must not be cached at all.
const IMMUTABLE_DIRS = ['/cards/', '/stadiums/'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    try { path = decodeURIComponent(path); } catch (e) { /* malformed escape: leave it to the invite page */ }
    if (path.startsWith('/r/@')) {
      // The address bar keeps /r/@lat,lon; the page reads the place from it.
      return env.ASSETS.fetch(new Request(new URL('/place/', url), request));
    }
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && IMMUTABLE_DIRS.some((d) => path.startsWith(d))) {
      const out = new Response(res.body, res);
      out.headers.set('Cache-Control', 'no-store');
      return out;
    }
    return res;
  },
};
