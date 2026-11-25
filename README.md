# App Vault

Su's personal app store. **App Vault** (`hub/`, Android shell in `android/hub/`) is what users see; it lists what is in `catalog.json`.
**App Vault Studio** (`studio/`, Android shell in `android/hubstudio/`) is Su's developer edition; it lists what is in `studio.json`.

## Releasing a change (the Studio rule)
New versions go to **Studio only**. Su tries them in Studio on the tablet and presses **Publish**, which is the only thing that changes `catalog.json`.

1. Make the change and bump the app's version (for Gambit: `const VERSION` in `apps/chess/chess.js`).
2. Merge to `main`. The *Build APKs* workflow releases `<id>-v<version>` with `<id>.apk`.
3. Once that release exists, set the app's `version` in **`studio.json`** (and its `"note"`: one line of what's new, shown in App Vault's What's new when Su publishes).
4. Do **not** edit `catalog.json` by hand. This includes App Vault itself (`hub`): its APK updates also wait for Su to publish them. The **App Vault page** too: edit only `hub-next/index.html` (the test copy, with a "Studio preview" ribbon) and raise its `PAGE_VER`. Never edit `hub/index.html` (or `get/index.html`; its test copy is `get-next/index.html`): Studio's App Vault page card shows In Studio vs Public, and Su's Publish copies `hub-next/index.html` over `hub/index.html` and sets `live` on the `hub` entry.

When you change the Studio page (`studio/index.html`), raise its `VERSION` and merge. Wait until the *pages build and deployment* run for that commit has finished, then set `"studioPage"` in `studio.json` to match in a second PR, so open or cached copies of Studio reload themselves into the new page before they can change App Vault. (Raising it before Pages serves the new page made cached copies reload over and over.)

Ready-made APKs (like Quillsong) are dropped into Studio, which uploads them to an `upload/...` branch; the *Publish uploaded APK* workflow makes the release and adds the version to `studio.json`.

## Notes
`PROJECTS.md` is the master list of every app. Each app folder has a `NOTES.md`; read it before working on that app and update it when you finish.
