# Play Hub Studio — notes

## What it does
Su's private developer edition of Play Hub, on the tablet and on the desktop. Every new app version lands here first. Su tries it, then presses **Publish** to put it in the public Play Hub. Su can also add a ready-made APK, edit app details, or take an app off Play Hub.

- The page is `studio/index.html` (github.io/apps/studio/). The tablet app is in `android/hubstudio/`.
- Studio reads `studio.json`. Publishing changes `catalog.json`.

## Current version
- Studio page: 0.9.2 (`VERSION` in `studio/index.html`, and `"studioPage"` in `studio.json` must match)
- Studio app (APK): 0.3.0 (`android/hubstudio/app/build.gradle`)

## Su's decisions
- Su named it Play Hub Studio. It is private: never shown on the friends page or in the public Play Hub.
- Every app update Claude makes goes only to Studio. Only Su's Publish changes the public Play Hub.
- Tabs: Test bench, Public, + Add app, Settings. Publish with buttons only, no drag.
- Studio itself does not appear in the app lists; its version and update live in Settings.
- Dark looks only (never light, never blue): Ember Sunset (default) and Amethyst Dusk.
- Share Play Hub (Settings and Public tab; Su removed the top-bar button in 0.9.1) opens the real Android share sheet with the Play Hub APK.
- Play Hub page changes also go through Studio (Su, 2026-11-25). Claude edits `hub-next/index.html`; the "Play Hub page" card on the Test bench compares its `PAGE_VER` with `hub/index.html`, Try opens `hub-next/`, Publish copies the file over `hub/index.html` and sets `live` on the hub entry in catalog.json and studio.json.
- Each app's Play Hub page shows screenshots and "About this app" (Su, 2026-11-25). Su edits both in Studio › ⋯ › Edit details: add pictures (shrunk to ≤1600 px JPEG, saved as `shots/<id>/<time>-<n>.jpg` on Save), reorder with ‹ ›, remove with ✕, up to 8. They are the `screenshots` list and `description` in studio.json, and go public on Publish.

## Known bugs
- Fixed in 0.9.2: a cached old Studio page could reload itself forever ("Loading apps" blinking). It now reloads once per version with a fresh address, then shows the apps with publishing paused until the new page arrives.

## To-do
- Su tries screenshots + About in Edit, then Publish.
- Su tests the dark looks and the Share button on the tablet.
