# Su's Apps

An installable web app hub (PWA). Open the GitHub Pages link on a phone or tablet and choose "Add to Home screen" / "Install". It updates itself on every push.

## Apps
- Chess (`apps/chess/`)

## Releasing a change
1. Bump the app's `VERSION` (semantic versioning) and its entry in `apps.js`.
2. Bump `HUB_VERSION` in `apps.js` and `CACHE_VERSION` in `sw.js`.
3. Push to `main`.
