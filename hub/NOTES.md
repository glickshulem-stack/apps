# App Vault — notes

## What it does
Su's personal app store. It lists Su's apps from `catalog.json`, installs them and updates them, like the Play Store. Friends can get it from one link: https://glickshulem-stack.github.io/apps/get/

- The page everyone sees is `hub/index.html` (on GitHub Pages). The Android app in `android/hub/` is a shell that shows this page.
- **Edit only `hub-next/index.html`** (the test copy) and raise its `PAGE_VER`. Never edit `hub/index.html`: Su tries the test copy from Studio (App Vault page card › Try, gold "Studio preview" ribbon) and presses Publish, which copies it over `hub/index.html`. Changes to the Android app need a new APK, which also waits for Su to publish it from Studio.

## Current version
- App Vault page: public = `PAGE_VER` in `hub/index.html` (0.21.0); test copy `hub-next/index.html` 0.22.0 (new Tile vault icon) waiting for Su's Publish
- App Vault app (APK): 0.9.0 public; 0.10.0 (new home-screen icon) goes to Studio for Su to publish (`android/hub/app/build.gradle`)

## Su's decisions
- The name is **App Vault** (Su renamed Play Hub → App Vault on 2026-11-25; earlier App Hub, never "Su's Apps"). The catalog id `hub`, the folders, the URLs and the package `com.glickshulem.apphub` stay the same so installed copies keep updating.
- The friends page is staged too: edit `get-next/index.html`, never `get/index.html`. Studio's page Publish copies it over `get/` together with the page.
- Icon = **Tile vault** (Su picked 2026-11-25): gold square vault door with hinges, 2x2 tiles inside, one tile is the dial. File `vault-icon.svg` (repo root), launcher PNG `android/hub/.../mipmap-xxxhdpi/ic_launcher.png`. Old `icon.svg` (grid) is still used by the old root launcher page only.
- Dark "Noir" look with gold is the default; "Ivory" light look is in Settings. No green anywhere.
- Checks GitHub only when Su taps "Check for updates" (or pulls down at the top). Never add automatic checking.
- Settings is a panel that slides in from the side: Check for updates, Look, "See what's new", and the versions of the app and the page shown separately.
- No Featured banner: the page starts with the greeting and the apps (Su removed it in 0.19.0). The catalog field `hero` now only colors the card cover and app-page icon.
- Installs and updates whole apps silently (Android 12+), Play Store style.
- Public App Vault shows only the apps Su published from Studio. If Su takes an app off, App Vault offers to uninstall it.
- The friends page (`get/`) never mentions App Vault Studio.
- Tapping an app card opens its own app page like a real store: icon, name, button, version facts, swipeable screenshots, About this app (`description`), What's new (catalog `news` for that app). Screenshots = optional catalog field `screenshots` (repo image paths, 16:10, kept in `shots/<id>/`, not inside `apps/` so they don't go into APKs). Since 0.17.0.
- No summary pills under the greeting (0.20.0) and no "About" box in Settings (0.18.0).

## Known bugs
- None known.

## To-do
- Su tries page 0.22.0 and app 0.10.0 (Tile vault icon) from Studio, then Publishes.
