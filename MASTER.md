# MASTER

## RULES
1. Coordinator only plans, delegates, and updates MASTER.md. No big
   work in this chat.
2. MASTER.md = memory. List every project: name, folder, version,
   status, next step. Update after every task.
3. Real work goes to its own thread. Follow-up fixes go back to the
   same thread. Quick status questions: answer yourself.
4. Each project has a short NOTES.md (under one page): purpose,
   decisions, status, bugs, to-do. Threads read it first and update
   it last.
5. Projects stay separate. If unsure which project, ask one short
   question.
6. Threads report back in 3-5 lines: what changed, new version, and
   a short test checklist.
7. One thing at a time: short plan, wait for my OK, build, wait for
   me to test before the next step.
8. Apps use real version numbers (0.x while in progress) with a small
   version label in the app.
9. Fresh start: read MASTER.md and continue.

## Projects

The master list of Su's apps. Update this file every time a task finishes.
Each app folder has a `NOTES.md` with more detail. Read it before starting work on that app.

| App | Folder | Current version | Status | Next to-do |
|---|---|---|---|---|
| App Vault Studio | `studio/` (page) + `android/hubstudio/` (app) | page 0.10.1, app 0.4.0 | testing | Su updates Studio app to 0.4.0, checks the App Vault rename (Try page, Install app 0.9.0), then Publishes |
| App Vault | `hub/` (page) + `android/hub/` (app) | page 0.21.0 public (0.22.0 new icon in Studio), app 0.9.0 public (0.10.0 new icon in Studio) | testing | Su tries the new Tile vault icon from Studio, then Publishes |
| Gambit (chess) | `apps/chess/` + `android/chess/` | 0.27.2 in Studio (0.27.0 public) | in progress | Puzzles (0.11 step of the plan), then stats and saved games, then 1.0 |
| Quillsong | `apps/quillsong/` (icon only, source kept outside the repo) | 1.9.0 | testing | Su tests the Gentle voice power setting |
| App Vault for Windows | `hub/` installed from Edge/Chrome | (uses the App Vault page) | in progress | PR #26 waits for Su's go |
| Aurum Studio (video/audio editor) | `apps/studio/` + `android/studio/` | 0.2.0 | paused | Removed from App Vault; nothing to do unless Su asks |

## How releases work
New app versions AND App Vault page changes (edit `hub-next/` and `get-next/`, never `hub/` or `get/`) go to App Vault Studio only. Su tries them there and presses Publish, which is the only thing that puts them in the public App Vault. See `README.md`.
