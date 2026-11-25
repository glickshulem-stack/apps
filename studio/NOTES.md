# Play Hub Studio — notes

## What it does
Su's private developer edition of Play Hub, on the tablet and on the desktop. Every new app version lands here first. Su tries it, then presses **Publish** to put it in the public Play Hub. Su can also add a ready-made APK, edit app details, or take an app off Play Hub.

- The page is `studio/index.html` (github.io/apps/studio/). The tablet app is in `android/hubstudio/`.
- Studio reads `studio.json`. Publishing changes `catalog.json`.

## Current version
- Studio page: 0.7.0 (`VERSION` in `studio/index.html`, and `"studioPage"` in `studio.json` must match)
- Studio app (APK): 0.3.0 (`android/hubstudio/app/build.gradle`)

## Su's decisions
- Su named it Play Hub Studio. It is private: never shown on the friends page or in the public Play Hub.
- Every app update Claude makes goes only to Studio. Only Su's Publish changes the public Play Hub.
- Tabs: Test bench, Public, + Add app, Settings. Publish with buttons only, no drag.
- Studio itself does not appear in the app lists; its version and update live in Settings.
- Dark looks only (never light, never blue): Ember Sunset (default) and Amethyst Dusk.
- Share Play Hub button in the top bar opens the real Android share sheet with the Play Hub APK.

## Known bugs
- None known.

## To-do
- Su tests the dark looks and the Share button on the tablet.
