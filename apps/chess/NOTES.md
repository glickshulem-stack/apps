# Gambit — notes

## What it does
Chess for the tablet, played in landscape. Two players on one device, or against the computer (6 levels). Full rules, chess clocks, hints, game review, drawing on the board, and many boards and piece sets.

- Code: `apps/chess/` (the app is bundled into the APK built from `android/chess/`).
- Version lives in `const VERSION` in `apps/chess/chess.js`.

## Current version
0.27.0 (in Studio and public)

## Su's decisions
- Name Gambit, gold knight in a shield logo. Cinzel font. Saddle tan leather background.
- Luxurious look with gold accents. No green in the app (a green marble board is fine).
- Default board: FIDE tournament wood. Other boards: Maple, Mahogany, Stone, and Emerald, Royal Blue and Amethyst marble (with silver and onyx pieces). No Cherry or Burgundy.
- Piece sets: Maestro (default), Merida, Alpha. Never the California set.
- Layout: big board on the left, Gambit name top right, panel on the right. No player bars. Flip only in two-player mode.
- No sound.
- Undo: 3 per player per game, kept inside Settings (out of sight). Against the computer, undo takes back your move and the computer's.
- Last-move highlight in soft gold.
- Pieces glide when moving, stepping through moves and on Undo. Captured pieces fly off. Win celebration with gold confetti.
- Clocks are picked in New game; they start after White's first move and pause when the app is hidden.
- Computer levels: Beginner and Easy use a simple built-in player; Medium and up use Stockfish.
- Draw on the board: a pen that opens a gold Drawing card with 4 colors, Undo and Clear.

## Known bugs
- None known.

## To-do (plan to 1.0)
1. Puzzles
2. Stats and saved games
3. 1.0 finish
