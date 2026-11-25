# Play Hub — notes

## What it does
Su's personal app store. It lists Su's apps from `catalog.json`, installs them and updates them, like the Play Store. Friends can get it from one link: https://glickshulem-stack.github.io/apps/get/

- The page everyone sees is `hub/index.html` (on GitHub Pages). The Android app in `android/hub/` is a shell that shows this page.
- **Edit only `hub-next/index.html`** (the test copy) and raise its `PAGE_VER`. Never edit `hub/index.html`: Su tries the test copy from Studio (Play Hub page card › Try, gold "Studio preview" ribbon) and presses Publish, which copies it over `hub/index.html` (Su's rule, 2026-11-25: every change goes to Studio first). Changes to the Android app need a new APK, which also waits for Su to publish it from Studio.

## Current version
- Play Hub page: 0.19.0 public (`PAGE_VER` in `hub/index.html`); test copy `hub-next/index.html`
- Play Hub app (APK): 0.8.0 (`android/hub/app/build.gradle`); in Studio, waiting for Su to publish

## Su's decisions
- The name is **Play Hub** (not App Hub, not "Su's Apps"). The catalog id stays `hub`.
- Dark "Noir" look with gold is the default; "Ivory" light look is in Settings. No green anywhere.
- Checks GitHub only when Su taps "Check for updates" (or pulls down at the top). Never add automatic checking.
- Settings is a panel that slides in from the side: Check for updates, Look, "See what's new", and the versions of the app and the page shown separately.
- No Featured banner: the page starts with the greeting and the apps (Su removed it in 0.19.0). The catalog field `hero` now only colors the card cover and app-page icon.
- Installs and updates whole apps silently (Android 12+), Play Store style.
- Public Play Hub shows only the apps Su published from Studio. If Su takes an app off, Play Hub offers to uninstall it.
- The friends page (`get/`) never mentions Play Hub Studio.
- Tapping an app card opens its own app page like a real store: icon, name, button, version facts, swipeable screenshots, About this app (`description`), What's new (catalog `news` for that app). Screenshots = optional catalog field `screenshots` (repo image paths, 16:10, kept in `shots/<id>/`, not inside `apps/` so they don't go into APKs). Since 0.17.0.
- No "About" box in Settings (removed in 0.18.0, Su's wish).

## Known bugs
- None known.

## To-do
- Su publishes app 0.8.0 from Studio and tests the "app was removed" card.
- Su presses Publish in Studio so the Gambit and Quillsong screenshots (in studio.json) reach Play Hub. Su can also edit them in Studio › ⋯ › Edit details (Studio 0.8.0).
