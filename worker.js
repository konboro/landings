// tycoon.live is static assets; this Worker runs only for /r/* (assets.run_worker_first in wrangler.jsonc).
// A shared map place https://tycoon.live/r/@<lat>,<lon> (the link the game shares) gets the place page. _redirects cannot
// split it from invite codes: Cloudflare stores a rule like /r/@* as /r/%40*, which never matches a literal @.
// Everything else goes to the assets unchanged (_redirects: /r/* serves the invite page).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    try { path = decodeURIComponent(path); } catch (e) { /* malformed escape: leave it to the invite page */ }
    if (path.startsWith('/r/@')) {
      // The address bar keeps /r/@lat,lon; the page reads the place from it.
      return env.ASSETS.fetch(new Request(new URL('/place/', url), request));
    }
    return env.ASSETS.fetch(request);
  },
};
