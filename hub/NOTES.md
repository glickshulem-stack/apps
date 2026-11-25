# App Vault — notes

## What it does
Su's personal app store. It lists Su's apps from `catalog.json`, installs them and updates them, like the Play Store. Friends can get it from one link: https://glickshulem-stack.github.io/apps/get/

- The page everyone sees is `hub/index.html` (on GitHub Pages). The Android app in `android/hub/` is a shell that shows this page.
- **Edit only `hub-next/index.html`** (the test copy) and raise its `PAGE_VER`. Never edit `hub/index.html`: Su tries the test copy from Studio (App Vault page card › Try, gold "Studio preview" ribbon) and presses Publish, which copies it over `hub/index.html`. Changes to the Android app need a new APK, which also waits for Su to publish it from Studio.

## Current version
- App Vault page: public = `PAGE_VER` in `hub/index.html` (0.32.0); test copy `hub-next/index.html` 0.34.0 (picked photos/files wait in a tray with ✕ and Cancel until Send; 0.33.0: one chat per person with + button for photo/camera/file, on top of 0.32.0 Navy & Gold) waiting for Su's Publish
- App Vault app (APK): 0.12.0 (bridge 6: chat picker can take a photo with the camera or pick any file; 0.11.0 = photo picker, bridge 5) (`android/hub/app/build.gradle`)

## Su's decisions
- The name is **App Vault** (Su renamed Play Hub → App Vault on 2026-11-25; earlier App Hub, never "Su's Apps"). The catalog id `hub`, the folders, the URLs and the package `com.glickshulem.apphub` stay the same so installed copies keep updating.
- The friends page is staged too: edit `get-next/index.html`, never `get/index.html`. Studio's page Publish copies it over `get/` together with the page.
- Icon = **Tile vault** (Su picked 2026-11-25): gold square vault door with hinges, 2x2 tiles inside, one tile is the dial. File `vault-icon.svg` (repo root), launcher PNG `android/hub/.../mipmap-xxxhdpi/ic_launcher.png`. Old `icon.svg` (grid) is still used by the old root launcher page only.
- ONE look only (Su, page 0.32.0, replaces the 8 looks of 0.26-0.31): **Navy & Gold**, flat, no gradients, no color picker in Settings. Colors: bg #0f1626, surface #172136, surface2 #1f2b43, line #2a3753, text #f1f3f8, muted #a8b2c7, gold #d4a64a, gold2 #e2bc6a, goldhi #f3d58f, app cover #1b2740. App Vault Studio uses the same colors. No green anywhere.
- Checks GitHub only when Su taps "Check for updates" (or pulls down at the top). Never add automatic checking.
- Settings is a panel that slides in from the side, in four sections (Su, page 0.28.0): **Account** (name, Approved, device; only when approved), **Updates** (Check for updates, then App Vault app + page versions), **Share** (Share App Vault: uses Hub.share if the APK ever has it, else the browser share menu, else copies https://glickshulem-stack.github.io/apps/get/ and toasts "Link copied"; the App Vault APK has no share bridge yet).
- No Featured banner: the page starts with the greeting and the apps (Su removed it in 0.19.0). The catalog field `hero` now only colors the card cover and app-page icon.
- Installs and updates whole apps silently (Android 12+), Play Store style.
- Public App Vault shows only the apps Su published from Studio. If Su takes an app off, App Vault offers to uninstall it.
- The friends page (`get/`) never mentions App Vault Studio.
- Tapping an app card opens its own app page like a real store: icon, name, button, version facts, swipeable screenshots, About this app (`description`), What's new (catalog `news` for that app). Screenshots = optional catalog field `screenshots` (repo image paths, 16:10, kept in `shots/<id>/`, not inside `apps/` so they don't go into APKs). Since 0.17.0.
- No "See what's new" button/list in Settings (Su removed it in 0.24.0). What's new now shows only on each app's page.
- No summary pills under the greeting (0.20.0) and no "About" box in Settings (0.18.0).

- **Sign-in + approval (page 0.23.0, Su 2026-11-25):** everyone types a name (+ optional note) once; the device model is read from the browser. They see "Waiting for approval" until Su approves them in Studio › People. Declined / removed people see a short message. Approved people open App Vault right away, even offline (status saved as `vaultMember`). Backend: Firebase project `app-vault-962b9` (Su's Google account): anonymous sign-in per device + Firestore `members/{uid}` = {name, note, device, status pending|approved|declined|removed, created, decided}. Security rules (pasted by Su in the Firebase console, admin = Su's email + password sign-in) let people write only their own pending request. The web config in the page is public on purpose. Note: approval only hides the Vault; app files are still on public GitHub.
- **Who has what (page 0.25.0):** approved people's App Vault writes `apps` {id: installed version} (catalog apps + App Vault itself, Android only), `page` and `seen` to their member doc when App Vault opens or comes back, after a check and after an install; only when changed or once a day (`vaultReported`). Rules let a person change only those 3 fields.
- **Contact the developer (page 0.30.0, chat since 0.31.0; Su: ONE general support, NOT per app, NO app tags since Su plans 10-15 apps):** Settings › Support › Contact the developer: new message (≤2000 chars, up to 4 photos) + "Your messages". Tapping one opens the conversation (bubbles, Developer replies in gold) with a reply box. "New reply" badge on the Support row + gold dot on the gear when Su replied (`userUnread`). Firestore: `reports/{id}` (status new|replied|done, lastAt, userUnread) + `photos/0..3` (shrunk JPEG in Firestore, Storage needs Blaze) + `msgs/{m}` {from su|user, text}. Photo picker in the Android app needs App Vault app 0.11.0. Video: not yet.
- **One chat (page 0.33.0, Su 2026-11-25: "like a text message, all the chats we've ever had"):** Contact the developer opens ONE chat: every report of this person + every msg, merged and sorted by time, with day separators. The composer writes into the newest report (or starts the first one). **+ button:** Add photo (bridge 5+), Take photo + Add file (bridge 6 = APK 0.12.0; older APKs see "update App Vault"). Photos are shrunk JPEG ≤850k chars in `msgs.photo`, files ≤700 KB as `msgs.file {name,type,data}` (data URL); text is '📷 Photo' / '📎 name' (same format as Studio 0.18.0). Tap a photo to enlarge. **Since 0.34.0 nothing sends on pick (Su):** picked items (max 4) wait in a tray above the box (`rp.draft`, ✕ each + Cancel) and go out when ➤ is tapped. Rules: `okAttach()` in firebase/firestore.rules lets both sides add photo/file.
- Next step Su asked for: publish to chosen people (Everyone or ticked names).

## Known bugs
- None known.

## To-do
- Su tries page 0.22.0 and app 0.10.0 (Tile vault icon) from Studio, then Publishes.
