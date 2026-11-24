# Play Hub

Su's personal app store. **Play Hub** (`hub/`, Android shell in `android/hub/`) is what users see; it lists what is in `catalog.json`.
**Play Hub Studio** (`studio/`, Android shell in `android/hubstudio/`) is Su's developer edition; it lists what is in `studio.json`.

## Releasing a change (the Studio rule)
New versions go to **Studio only**. Su tries them in Studio on the tablet and presses **Publish**, which is the only thing that changes `catalog.json`.

1. Make the change and bump the app's version (for Gambit: `const VERSION` in `apps/chess/chess.js`).
2. Merge to `main`. The *Build APKs* workflow releases `<id>-v<version>` with `<id>.apk`.
3. Once that release exists, set the app's `version` in **`studio.json`** (and its `"note"`: one line of what's new, shown in Play Hub's What's new when Su publishes).
4. Do **not** edit `catalog.json` by hand.

Ready-made APKs (like Quillsong) are dropped into Studio, which uploads them to an `upload/...` branch; the *Publish uploaded APK* workflow makes the release and adds the version to `studio.json`.
