# Projects

The master list of Su's apps. Update this file every time a task finishes.
Each app folder has a `NOTES.md` with more detail. Read it before starting work on that app.

| App | Folder | Current version | Status | Next to-do |
|---|---|---|---|---|
| Play Hub Studio | `studio/` (page) + `android/hubstudio/` (app) | page 0.9.2, app 0.3.0 | testing | Su tries the Play Hub page card (Try / Publish), screenshots in Edit, and Share on the tablet |
| Play Hub | `hub/` (page) + `android/hub/` (app) | page 0.19.0 (0.20.0 in Studio), app 0.8.0 | testing | Su publishes from Studio (app 0.8.0 + screenshots) and tests app pages |
| Gambit (chess) | `apps/chess/` + `android/chess/` | 0.27.0 (in Studio and public) | in progress | Puzzles (0.11 step of the plan), then stats and saved games, then 1.0 |
| Quillsong | `apps/quillsong/` (icon only, source kept outside the repo) | 1.9.0 | testing | Su tests the Gentle voice power setting |
| Play Hub for Windows | `hub/` installed from Edge/Chrome | (uses the Play Hub page) | in progress | PR #26 waits for Su's go |
| Aurum Studio (video/audio editor) | `apps/studio/` + `android/studio/` | 0.2.0 | paused | Removed from Play Hub; nothing to do unless Su asks |

## How releases work
New app versions AND Play Hub page changes (edit `hub-next/`, never `hub/`) go to Play Hub Studio only. Su tries them there and presses Publish, which is the only thing that puts them in the public Play Hub. See `README.md`.
