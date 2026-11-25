# App Vault Studio — notes

## What it does
Su's private developer edition of App Vault, on the tablet and on the desktop. Every new app version lands here first. Su tries it, then presses **Publish** to put it in the public App Vault. Su can also add a ready-made APK, edit app details, or take an app off App Vault.

- The page is `studio/index.html` (github.io/apps/studio/). The tablet app is in `android/hubstudio/`.
- Studio reads `studio.json`. Publishing changes `catalog.json`.

## Current version
- Studio page: 0.14.0 (`VERSION` in `studio/index.html`; `"studioPage"` in `studio.json` is raised to match only after Pages has deployed it)
- Studio app (APK): 0.5.0 (`android/hubstudio/app/build.gradle`), named App Vault Studio, Golden Gear icon (Su picked 2026-11-25; `studio/icon.svg` + launcher PNG)

## Su's decisions
- Renamed App Vault Studio on 2026-11-25 (was Play Hub Studio). Package `com.glickshulem.hubstudio`, id `hubstudio` and the `studio/` URL stay the same.
- Su named it App Vault Studio. It is private: never shown on the friends page or in the public App Vault.
- Every app update Claude makes goes only to Studio. Only Su's Publish changes the public App Vault.
- Tabs: Apps (Gambit, Quillsong, future apps), App Vault (the App Vault app, the App Vault page, Share App Vault; Su asked 2026-11-25), Public, People, + Add app, Settings. Publish with buttons only, no drag.
- Studio itself does not appear in the app lists; its version and update live in Settings.
- Dark looks only (never light, never blue): Ember Sunset (default) and Amethyst Dusk.
- Share App Vault (Settings and Public tab; Su removed the top-bar button in 0.9.1) opens the real Android share sheet with the App Vault APK.
- App Vault page changes also go through Studio (Su, 2026-11-25). Claude edits `hub-next/index.html`; the "App Vault page" card on the Test bench compares its `PAGE_VER` with `hub/index.html`, Try opens `hub-next/`, Publish copies the file over `hub/index.html` and sets `live` on the hub entry in catalog.json and studio.json.
- Each app's App Vault page shows screenshots and "About this app" (Su, 2026-11-25). Su edits both in Studio › ⋯ › Edit details: add pictures (shrunk to ≤1600 px JPEG, saved as `shots/<id>/<time>-<n>.jpg` on Save), reorder with ‹ ›, remove with ✕, up to 8. They are the `screenshots` list and `description` in studio.json, and go public on Publish.

- **People tab (0.11.0, Su 2026-11-25):** Requests (name, note, device, date) with Approve / Decline; Approved with Remove access; Declined or removed with Approve / Delete (Delete lets them ask again). Badge on the tab counts new requests. Su signs in once per device with the Firebase email + password (Settings shows it, with Sign out). See `hub/NOTES.md` for how it works.

- **Who has what (0.13.0):** People › Approved starts with a summary (each app: how many people have it, how many are behind the public version), and each person shows chips like "Gambit 0.28.1" ("behind" in red when older than public) plus when they last opened App Vault.

- **Reports tab (0.14.0):** notes from App Vault app pages: app, version, who, device, date, text, photos (tap to enlarge). Filters New / Done / All / per app; Mark as done / Mark as new; Delete (with its photos). Badge counts new notes. Needs the People sign-in.

## Known bugs
- Fixed in 0.9.2: a cached old Studio page could reload itself forever ("Loading apps" blinking). It now reloads once per version with a fresh address, then shows the apps with publishing paused until the new page arrives.

## To-do
- Su tries screenshots + About in Edit, then Publish.
- Su tests the dark looks and the Share button on the tablet.
