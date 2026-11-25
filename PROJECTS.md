# Projects

The master list of Su's apps. Update this file every time a task finishes.
Each app folder has a `NOTES.md` with more detail. Read it before starting work on that app.

| App | Folder | Current version | Status | Next to-do |
|---|---|---|---|---|
| App Vault Studio | `studio/` (page) + `android/hubstudio/` (app) | page 0.10.0, app 0.4.0 | testing | Su updates Studio app to 0.4.0, checks the App Vault rename (Try page, Install app 0.9.0), then Publishes |
| App Vault | `hub/` (page) + `android/hub/` (app) | page 0.21.0 public (0.22.0 new icon in Studio), app 0.9.0 public (0.10.0 new icon in Studio) | testing | Su tries the new Tile vault icon from Studio, then Publishes |
| Gambit (chess) | `apps/chess/` + `android/chess/` | 0.27.1 in Studio (0.27.0 public) | in progress | Puzzles (0.11 step of the plan), then stats and saved games, then 1.0 |
| Quillsong | `apps/quillsong/` (icon only, source kept outside the repo) | 1.9.0 | testing | Su tests the Gentle voice power setting |
| App Vault for Windows | `hub/` installed from Edge/Chrome | (uses the App Vault page) | in progress | PR #26 waits for Su's go |
| Aurum Studio (video/audio editor) | `apps/studio/` + `android/studio/` | 0.2.0 | paused | Removed from App Vault; nothing to do unless Su asks |

## How releases work
New app versions AND App Vault page changes (edit `hub-next/` and `get-next/`, never `hub/` or `get/`) go to App Vault Studio only. Su tries them there and presses Publish, which is the only thing that puts them in the public App Vault. See `README.md`.
