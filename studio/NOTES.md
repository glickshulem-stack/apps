# App Vault Studio — notes

## What it does
Su's private developer edition of App Vault, on the tablet and on the desktop. Every new app version lands here first. Su tries it, then presses **Publish** to put it in the public App Vault. Su can also add a ready-made APK, edit app details, or take an app off App Vault.

- The page is `studio/index.html` (github.io/apps/studio/). The tablet app is in `android/hubstudio/`.
- Studio reads `studio.json`. Publishing changes `catalog.json`.

## Current version
- Studio page: 0.18.0 (`VERSION` in `studio/index.html`; `"studioPage"` in `studio.json` is raised to match only after Pages has deployed it)
- Studio app (APK): 0.5.0 (`android/hubstudio/app/build.gradle`), named App Vault Studio, Golden Gear icon (Su picked 2026-11-25; `studio/icon.svg` + launcher PNG)

## Su's decisions
- Renamed App Vault Studio on 2026-11-25 (was Play Hub Studio). Package `com.glickshulem.hubstudio`, id `hubstudio` and the `studio/` URL stay the same.
- Su named it App Vault Studio. It is private: never shown on the friends page or in the public App Vault.
- Every app update Claude makes goes only to Studio. Only Su's Publish changes the public App Vault.
- Tabs (tidy-up 0.18.0, Su 2026-11-25): Apps (with a **+ Add app** button), App Vault (the App Vault app and page), People, Messages, Settings. No Public tab. **↗ Share App Vault** is one small button in the top bar (no other copies). Publish with buttons only, no drag.
- Studio itself does not appear in the app lists; its version and update live in Settings.
- One flat look, Navy & Gold, shared with App Vault (Su picked 2026-11-25, replaces Ember Sunset / Amethyst Dusk; no Look choice in Settings, no gradients): exact App Vault values: bg #0f1626, cards #172136, inputs #1f2b43, lines #2a3753, text #f1f3f8, muted #a8b2c7, gold #d4a64a/#e2bc6a/#f3d58f, gold buttons #f6dc9c→#c9993f with #2a1d10 text.
- Share App Vault (small top-bar button since 0.18.0) opens the real Android share sheet with the App Vault APK.
- App Vault page changes also go through Studio (Su, 2026-11-25). Claude edits `hub-next/index.html`; the "App Vault page" card on the Test bench compares its `PAGE_VER` with `hub/index.html`, Try opens `hub-next/`, Publish copies the file over `hub/index.html` and sets `live` on the hub entry in catalog.json and studio.json.
- Each app's App Vault page shows screenshots and "About this app" (Su, 2026-11-25). Su edits both in Studio › ⋯ › Edit details: add pictures (shrunk to ≤1600 px JPEG, saved as `shots/<id>/<time>-<n>.jpg` on Save), reorder with ‹ ›, remove with ✕, up to 8. They are the `screenshots` list and `description` in studio.json, and go public on Publish.

- **People tab (0.11.0, Su 2026-11-25):** Requests (name, note, device, date) with Approve / Decline; Approved with Remove access; Declined or removed with Approve / Delete (Delete lets them ask again). Badge on the tab counts new requests. Su signs in once per device with the Firebase email + password (Settings shows it, with Sign out). See `hub/NOTES.md` for how it works.

- **People rows (0.18.0):** Requests on top with Approve / Decline. Approved people are short rows: name, when they last opened App Vault, small icons of the apps they have (no versions, Su's choice), and 💬 to open their chat. Tap a row for device, note and Remove access. Removed and declined people hide behind **Show removed**.

- **Messages tab (inbox since 0.18.0):** ONE chat per person, like texting (all of a person's reports merged by uid, oldest first). List on the left (newest on top, gold dot = waiting for your reply), chat on the right; on narrow screens the list opens the chat with a ‹ back button. Header: Person info (jumps to People) and ⋯ (Mark as answered, Delete the whole chat). Composer: + (Add photo / Take photo / Add file), text, Send (Enter sends on desktop). Su's messages go into the person's latest report: `{from:'su', text, created}` plus `photo` (JPEG data URL ≤ ~850 KB) or `file {name,type,data}` (≤ 700 KB). Ticks: ✓ Sent, ✓✓ Read (report `userUnread` false). Photos small, tap to enlarge. Badge = people waiting. Needs the People sign-in.

## Known bugs
- Fixed in 0.9.2: a cached old Studio page could reload itself forever ("Loading apps" blinking). It now reloads once per version with a fresh address, then shows the apps with publishing paused until the new page arrives.

## To-do
- Su tries screenshots + About in Edit, then Publish.
- Su tests the dark looks and the Share button on the tablet.
