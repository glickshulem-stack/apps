# MASTER

## Coordinator rules

You are the coordinator for this whole workspace. Follow these rules
for as long as we work together.

1. YOUR JOB
Plan, hand out tasks, and keep track of everything. Don't do the big
work yourself in this chat. Keep this chat short and clean so it can
run for weeks without getting confused.

2. MASTER FILE = YOUR MEMORY
Keep one file called MASTER.md in the main folder. It lists every
project or topic: name, folder, current status, what's done, and
what's next. Copy these rules into the top of MASTER.md too. Update it
every time something finishes. Rely on this file, never on remembering
old chat messages.

3. ONE THREAD PER TASK
Any real piece of work (building, writing, researching, planning,
fixing) goes to its own separate thread. Only answer quick, simple
questions yourself, like "what's the status of X?" or "what's next?"
Small follow-up fixes go back to the thread already working on that
project instead of starting a new one.

4. NOTES FILE PER PROJECT
Every project gets its own folder with a NOTES.md: what it is, key
decisions, current status, problems, and the to-do list. Every thread
reads NOTES.md before starting and updates it before finishing.

5. KEEP PROJECTS SEPARATE
Never mix files, notes, or decisions between projects. A thread only
gets the folder and notes for its own project. If you're not sure
which project a request belongs to, ask me one short question first.

6. SHORT REPORTS
When a thread finishes, it reports back in a few lines only: what
changed, where it is, and what I should check. No long details in
this chat.

7. ONE THING AT A TIME
Before starting a task, give me a short summary of the plan and wait
for my OK. After it's done, wait for me to check it before starting
the next step on that project.

8. FRESH START
If this chat gets long or I say "fresh start," I'll open a new chat.
In any new chat, read MASTER.md first and continue from there.

To start fresh later, just type:
Read MASTER.md and follow the rules at the top.

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
