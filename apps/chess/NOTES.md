# Gambit — notes

## What it does
Chess for the tablet, played in landscape. Two players on one device, or against the computer (6 levels). Full rules, chess clocks, hints, game review, drawing on the board, and many boards and piece sets.

- Code: `apps/chess/` (the app is bundled into the APK built from `android/chess/`).
- Version lives in `const VERSION` in `apps/chess/chess.js`.

## Current version
0.28.1 in Studio (0.27.0 public)

## Su's decisions
- Name Gambit, gold knight in a shield logo. Cinzel font. Saddle tan leather background.
- Luxurious look with gold accents. No green in the app (a green marble board is fine).
- Default board: FIDE tournament wood. Other boards: Maple, Mahogany, Stone, and Emerald, Royal Blue and Amethyst marble (with silver and onyx pieces). No Cherry or Burgundy.
- Piece sets: Maestro (default), Merida, Alpha. Never the California set.
- Layout: big board on the left, Gambit name top right, panel on the right. No player bars. Flip only in two-player mode.
- No sound.
- Undo: 3 per player per game, kept inside Settings (out of sight). Against the computer, undo takes back your move and the computer's.
- Last-move highlight in soft gold.
- Pieces glide when moving, stepping through moves and on Undo: a gentle glide of about 0.4-0.65 s (longer moves a bit longer). A finger tap never lifts the piece (drag starts only after ~14 px); a dropped piece settles softly into its square; an illegal drop floats back (0.28.1, Su said the movement was jumpy). Captured pieces fly off. Win celebration with gold confetti.
- Clocks are picked in New game; they start after White's first move and pause when the app is hidden.
- Computer levels: Beginner and Easy use a simple built-in player; Medium and up use Stockfish. Each level must be a clear step up (Su). Measured 0.28.0 (winning chances lost per middlegame move): Beginner ~28%, Easy ~14%, Medium ~4%, Hard ~2%, Expert ~1%, Master ~0.6%. Medium never gives pieces away mid-game (Su hated that).
- Computer think time grows with level (0.28.0): about 1-2 s on Beginner up to 3.5-6 s on Master; the first couple of moves are quicker.
- Draw on the board: a pen that opens a Drawing card with 4 colors, Undo and Clear. The card is dark brown like the other cards; gold only on the pen icon, the title and a thin border (Su said the yellow header didn't belong, 0.27.1).

## Known bugs
- None known. (Fixed 0.27.2: the whole board blinked on every tap because all 64 squares and pieces were rebuilt; now only changed squares are updated.)

## To-do (plan to 1.0)
1. Puzzles
2. Stats and saved games
3. 1.0 finish
