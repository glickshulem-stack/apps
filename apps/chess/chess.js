const VERSION = '0.24.1';
if (navigator.userAgent.includes('GlickApp')) document.getElementById('back').style.visibility = 'hidden';
document.getElementById('ver').textContent = VERSION;
{ const t = new URLSearchParams(location.search).get('theme'); if (t) document.body.dataset.theme = t; const bg = new URLSearchParams(location.search).get('bg'); if (bg) document.body.dataset.bg = bg; const fo = new URLSearchParams(location.search).get('font'); if (fo) document.body.dataset.font = fo; }

// Board: board[r][c], r=0 is rank 8. Piece = {t:'p|n|b|r|q|k', c:'w|b'} or null.
// Piece sets offered in Settings. Add more here later.
const SETS = [['maestro','Maestro'],['merida','Merida'],['alpha','Alpha']];
let PSET = 'maestro';
// Boards offered in Settings. Each is a matched set: board squares, page background and panel colors,
// in the same style as the original Tournament board on saddle leather.
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;
const leather = (a, b, c) => `${NOISE}, radial-gradient(1000px 700px at 35% 45%, ${a} 0%, ${b} 55%, ${c} 100%)`;
const marble = (n, col) => `url(boards/${n}.jpg) ${col}`;
const BROWN = { p1:'#4a3422', p2:'#2e2016', p3:'#6b4c32', b1:'#5a3f29', b2:'#43301f', b3:'#7a5838', chip:'#3a2a1c', chipon:'#4e3826', well:'rgba(46,32,22,.55)', soft:'#c9a880' };
const panel = (p1, p2, p3, soft) => ({ p1, p2, p3, b1:p1, b2:p2, b3:p3, chip:p2, chipon:p1, well:`color-mix(in srgb, ${p2} 60%, transparent)`, soft });
const BOARDS = [
  { id:'fide', name:'Tournament', l:'#e6c79a', d:'#9a6a3e', page:leather('#bf8650','#a06a3a','#7a4e28'), ui:BROWN },
  { id:'maple', name:'Maple', l:'#f0d9b5', d:'#b58863', page:leather('#b4743f','#94592c','#6e3f1d'), ui:BROWN },
  { id:'mahogany', name:'Mahogany', l:'#e9c9a6', d:'#6e3b24', page:leather('#8e4630','#6e2e1e','#481a0e'), ui:panel('#4a2218','#2c120c','#6e3626','#c99a88') },
  { id:'stone', name:'Stone', l:'#ece6da', d:'#7d746c', page:leather('#8a847b','#6a655e','#45423d'), ui:panel('#3e3b37','#252321','#5a5650','#b5aea4') },
  { id:'emerald', name:'Emerald', pw:['#1b2233','#56627a','#9ea9bd','#c9d0dc','#e4e8ef'], pb:['#0a0a0c','#1e1e22','#4a4a52','#a0a0a8','#e8e8ec'], l:marble('green-l','#e6e9de'), d:marble('green-d','#1e4a3a'), cl:'#1e4a3a', cd:'#e6e9de', page:leather('#2f5e4b','#1f4436','#11281f'), ui:panel('#1f3d31','#11251d','#355e4c','#a9c4b6') },
  { id:'royal', name:'Royal Blue', pw:['#1b2233','#56627a','#9ea9bd','#c9d0dc','#e4e8ef'], pb:['#0a0a0c','#1e1e22','#4a4a52','#a0a0a8','#e8e8ec'], l:marble('blue-l','#e9ecf2'), d:marble('blue-d','#1f3b7c'), cl:'#1f3b7c', cd:'#e9ecf2', page:leather('#33569c','#22407c','#142650'), ui:panel('#20345f','#121e3a','#36508a','#a9b8d8') },
  { id:'amethyst', name:'Amethyst', pw:['#1b2233','#56627a','#9ea9bd','#c9d0dc','#e4e8ef'], pb:['#0a0a0c','#1e1e22','#4a4a52','#a0a0a8','#e8e8ec'], l:marble('purple-l','#eee8f1'), d:marble('purple-d','#4a2a6e'), cl:'#4a2a6e', cd:'#eee8f1', page:leather('#5e3a82','#452a62','#28173c'), ui:panel('#3a2452','#221432','#5a3c78','#c2aed6') },
];
let BOARD = 'fide';
try { const v = localStorage.getItem('gambit-board'); if (BOARDS.some(x => x.id === v)) BOARD = v; } catch {}
{ const q = new URLSearchParams(location.search).get('board'); if (q) BOARD = q; }
function applyBoard() {
  const b = BOARDS.find(x => x.id === BOARD) || BOARDS[0], st = document.body.style;
  st.setProperty('--light', b.l); st.setProperty('--dark', b.d); st.setProperty('--cl', b.cl || b.d); st.setProperty('--cd', b.cd || b.l);
  st.setProperty('--page', b.page);
  for (const [k, v] of Object.entries(b.ui)) st.setProperty('--' + k, v);
  // piece colors that match the board (classic black and white when a board has none)
  document.body.classList.toggle('tinted', !!b.pw);
  if (b.pw) for (const [side, cols] of [['w', b.pw], ['b', b.pb]]) {
    const rgb = cols.map(h => [1, 3, 5].map(i => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)));
    ['R', 'G', 'B'].forEach((ch, k) => document.getElementById(`tint${side}${ch}`).setAttribute('tableValues', rgb.map(x => x[k]).join(' ')));
  }
}
applyBoard();
try { const v = localStorage.getItem('gambit-pieces'); if (SETS.some(x => x[0] === v)) PSET = v; } catch {}
{ const q = new URLSearchParams(location.search).get('pieces'); if (q) PSET = q; }
const piece = (c, t, cls='pc') => `<svg class="${cls} c${c}" viewBox="0 0 40 40"><use width="40" height="40" href="pieces/${PSET}.svg#${c}${t}"/></svg>`;
const VALUE = { p:1, n:3, b:3, r:5, q:9, k:0 };
let viewIdx = null;
// Choices are [minutes, seconds added after each move]. null = no clock.
const TIMES = [null, [1,0], [3,2], [5,0], [10,0], [15,10], [30,0]];
let timeCtl = null, clock = null, lastTick = performance.now(), pickTime;
try { const v = JSON.parse(localStorage.getItem('gambit-time')); if (v === null || TIMES.some(t => t && t[0]===v[0] && t[1]===v[1])) timeCtl = v; } catch {}
// Opponent: two players on one device, or the computer. setup = what the New game dialog picks.
// Beginner and Easy use a simple built-in player that misses a lot; Medium and up use the Stockfish engine.
// Medium and Hard: the engine looks at its top `pv` moves (to `depth`) and the computer picks any move that is at most
// `margin` centipawns worse than the best one; with chance slip[0] it allows up to slip[1] (a human-like slip).
// This keeps the strength the same all game long (Stockfish's own Skill Level setting blundered pieces in the middlegame).
// think = how long the computer pretends to think, in seconds [min, max].
const LEVELS = [
  { name:'Beginner', simple:'beginner', think:[1, 2] },
  { name:'Easy',     simple:'easy',     think:[1.2, 2.5] },
  { name:'Medium',   depth:5,  pv:6, margin:90, slip:[.15, 200], think:[1.5, 3] },
  { name:'Hard',     depth:8,  pv:4, margin:40, slip:[.08, 100], think:[1.8, 3.5] },
  { name:'Expert',   skill:12, ms:500,            think:[2, 4] },
  { name:'Master',   skill:20, ms:1500,           think:[2.5, 5] } ];
let mode = { cpu:false }, setup = { cpu:false, level:2, color:'w' };
try { const v = JSON.parse(localStorage.getItem('gambit-setup')); if (v && typeof v.cpu === 'boolean') setup = v; } catch {}
let hintMove = null, hintBusy = false, review = null, reviewing = false, lastScore = null;
let pvLines = {};   // multipv number -> { cp, move } from the engine's latest search
let engine = null, searching = false, ignoreBest = 0, onBest = null, thinkId = 0, cpuBusy = false, pickSetup = { ...setup };
// Coach tools. ink = drawing color; pen = drawing mode on; marks = arrows and colored squares on the position shown.
const INKS = { y:'#f2c230', r:'#e0453a', b:'#3f8ae6', o:'#ef8a2e' }, INK_NAMES = { y:'Yellow', r:'Red', b:'Blue', o:'Orange' };
let ink = 'y', pen = false, pdraw = null, marks = { arrows: [], boxes: {}, pos: null }, ex = null;   // ex = the real game, kept while you explore
try { const v = localStorage.getItem('gambit-ink'); if (INKS[v]) ink = v; } catch {}
let S, history, flipped = false, selected = null, legalForSel = [];

function initial() {
  const back = ['r','n','b','q','k','b','n','r'];
  const board = Array.from({length:8}, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = {t:back[c], c:'b'}; board[1][c] = {t:'p', c:'b'};
    board[6][c] = {t:'p', c:'w'};     board[7][c] = {t:back[c], c:'w'};
  }
  return { board, turn:'w', castle:{wK:true,wQ:true,bK:true,bQ:true}, ep:null, last:null, half:0, captured:{w:[],b:[]}, positions:{} };
}
const clone = s => JSON.parse(JSON.stringify(s));
const inB = (r,c) => r>=0 && r<8 && c>=0 && c<8;
const opp = c => c === 'w' ? 'b' : 'w';

function attacked(board, r, c, by) {
  const pd = by === 'w' ? 1 : -1; // white pawns attack upward (from r+1)
  for (const dc of [-1,1]) { const p = inB(r+pd,c+dc) && board[r+pd][c+dc]; if (p && p.c===by && p.t==='p') return true; }
  for (const [dr,dc] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]) { const p = inB(r+dr,c+dc) && board[r+dr][c+dc]; if (p && p.c===by && p.t==='n') return true; }
  for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) { if (!dr && !dc) continue; const p = inB(r+dr,c+dc) && board[r+dr][c+dc]; if (p && p.c===by && p.t==='k') return true; }
  for (const [dr,dc,types] of [[1,0,'rq'],[-1,0,'rq'],[0,1,'rq'],[0,-1,'rq'],[1,1,'bq'],[1,-1,'bq'],[-1,1,'bq'],[-1,-1,'bq']]) {
    let rr=r+dr, cc=c+dc;
    while (inB(rr,cc)) { const p = board[rr][cc]; if (p) { if (p.c===by && types.includes(p.t)) return true; break; } rr+=dr; cc+=dc; }
  }
  return false;
}
function kingPos(board, col) { for (let r=0;r<8;r++) for (let c=0;c<8;c++) { const p=board[r][c]; if (p && p.t==='k' && p.c===col) return [r,c]; } }
function inCheck(s, col) { const [r,c] = kingPos(s.board, col); return attacked(s.board, r, c, opp(col)); }

function pseudo(s, r, c) {
  const b = s.board, p = b[r][c], out = [];
  if (!p) return out;
  const add = (tr,tc,extra={}) => out.push({fr:r,fc:c,tr,tc,...extra});
  if (p.t === 'p') {
    const d = p.c==='w' ? -1 : 1, start = p.c==='w' ? 6 : 1, last = p.c==='w' ? 0 : 7;
    const pushMove = (tr,tc,extra={}) => { if (tr===last) for (const pr of ['q','r','b','n']) add(tr,tc,{...extra,promo:pr}); else add(tr,tc,extra); };
    if (inB(r+d,c) && !b[r+d][c]) { pushMove(r+d,c); if (r===start && !b[r+2*d][c]) add(r+2*d,c,{double:true}); }
    for (const dc of [-1,1]) {
      const tr=r+d, tc=c+dc; if (!inB(tr,tc)) continue;
      if (b[tr][tc] && b[tr][tc].c!==p.c) pushMove(tr,tc);
      else if (s.ep && s.ep[0]===tr && s.ep[1]===tc) add(tr,tc,{enpassant:true});
    }
  } else if (p.t === 'n' || p.t === 'k') {
    const deltas = p.t==='n' ? [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]] : [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr,dc] of deltas) { const tr=r+dr, tc=c+dc; if (inB(tr,tc) && (!b[tr][tc] || b[tr][tc].c!==p.c)) add(tr,tc); }
    if (p.t==='k') {
      const row = p.c==='w' ? 7 : 0, o = opp(p.c);
      if (r===row && c===4 && !attacked(b,row,4,o)) {
        if (s.castle[p.c+'K'] && !b[row][5] && !b[row][6] && b[row][7]?.t==='r' && !attacked(b,row,5,o) && !attacked(b,row,6,o)) add(row,6,{castle:'K'});
        if (s.castle[p.c+'Q'] && !b[row][3] && !b[row][2] && !b[row][1] && b[row][0]?.t==='r' && !attacked(b,row,3,o) && !attacked(b,row,2,o)) add(row,2,{castle:'Q'});
      }
    }
  } else {
    const dirs = { r:[[1,0],[-1,0],[0,1],[0,-1]], b:[[1,1],[1,-1],[-1,1],[-1,-1]] };
    dirs.q = [...dirs.r, ...dirs.b];
    for (const [dr,dc] of dirs[p.t]) {
      let tr=r+dr, tc=c+dc;
      while (inB(tr,tc)) { if (b[tr][tc]) { if (b[tr][tc].c!==p.c) add(tr,tc); break; } add(tr,tc); tr+=dr; tc+=dc; }
    }
  }
  return out;
}

function apply(s, m) {
  const n = clone(s), b = n.board, p = b[m.fr][m.fc];
  let cap = b[m.tr][m.tc];
  if (m.enpassant) { cap = b[m.fr][m.tc]; b[m.fr][m.tc] = null; }
  b[m.tr][m.tc] = m.promo ? {t:m.promo, c:p.c} : p; b[m.fr][m.fc] = null;
  if (m.castle === 'K') { b[m.tr][5] = b[m.tr][7]; b[m.tr][7] = null; }
  if (m.castle === 'Q') { b[m.tr][3] = b[m.tr][0]; b[m.tr][0] = null; }
  if (p.t === 'k') { n.castle[p.c+'K'] = false; n.castle[p.c+'Q'] = false; }
  const corners = {'7,0':'wQ','7,7':'wK','0,0':'bQ','0,7':'bK'};
  for (const sq of [[m.fr,m.fc],[m.tr,m.tc]]) { const k = corners[sq.join(',')]; if (k) n.castle[k] = false; }
  n.ep = m.double ? [(m.fr+m.tr)/2, m.fc] : null;
  if (cap) n.captured[p.c].push(cap.t);
  n.half = (cap || p.t==='p') ? 0 : s.half + 1;
  n.turn = opp(s.turn); n.last = m;
  return n;
}
function legalMoves(s, r, c) { return pseudo(s, r, c).filter(m => !inCheck(apply(s, m), s.turn)); }
function allLegal(s) { const out = []; for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (s.board[r][c]?.c===s.turn) out.push(...legalMoves(s,r,c)); return out; }
function posKey(s) { return JSON.stringify([s.board, s.turn, s.castle, s.ep]); }

function insufficient(b) {
  const pcs = []; for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (b[r][c] && b[r][c].t!=='k') pcs.push({...b[r][c], sq:(r+c)%2});
  if (pcs.length === 0) return true;
  if (pcs.length === 1 && 'nb'.includes(pcs[0].t)) return true;
  if (pcs.every(p => p.t==='b') && pcs.every(p => p.sq===pcs[0].sq)) return true;
  return false;
}
function result(s) {
  if (s === S && clock?.flag) return `${clock.flag==='w' ? 'Black' : 'White'} wins on time`;
  const name = s.turn==='w' ? 'White' : 'Black', other = s.turn==='w' ? 'Black' : 'White';
  if (allLegal(s).length === 0) return inCheck(s, s.turn) ? `Checkmate! ${other} wins` : 'Stalemate. It\'s a draw';
  if (s.half >= 100) return 'Draw by the 50-move rule';
  if ((s.positions[posKey(s)]||0) >= 3) return 'Draw by repetition';
  if (insufficient(s.board)) return 'Draw. Not enough pieces to checkmate';
  return null;
}

// ---------- UI ----------
const boardEl = document.getElementById('board'), statusEl = document.getElementById('status');
const UNDO_LIMIT = 3;
let undos = { w: UNDO_LIMIT, b: UNDO_LIMIT };
function newGame() {
  ex = null; pen = false;
  cancelThink(); hintMove = null; if (review || reviewing) stopReview();
  mode = setup.cpu ? { cpu:true, level:setup.level, human: setup.color === 'r' ? (Math.random() < .5 ? 'w' : 'b') : setup.color } : { cpu:false };
  if (mode.cpu) flipped = mode.human === 'b';
  clock = timeCtl ? { base: timeCtl[0], inc: timeCtl[1], w: timeCtl[0]*60000, b: timeCtl[0]*60000, flag: null } : null; viewIdx = null; S = initial(); S.positions[posKey(S)] = 1; history = []; undos = { w: UNDO_LIMIT, b: UNDO_LIMIT }; selected = null; legalForSel = []; save(); render(); maybeCpu(); }
function save() { if (ex) return; try { localStorage.setItem('chess-game', JSON.stringify({S, history, flipped, undos, clock, mode})); } catch {} }
function load() { try { const d = JSON.parse(localStorage.getItem('chess-game')); if (d && d.S) { S = d.S; history = d.history; flipped = d.flipped; if (d.undos) undos = d.undos; clock = d.clock || null; mode = d.mode || { cpu:false }; return true; } } catch {} return false; }

function render() {
  boardEl.innerHTML = '';
  const D = viewIdx == null ? S : [...history, S][viewIdx + 1];
  if (marks.pos !== D) { marks.arrows = []; marks.boxes = {}; marks.pos = D; }   // drawings belong to the position shown
  const over = result(S), dover = result(D), chk = !dover && inCheck(D, D.turn) ? kingPos(D.board, D.turn) : (dover?.startsWith('Checkmate') ? kingPos(D.board, D.turn) : null);
  for (let i=0;i<8;i++) for (let j=0;j<8;j++) {
    const r = flipped ? 7-i : i, c = flipped ? 7-j : j;
    const d = document.createElement('div');
    d.className = 'sq ' + ((r+c)%2 ? 'dark' : 'light'); d.style.backgroundPosition = `${(c*37+r*11)%100}% ${(r*53+c*7)%100}%`;
    if (selected && selected[0]===r && selected[1]===c) d.classList.add('sel');
    if (chk && chk[0]===r && chk[1]===c) d.classList.add('check');
    const mv = legalForSel.find(m => m.tr===r && m.tc===c);
    if (mv) d.classList.add(D.board[r][c] ? 'capture' : 'move');
    // en passant: also ring the pawn that gets taken (beside the moving pawn)
    else if (legalForSel.some(m => m.enpassant && m.fr===r && m.tc===c)) d.classList.add('capture');
    const p = D.board[r][c], box = marks.boxes[r + ',' + c];
    if (box) d.insertAdjacentHTML('beforeend', `<i class="mk" style="--ink:${INKS[box]}"></i>`);
    if (p) d.insertAdjacentHTML('beforeend', piece(p.c, p.t));
    if (i===7) d.insertAdjacentHTML('beforeend', `<span class="coord f">${'abcdefgh'[c]}</span>`);
    if (j===0) d.insertAdjacentHTML('beforeend', `<span class="coord r">${8-r}</span>`);
    boardEl.appendChild(d);
  }
  const mat = col => S.captured[col].reduce((a,t)=>a+VALUE[t],0);
  document.getElementById('turn-dot').className = 'turn-dot ' + S.turn;
  statusEl.classList.toggle('over', !!over);
  { const who = mode.cpu ? mode.human : opp(S.turn), left = undos[who], btn = document.getElementById('undo');
    if (ex) { btn.querySelector('span').innerHTML = 'Undo'; btn.disabled = !history.length; btn.title = 'Take back a move you are trying out'; } else {
    btn.querySelector('span').innerHTML = mode.cpu ? `Undo<small class="ucount">${left} left</small>` : `Undo<small class="ucount">White ${undos.w} · Black ${undos.b} left</small>`;
    btn.disabled = history.length < undoPlies() || left <= 0 || !!clock?.flag;
    document.getElementById('flip').hidden = mode.cpu; document.querySelector('.actions').classList.toggle('solo', mode.cpu);
    btn.title = `${who==='w'?'White':'Black'} has ${left} undo${left===1?'':'s'} left`; } }
  renderCoach();
  renderMoves(); renderClock(); drawHint();
  { const h = document.getElementById('hint'); h.disabled = !!result(S) || cpuTurn() || viewIdx != null; h.classList.toggle('busy', hintBusy); }
  renderReview();
  if (viewIdx != null) {
    const c = review?.cls[viewIdx], label = `${Math.floor(viewIdx/2)+1}${viewIdx%2?'…':'.'} ${sanAt(viewIdx)}`;
    statusEl.textContent = viewIdx < 0 ? 'Start position' : c ? `${label}: ${QNAME[c]}${c !== 'best' && review.bestSan[viewIdx] ? `. Better was ${review.bestSan[viewIdx]}` : ''}` : ex ? `Move ${label}. Move a piece to try something else` : `Move ${label}. Tap the board to go back to the game`;
    statusEl.classList.remove('over'); return; }
  if (reviewing) { statusEl.textContent = `Reviewing the game… ${reviewing.done} / ${reviewing.total}`; return; }
  if (ex) { statusEl.textContent = dover || (hintMove ? `Hint: ${hintMove.san}` : `Exploring. ${S.turn==='w' ? 'White' : 'Black'} to move`); return; }
  statusEl.textContent = over || (hintMove && !cpuTurn() ? `Hint: ${hintMove.san}` : '') || (mode.cpu ? (S.turn === mode.human ? 'Your move' : 'Computer is thinking…') : `${S.turn==='w' ? 'White' : 'Black'} to move`) + (chk ? ' (check!)' : '');
}

// Moves that land on (r,c). For en passant, tapping the pawn being taken also counts.
function movesTo(r, c) {
  const mv = legalForSel.filter(m => m.tr===r && m.tc===c);
  return mv.length ? mv : legalForSel.filter(m => m.enpassant && m.fr===r && m.tc===c);
}
function tap(r, c) {
  if (result(S) || cpuTurn()) return;
  const mv = movesTo(r, c);
  if (mv.length) {
    if (mv.length > 1) return askPromo(mv);
    return doMove(mv[0]);
  }
  const p = S.board[r][c];
  if (p && p.c === S.turn && !(selected && selected[0]===r && selected[1]===c)) { selected = [r,c]; legalForSel = legalMoves(S, r, c); }
  else { selected = null; legalForSel = []; }
  render();
}
const sqEl = (r, c) => boardEl.children[flipped ? (7-r)*8 + (7-c) : r*8 + c];
function doMove(m, animate = true) {
  const capSq = m.enpassant ? [m.fr, m.tc] : [m.tr, m.tc];
  const capPiece = S.board[capSq[0]][capSq[1]];
  const fromRect = sqEl(m.fr, m.fc).getBoundingClientRect(), capRect = sqEl(capSq[0], capSq[1]).getBoundingClientRect();
  const mover = S.board[m.fr][m.fc];
  const rookFrom = m.castle ? sqEl(m.tr, m.castle === 'K' ? 7 : 0).getBoundingClientRect() : null;
  if (clock && history.length) clock[S.turn] += clock.inc * 1000;
  hintMove = null; if (hintBusy) { hintBusy = false; cancelThink(); }
  if (review || reviewing) stopReview();
  history.push(S); S = apply(S, m);
  const k = posKey(S); S.positions[k] = (S.positions[k]||0) + 1;
  selected = null; legalForSel = []; save(); render();
  if (capPiece) flyOff(capPiece, capRect, animate ? 220 : 0);
  if (animate) {
    glide(mover.c, m.promo || mover.t, fromRect, m.tr, m.tc);
    if (m.castle) glide(mover.c, 'r', rookFrom, m.tr, m.castle === 'K' ? 5 : 3);
  }
  if (!ex && result(S)?.startsWith('Checkmate')) setTimeout(celebrate, 450);
  lastTick = performance.now();
  setTimeout(maybeCpu, 30);
}

// ---- win celebration ----
function celebrate() {
  const winner = opp(S.turn), loser = S.turn, kp = kingPos(S.board, loser);
  // the beaten king topples over
  const ksq = kp && sqEl(kp[0], kp[1]), kpc = ksq && ksq.querySelector('svg.pc');
  if (kpc) kpc.animate([{ transform:'rotate(0)' }, { transform:'rotate(-14deg)', offset:.3 }, { transform:'rotate(90deg) translate(18%, 10%)' }],
    { duration:900, easing:'cubic-bezier(.5,0,.75,0)', fill:'forwards' });
  setTimeout(() => {
    const ov = document.getElementById('win');
    document.getElementById('winpiece').innerHTML = piece(winner, 'k', '');
    document.querySelector('.winsub').textContent = clock?.flag ? 'On time' : 'Checkmate';
    document.getElementById('wintitle').textContent = mode.cpu ? (winner === mode.human ? 'You win' : 'Computer wins') : (winner === 'w' ? 'White' : 'Black') + ' wins';
    ov.classList.add('show'); confetti();
  }, 950);
}
function confetti() {
  const cv = document.getElementById('confetti'), ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ['#f6dc8e','#e3b74f','#b88a2c','#fff4d6','#f3e2c4','#c9a227'];
  // gold confetti bursts up from both lower corners
  const bits = Array.from({length:180}, (_, i) => {
    const left = i % 2 === 0, a = -Math.PI/2 + (left ? .55 : -.55) + (Math.random() - .5) * .7, v = 11 + Math.random() * 10;
    return { x: left ? -10 : W + 10, y: H * .85, vx: Math.sin(a + Math.PI/2) * v * (left ? 1 : 1), vy: -Math.abs(Math.cos(a + Math.PI/2) * v) - 6,
      w: 6 + Math.random() * 7, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .35, c: cols[i % cols.length], d: Math.random() * 25 };
  });
  bits.forEach(b => { b.vx = (b.x < 0 ? 1 : -1) * (4 + Math.random() * 9); });
  let t = 0;
  (function frame() {
    ctx.clearRect(0, 0, W, H); t++;
    for (const b of bits) {
      if (t < b.d) continue;
      b.vy += .25; b.vx *= .99; b.vy *= .985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.scale(1, Math.cos(t * .12 + b.d));
      ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
    }
    if (t < 300 && document.getElementById('win').classList.contains('show')) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  })();
}
document.getElementById('winlook').onclick = () => document.getElementById('win').classList.remove('show');
document.getElementById('winnew').onclick = () => { document.getElementById('win').classList.remove('show'); newGame(); };
// Animations use a floating copy of the piece above the board.
function ghost(c, t, rect) {
  const g = document.createElement('div'); g.className = 'flyghost';
  g.style.left = rect.left + 'px'; g.style.top = rect.top + 'px'; g.style.width = rect.width + 'px'; g.style.height = rect.height + 'px';
  g.innerHTML = piece(c, t, '');
  document.body.appendChild(g); return g;
}
function glide(c, t, fromRect, tr, tc) {
  const sq = sqEl(tr, tc), real = sq.querySelector('svg.pc'), to = sq.getBoundingClientRect();
  if (!real || !fromRect) return;
  real.style.visibility = 'hidden';
  const g = ghost(c, t, fromRect);
  const dx = to.left - fromRect.left, dy = to.top - fromRect.top, lift = Math.min(40, Math.hypot(dx, dy) * .12);
  const anim = g.animate([
    { transform: 'translate(0,0) scale(1)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.25))' },
    { transform: `translate(${dx*.5}px, ${dy*.5 - lift}px) scale(1.12)`, filter: 'drop-shadow(0 12px 10px rgba(0,0,0,.35))', offset: .5 },
    { transform: `translate(${dx}px, ${dy}px) scale(1)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.25))' }
  ], { duration: 340, easing: 'cubic-bezier(.4,0,.2,1)' });
  anim.onfinish = () => { g.remove(); real.style.visibility = ''; };
}
function flyOff(p, rect, delay) {
  const g = ghost(p.c, p.t, rect);
  // Black pieces fly off to the right and up, white pieces to the left and down.
  const dir = p.c === 'b' ? 1 : -1;
  const dx = dir * (window.innerWidth * .55), dy = -dir * (window.innerHeight * .35);
  g.animate([
    { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 },
    { transform: `translate(${dx*.25}px, ${dy*.25 - 60}px) rotate(${dir*180}deg) scale(1.15)`, opacity: 1, offset: .3 },
    { transform: `translate(${dx}px, ${dy}px) rotate(${dir*540}deg) scale(.6)`, opacity: 0 }
  ], { duration: 750, delay, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'both' }).onfinish = () => g.remove();
}

// ---- tap and drag on the board ----
let drag = null;
function squareAt(x, y) {
  const b = boardEl.getBoundingClientRect(); if (x < b.left || y < b.top || x >= b.right || y >= b.bottom) return null;
  let j = Math.floor((x - b.left) / b.width * 8), i = Math.floor((y - b.top) / b.height * 8);
  return flipped ? [7-i, 7-j] : [i, j];
}
boardEl.addEventListener('contextmenu', e => e.preventDefault());
boardEl.addEventListener('pointerdown', e => {
  if (pen || e.button === 2) return penDown(e);
  if (marks.arrows.length || Object.keys(marks.boxes).length) { marks.arrows = []; marks.boxes = {}; render(); }   // a normal tap wipes the drawings
  if (viewIdx != null) {
    if (!ex) { viewIdx = null; render(); return; }
    // exploring: carry on from the move being shown (later moves of this try-out are dropped)
    const all = [...history, S]; S = all[viewIdx + 1]; history = all.slice(0, viewIdx + 1); viewIdx = null; selected = null; legalForSel = []; render();
  }
  const sq = squareAt(e.clientX, e.clientY); if (!sq || result(S) || cpuTurn()) return;
  const [r, c] = sq, p = S.board[r][c];
  const wasSelected = selected && selected[0]===r && selected[1]===c;
  if (p && p.c === S.turn && !legalForSel.some(m => m.tr===r && m.tc===c)) {
    if (!wasSelected) { selected = [r,c]; legalForSel = legalMoves(S, r, c); render(); }
    const pc = sqEl(r, c).querySelector('svg.pc'), rect = sqEl(r, c).getBoundingClientRect();
    drag = { r, c, wasSelected, x0: e.clientX, y0: e.clientY, moved: false, pc, rect };
    boardEl.setPointerCapture(e.pointerId);
  } else tap(r, c);
});
boardEl.addEventListener('pointermove', e => {
  if (pdraw) return penMove(e);
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  drag.moved = true;
  drag.pc.style.transition = 'none'; drag.pc.style.zIndex = 10; drag.pc.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
});
boardEl.addEventListener('pointerup', e => {
  if (pdraw) return penUp(e);
  if (!drag) return;
  const d = drag; drag = null;
  const sq = squareAt(e.clientX, e.clientY);
  if (d.moved) {
    const mv = sq ? movesTo(sq[0], sq[1]) : [];
    if (mv.length > 1) { render(); return askPromo(mv); }
    if (mv.length) return doMove(mv[0], false);
    render();
  } else if (d.wasSelected) { selected = null; legalForSel = []; render(); }
});
boardEl.addEventListener('pointercancel', () => { if (pdraw) { pdraw = null; drawHint(); } if (drag) { drag = null; render(); } });
function askPromo(moves) {
  const box = document.getElementById('promo-choices'), ov = document.getElementById('promo');
  box.innerHTML = '';
  for (const t of ['q','r','b','n']) {
    const btn = document.createElement('button');
    btn.innerHTML = piece(S.turn, t, '');
    btn.onclick = () => { ov.classList.remove('show'); doMove(moves.find(m => m.promo===t)); };
    box.appendChild(btn);
  }
  ov.classList.add('show');
}
document.getElementById('undo').onclick = () => {
  if (ex) { if (!history.length) return; hintMove = null; viewIdx = null; S = history.pop(); selected = null; legalForSel = []; render(); return; }
  const n = undoPlies(); if (history.length < n) return;
  const who = mode.cpu ? mode.human : opp(S.turn); // the player who made the last move takes it back
  if (undos[who] <= 0) return;
  cancelThink();
  if (review || reviewing) stopReview(); hintMove = null; undos[who]--; viewIdx = null; for (let i = 0; i < n; i++) S = history.pop(); selected = null; legalForSel = []; save(); render();
};
document.getElementById('flip').onclick = () => { flipped = !flipped; save(); render(); };
document.getElementById('newgame').onclick = () => { renderTimes(); document.getElementById('confirm').classList.add('show'); };
document.getElementById('yes').onclick = () => { document.getElementById('confirm').classList.remove('show'); newGame(); };
document.getElementById('no').onclick = () => document.getElementById('confirm').classList.remove('show');

if (!load()) newGame(); else { render(); setTimeout(maybeCpu, 300); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../../sw.js', {scope:'../../'}).catch(()=>{});

// Settings
function renderSettings() {
  const box = document.getElementById('setchoices'); box.innerHTML = '';
  for (const [id, name] of SETS) {
    const b = document.createElement('button'); b.className = 'setopt' + (id === PSET ? ' on' : '');
    const u = (c,t) => `<svg class="c${c}" viewBox="0 0 40 40"><use width="40" height="40" href="pieces/${id}.svg#${c}${t}"/></svg>`;
    b.innerHTML = `<div class="setprev">${u('w','k')}${u('w','n')}${u('b','q')}${u('b','n')}</div><div class="setname">${name}</div>`;
    b.onclick = () => { PSET = id; try { localStorage.setItem('gambit-pieces', id); } catch {} renderSettings(); render(); };
    box.appendChild(b);
  }
  const bb = document.getElementById('boardchoices'); bb.innerHTML = '';
  for (const { id, name, l, d, page } of BOARDS) {
    const b = document.createElement('button'); b.className = 'boardopt' + (id === BOARD ? ' on' : '');
    let cells = ''; for (let i = 0; i < 16; i++) cells += `<i style="background:${(i + (i >> 2)) % 2 ? d : l}; background-position:${i*29%100}% ${i*47%100}%"></i>`;
    b.innerHTML = `<div class="boardprev" style="background:${page}; border-radius:8px"><div class="mini">${cells}</div></div><div class="setname">${name}</div>`;
    b.onclick = () => { BOARD = id; try { localStorage.setItem('gambit-board', id); } catch {} applyBoard(); renderSettings(); };
    bb.appendChild(b);
  }
}
document.getElementById('opensettings').onclick = () => { renderSettings(); document.getElementById('settings').classList.add('show'); };
document.getElementById('closesettings').onclick = () => document.getElementById('settings').classList.remove('show');

// ---- move list (standard chess notation) ----
function san(pre, m) {
  const p = pre.board[m.fr][m.fc], F = 'abcdefgh';
  let out;
  if (m.castle) out = m.castle === 'K' ? 'O-O' : 'O-O-O';
  else {
    const cap = pre.board[m.tr][m.tc] || m.enpassant, dest = F[m.tc] + (8 - m.tr);
    if (p.t === 'p') out = (cap ? F[m.fc] + 'x' : '') + dest + (m.promo ? '=' + m.promo.toUpperCase() : '');
    else {
      const others = allLegal(pre).filter(o => o.tr===m.tr && o.tc===m.tc && (o.fr!==m.fr || o.fc!==m.fc) && pre.board[o.fr][o.fc].t===p.t);
      let dis = '';
      if (others.length) { if (!others.some(o => o.fc===m.fc)) dis = F[m.fc]; else if (!others.some(o => o.fr===m.fr)) dis = String(8-m.fr); else dis = F[m.fc] + (8-m.fr); }
      out = p.t.toUpperCase() + dis + (cap ? 'x' : '') + dest;
    }
  }
  const post = apply(pre, m);
  if (inCheck(post, post.turn)) out += allLegal(post).length ? '+' : '#';
  return out;
}
function renderMoves() {
  const el = document.getElementById('moves'); if (!el) return;
  const all = [...history, S];
  if (!el._cache) el._cache = [];
  const sans = [];
  for (let i = 0; i < history.length; i++) {
    const key = JSON.stringify(all[i+1].last) + i;
    if (el._cache[i]?.key !== key) el._cache[i] = { key, s: san(all[i], all[i+1].last) };
    sans.push(el._cache[i].s);
  }
  el._cache.length = sans.length;
  let h = '';
  for (let i = 0; i < sans.length; i += 2) {
    const cell = j => j < sans.length ? `<span class="mv${(viewIdx ?? sans.length-1) === j ? ' cur' : ''}" data-i="${j}">${sans[j]}${review?.cls[j] ? `<i class="q q-${review.cls[j]}">${QSYM[review.cls[j]]}</i>` : ''}</span>` : '<span></span>';
    h += `<span class="num">${i/2+1}.</span>${cell(i)}${cell(i+1)}`;
  }
  el.innerHTML = h || '<span class="empty">Moves will appear here</span>';
  el.querySelectorAll('.mv').forEach(x => x.onclick = () => { const j = +x.dataset.i; viewIdx = j === sans.length-1 ? null : j; selected = null; legalForSel = []; render(); });
  if (viewIdx == null) el.scrollTop = el.scrollHeight;
}

// ---- chess clocks ----
const tlabel = t => !t ? 'No clock' : t[1] ? `${t[0]} | ${t[1]}` : `${t[0]} min`;
function renderTimes() {
  renderSetup();
  const box = document.getElementById('timechoices'); box.innerHTML = '';
  pickTime = timeCtl;
  for (const t of TIMES) {
    const b = document.createElement('button');
    b.className = 'timeopt' + (JSON.stringify(t) === JSON.stringify(pickTime) ? ' on' : '');
    b.textContent = tlabel(t);
    b.onclick = () => { pickTime = t; box.querySelectorAll('.timeopt').forEach(x => x.classList.toggle('on', x === b)); };
    box.appendChild(b);
  }
}
{ const yes = document.getElementById('yes'), old = yes.onclick;
  yes.onclick = () => { setup = { ...pickSetup }; try { localStorage.setItem('gambit-setup', JSON.stringify(setup)); } catch {} timeCtl = pickTime === undefined ? timeCtl : pickTime; try { localStorage.setItem('gambit-time', JSON.stringify(timeCtl)); } catch {} old(); }; }
function fmt(ms) {
  ms = Math.max(0, ms);
  if (ms < 10000) return `0:0${Math.floor(ms/1000)}.${Math.floor(ms%1000/100)}`;
  const s = Math.ceil(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}
function renderClock() {
  const box = document.getElementById('clocks');
  box.hidden = !clock; if (!clock) return;
  const running = history.length > 0 && !result(S);
  for (const c of ['w','b']) {
    const el = document.getElementById('clk-' + c);
    el.querySelector('.ctime').textContent = fmt(clock[c]);
    el.classList.toggle('on', running && S.turn === c);
    el.classList.toggle('low', clock[c] < 20000);
    el.classList.toggle('flag', clock.flag === c);
  }
}
// The clock starts after White's first move and only runs while Gambit is open on screen.
setInterval(() => {
  const now = performance.now(), dt = now - lastTick; lastTick = now;
  if (!clock || !history.length || result(S) || document.hidden) return;
  clock[S.turn] -= dt;
  if (clock[S.turn] <= 0) {
    clock[S.turn] = 0; clock.flag = S.turn; selected = null; legalForSel = [];
    save(); render(); setTimeout(celebrate, 200); return;
  }
  renderClock();
  if (Math.floor(clock[S.turn]/1000) % 5 === 0) save();
}, 100);
document.addEventListener('visibilitychange', () => { lastTick = performance.now(); save(); });
render();

// ---- play against the computer (Stockfish engine in engine/) ----
function cpuTurn() { return mode.cpu && S.turn !== mode.human; }
function undoPlies() { return mode.cpu ? (S.turn === mode.human ? 2 : 1) : 1; }
function fen(s) {
  const rows = s.board.map(row => { let o = '', e = 0; for (const p of row) { if (!p) { e++; continue; } if (e) { o += e; e = 0; } o += p.c === 'w' ? p.t.toUpperCase() : p.t; } return o + (e || ''); });
  const cs = (s.castle.wK ? 'K' : '') + (s.castle.wQ ? 'Q' : '') + (s.castle.bK ? 'k' : '') + (s.castle.bQ ? 'q' : '') || '-';
  const ep = s.ep ? 'abcdefgh'[s.ep[1]] + (8 - s.ep[0]) : '-';
  return `${rows.join('/')} ${s.turn} ${cs} ${ep} ${s.half} ${Math.floor(history.length / 2) + 1}`;
}
function getEngine() {
  if (engine) return engine;
  engine = new Worker('engine/stockfish.js');
  engine.onmessage = e => {
    const line = typeof e.data === 'string' ? e.data : '';
    if (line.startsWith('info') && line.includes(' score ')) {
      const m = line.match(/score (cp|mate) (-?\d+)/), k = +(line.match(/ multipv (\d+)/) || [0, 1])[1], mv = (line.match(/ pv (\S+)/) || [])[1];
      if (!m) return;
      if (k === 1) lastScore = { [m[1]]: +m[2] };
      if (mv && !line.includes('bound')) pvLines[k] = { move: mv, cp: m[1] === 'cp' ? +m[2] : (+m[2] > 0 ? 30000 - +m[2] : -30000 - +m[2]) };
      return;
    }
    if (!line.startsWith('bestmove')) return;
    searching = false;
    if (ignoreBest > 0) { ignoreBest--; pvLines = {}; return; }   // the end of a search we cancelled
    const f = onBest; onBest = null; if (f) f(line.split(' ')[1]);
  };
  engine.postMessage('uci'); engine.postMessage('isready');
  return engine;
}
function cancelThink() {
  thinkId++; onBest = null; cpuBusy = false;
  if (searching && engine) { ignoreBest++; searching = false; engine.postMessage('stop'); }
}
function maybeCpu() {
  if (!cpuTurn() || result(S) || onBest || cpuBusy) return;
  const id = ++thinkId, L = LEVELS[mode.level - 1] || LEVELS[1], legal = allLegal(S), t0 = performance.now();
  cpuBusy = true;
  const play = m => setTimeout(() => {
    cpuBusy = false;
    if (id !== thinkId || !m || !cpuTurn() || result(S)) return;
    viewIdx = null; doMove(m);
  }, Math.max(0, wait - (performance.now() - t0)));
  // a quick reply looks natural early in the game and when there is only one move
  const [lo, hi] = L.think, early = history.length < 4 || legal.length === 1;
  const wait = (early ? lo * .6 : lo + Math.random() * (hi - lo)) * 1000;
  if (L.simple) return play(simpleMove(legal, L.simple));
  const eng = getEngine();
  onBest = uci => {
    if (!uci || uci === '(none)') { cpuBusy = false; return; }
    if (L.pv) uci = pickNearBest(L) || uci;
    const F = 'abcdefgh', fc = F.indexOf(uci[0]), fr = 8 - +uci[1], tc = F.indexOf(uci[2]), tr = 8 - +uci[3], pr = uci[4];
    play(legal.find(m => m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc && (!pr || m.promo === pr)) || legal[0]);
  };
  eng.postMessage(`setoption name Skill Level value ${L.skill ?? 20}`);
  eng.postMessage(`setoption name MultiPV value ${L.pv || 1}`);
  eng.postMessage('position fen ' + fen(S));
  searching = true; pvLines = {};
  eng.postMessage(L.depth ? `go depth ${L.depth}` : `go movetime ${L.ms}`);
}

// Medium/Hard: choose among the engine's top moves that are nearly as good as the best one
function pickNearBest(L) {
  const lines = Object.values(pvLines); if (!lines.length) return null;
  const best = Math.max(...lines.map(l => l.cp)), allow = Math.random() < L.slip[0] ? L.slip[1] : L.margin;
  const ok = lines.filter(l => best - l.cp <= allow);
  return ok[Math.floor(Math.random() * ok.length)].move;
}

// A weak, human-like player for the two lowest levels: it only looks one move ahead.
function capValue(s, m) { const p = m.enpassant ? { t:'p' } : s.board[m.tr][m.tc]; return (p ? VALUE[p.t] : 0) + (m.promo ? VALUE[m.promo] - 1 : 0); }
function simpleMove(legal, kind) {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  if (kind === 'beginner') {
    // mostly random; sometimes grabs the biggest piece it can take, without checking if it's protected
    if (Math.random() < .55) return pick(legal);
    const best = Math.max(...legal.map(m => capValue(S, m)));
    return best > 0 ? pick(legal.filter(m => capValue(S, m) === best)) : pick(legal);
  }
  // easy: takes free pieces and avoids losing its own most of the time, but misses a lot
  if (Math.random() < .25) return pick(legal);
  let bestScore = -1e9, bestMoves = [];
  for (const m of legal) {
    const after = apply(S, m), replies = allLegal(after);
    let score = capValue(S, m);
    if (!replies.length) score += inCheck(after, after.turn) ? 1000 : 0;
    else score -= Math.max(0, ...replies.map(r => capValue(after, r))) * .9;
    score += Math.random() * 1.2;
    if (score > bestScore + .01) { bestScore = score; bestMoves = [m]; } else if (Math.abs(score - bestScore) <= .01) bestMoves.push(m);
  }
  return pick(bestMoves);
}

// New game dialog: opponent, level and color
function chipRow(boxId, items, isOn, onPick) {
  const box = document.getElementById(boxId); box.innerHTML = '';
  for (const [val, html] of items) {
    const b = document.createElement('button'); b.className = 'timeopt' + (isOn(val) ? ' on' : ''); b.innerHTML = html;
    b.onclick = () => { onPick(val); renderSetup(); }; box.appendChild(b);
  }
}
function renderSetup() {
  chipRow('oppchoices', [[false, 'Two players'], [true, 'Computer']], v => pickSetup.cpu === v, v => pickSetup.cpu = v);
  document.getElementById('cpuopts').hidden = !pickSetup.cpu;
  chipRow('levelchoices', LEVELS.map((L, i) => [i + 1, `<b>${i + 1}</b><small>${L.name}</small>`]), v => pickSetup.level === v, v => pickSetup.level = v);
  chipRow('colorchoices', [['w', piece('w', 'k', 'ci') + 'White'], ['r', '<span class="ci rnd">?</span>Random'], ['b', piece('b', 'k', 'ci') + 'Black']], v => pickSetup.color === v, v => pickSetup.color = v);
}

// ---- hints: ask the engine for the best move and show it with a gold arrow ----
function drawHint() {
  const svg = document.getElementById('arrows'), line = document.getElementById('hintline');
  const b = boardEl.getBoundingClientRect(), pr = boardEl.parentElement.getBoundingClientRect(), bw = boardEl.clientWidth, bh = boardEl.clientHeight;
  // cover exactly the squares (inside the board's border)
  svg.style.left = (b.left - pr.left + boardEl.clientLeft) + 'px'; svg.style.top = (b.top - pr.top + boardEl.clientTop) + 'px';
  svg.style.width = bw + 'px'; svg.style.height = bh + 'px';
  const m = viewIdx == null ? hintMove : null;
  const X = c => (flipped ? 7 - c : c) + .5, Y = r => (flipped ? 7 - r : r) + .5;
  const list = [...marks.arrows]; if (pdraw?.to && (pdraw.to[0] !== pdraw.from[0] || pdraw.to[1] !== pdraw.from[1])) list.push({ from: pdraw.from, to: pdraw.to, ink, preview: true });
  document.getElementById('marks').innerHTML = list.map(a => {
    const x1 = X(a.from[1]), y1 = Y(a.from[0]), x2 = X(a.to[1]), y2 = Y(a.to[0]), len = Math.hypot(x2 - x1, y2 - y1), k = (len - .34) / len;
    return `<line x1="${x1}" y1="${y1}" x2="${x1 + (x2 - x1) * k}" y2="${y1 + (y2 - y1) * k}" stroke="${INKS[a.ink]}" stroke-width=".19" stroke-linecap="round" marker-end="url(#mk-${a.ink})" opacity="${a.preview ? .55 : .85}"/>`;
  }).join('');
  line.style.display = m ? '' : 'none';
  svg.style.display = m || list.length ? '' : 'none'; if (!m) return;
  const x1 = X(m.fc), y1 = Y(m.fr), x2 = X(m.tc), y2 = Y(m.tr), len = Math.hypot(x2 - x1, y2 - y1), k = (len - .32) / len;
  line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x1 + (x2 - x1) * k); line.setAttribute('y2', y1 + (y2 - y1) * k);
}
addEventListener('resize', drawHint);
document.getElementById('hint').onclick = () => {
  if (hintBusy || result(S) || cpuTurn()) return;
  if (hintMove) { hintMove = null; render(); return; }   // tap again to hide the hint
  hintBusy = true; render();
  const pos = S, legal = allLegal(S), eng = getEngine();
  onBest = uci => {
    hintBusy = false;
    if (pos !== S || !uci || uci === '(none)') { render(); return; }
    const F = 'abcdefgh', fc = F.indexOf(uci[0]), fr = 8 - +uci[1], tc = F.indexOf(uci[2]), tr = 8 - +uci[3], pr = uci[4];
    const m = legal.find(m => m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc && (!pr || m.promo === pr));
    if (m) hintMove = { ...m, san: san(S, m) };
    render();
  };
  eng.postMessage('setoption name Skill Level value 20'); eng.postMessage('setoption name MultiPV value 1');
  eng.postMessage('position fen ' + fen(S));
  searching = true; eng.postMessage('go movetime 800');
};

// ---- coach tools: draw arrows and colored squares, step through moves, explore lines ----
function penDown(e) {
  const sq = squareAt(e.clientX, e.clientY); if (!sq) return;
  pdraw = { from: sq, to: sq }; boardEl.setPointerCapture(e.pointerId);
}
function penMove(e) {
  const sq = squareAt(e.clientX, e.clientY); if (!sq || (sq[0] === pdraw.to[0] && sq[1] === pdraw.to[1])) return;
  pdraw.to = sq; drawHint();
}
function penUp(e) {
  const { from } = pdraw, to = squareAt(e.clientX, e.clientY) || pdraw.to; pdraw = null;
  if (from[0] === to[0] && from[1] === to[1]) {
    // tap = color the square; tap again with the same color to remove it
    const k = from.join(','); if (marks.boxes[k] === ink) delete marks.boxes[k]; else marks.boxes[k] = ink;
  } else {
    // drag = arrow; drawing the same arrow again in the same color removes it
    const i = marks.arrows.findIndex(a => a.from.join() === from.join() && a.to.join() === to.join()), same = i >= 0 && marks.arrows[i].ink === ink;
    if (i >= 0) marks.arrows.splice(i, 1);
    if (!same) marks.arrows.push({ from, to, ink });
  }
  render();
}
function step(where) {
  if (reviewing) return;
  const last = history.length - 1, cur = viewIdx ?? last;
  const to = where === 'first' ? -1 : where === 'prev' ? cur - 1 : where === 'next' ? cur + 1 : last;
  if (to < -1 || to > last) return;
  viewIdx = to >= last ? null : to; selected = null; legalForSel = []; render();
}
function startExplore() {
  if (ex || reviewing) return;
  cancelThink(); hintMove = null; hintBusy = false;
  const all = [...history, S], at = viewIdx == null ? all.length - 1 : viewIdx + 1;
  const keep = marks.pos === all[at] ? { arrows: marks.arrows, boxes: marks.boxes } : null;
  ex = { S, history, clock, mode, flipped, review };
  // a copy of the game up to the move shown; the real game waits (its clock stops) until you come back
  const copy = JSON.parse(JSON.stringify(all.slice(0, at + 1)));
  S = copy.pop(); history = copy; clock = null; mode = { cpu:false }; review = null; viewIdx = null; selected = null; legalForSel = [];
  if (keep) Object.assign(marks, keep, { pos: S });   // keep what you drew on the board
  render();
}
function endExplore() {
  if (!ex) return;
  cancelThink(); hintMove = null; hintBusy = false;
  ({ S, history, clock, mode, flipped, review } = ex); ex = null; viewIdx = null; selected = null; legalForSel = [];
  lastTick = performance.now(); render(); setTimeout(maybeCpu, 300);
}
function renderCoach() {
  document.getElementById('pen').classList.toggle('on', pen);
  document.querySelector('.coach-card').classList.toggle('drawing', pen);
  document.querySelectorAll('#inks button').forEach(b => b.classList.toggle('on', b.dataset.ink === ink));
  document.getElementById('clearmarks').disabled = !marks.arrows.length && !Object.keys(marks.boxes).length;
  const xb = document.getElementById('explore');
  xb.classList.toggle('on', !!ex); xb.disabled = !!reviewing;
  xb.querySelector('span').textContent = ex ? 'Back to game' : 'Explore';
  const last = history.length - 1, cur = viewIdx ?? last;
  document.getElementById('navfirst').disabled = document.getElementById('navprev').disabled = cur < 0 || !!reviewing;
  document.getElementById('navnext').disabled = document.getElementById('navlast').disabled = viewIdx == null || !!reviewing;
  document.querySelector('.layout').classList.toggle('exploring', !!ex);
}
{ const box = document.getElementById('inks');
  for (const k of Object.keys(INKS)) {
    const b = document.createElement('button'); b.dataset.ink = k; b.style.setProperty('--ink', INKS[k]); b.setAttribute('aria-label', INK_NAMES[k]);
    b.onclick = () => { ink = k; try { localStorage.setItem('gambit-ink', k); } catch {} render(); };
    box.appendChild(b);
  }
  // one arrowhead per color
  document.querySelector('#arrows defs').insertAdjacentHTML('beforeend', Object.entries(INKS).map(([k, c]) =>
    `<marker id="mk-${k}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="2.4" markerHeight="2.4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join(''));
}
// Draw on shows the colors and Clear; Draw off (or Escape) hides them and wipes every drawing
function setPen(on) { pen = on; pdraw = null; if (!on) { marks.arrows = []; marks.boxes = {}; } render(); }
document.getElementById('pen').onclick = () => setPen(!pen);
document.getElementById('clearmarks').onclick = () => { marks.arrows = []; marks.boxes = {}; render(); };
document.getElementById('explore').onclick = () => ex ? endExplore() : startExplore();
document.getElementById('navfirst').onclick = () => step('first');
document.getElementById('navprev').onclick = () => step('prev');
document.getElementById('navnext').onclick = () => step('next');
document.getElementById('navlast').onclick = () => step('last');
addEventListener('keydown', e => {
  if (document.querySelector('.overlay.show')) return;
  if (e.key === 'Escape' && pen) return setPen(false);
  if (e.key === 'ArrowLeft') step('prev'); else if (e.key === 'ArrowRight') step('next');
  else if (e.key === 'ArrowUp' || e.key === 'Home') step('first'); else if (e.key === 'ArrowDown' || e.key === 'End') step('last');
});

// ---- game review: the engine checks every position and rates each move ----
const QSYM = { best:'★', good:'✓', inaccuracy:'?!', mistake:'?', blunder:'??' };
const QNAME = { best:'Best move', good:'Good move', inaccuracy:'Inaccuracy', mistake:'Mistake', blunder:'Blunder' };
const sanAt = j => document.querySelector(`#moves .mv[data-i="${j}"]`)?.firstChild?.textContent || '';
const winChance = cp => 1 / (1 + Math.pow(10, -cp / 400));   // 0..1 for White
function scoreToWhite(sc, turn) {
  let cp = sc.mate != null ? (sc.mate > 0 ? 10000 - sc.mate : -10000 - sc.mate) : sc.cp;
  if (sc.mate === 0) cp = -10000;
  return turn === 'w' ? cp : -cp;
}
function stopReview() { if (reviewing) cancelThink(); reviewing = false; review = null; }
function startReview() {
  if (reviewing || history.length < 1) return;
  cancelThink(); hintMove = null; viewIdx = null;
  const positions = [...history, S], evals = [], bests = [];
  reviewing = { done: 0, total: positions.length };
  const eng = getEngine(); eng.postMessage('setoption name Skill Level value 20'); eng.postMessage('setoption name MultiPV value 1');
  const next = i => {
    if (!reviewing) return;
    reviewing.done = i; render();
    if (i === positions.length) return finishReview(positions, evals, bests);
    const p = positions[i], legal = allLegal(p);
    if (!legal.length) { evals[i] = inCheck(p, p.turn) ? (p.turn === 'w' ? -10000 : 10000) : 0; bests[i] = null; return next(i + 1); }
    lastScore = null;
    onBest = uci => { evals[i] = lastScore ? scoreToWhite(lastScore, p.turn) : (evals[i - 1] || 0); bests[i] = uci; setTimeout(() => next(i + 1), 0); };
    eng.postMessage('position fen ' + fenOf(p, i)); searching = true; eng.postMessage('go movetime 250');
  };
  next(0);
}
function fenOf(p, plies) { const h = history; return fen(p).replace(/ \d+$/, ' ' + (Math.floor(plies / 2) + 1)); }
function finishReview(positions, evals, bests) {
  const cls = [], bestSan = [], counts = { w:{}, b:{} };
  for (let j = 0; j < positions.length - 1; j++) {
    const pre = positions[j], post = positions[j + 1], m = post.last, who = pre.turn;
    const uci = 'abcdefgh'[m.fc] + (8 - m.fr) + 'abcdefgh'[m.tc] + (8 - m.tr) + (m.promo || '');
    const before = winChance(evals[j]), after = winChance(evals[j + 1]);
    const loss = who === 'w' ? before - after : after - before;
    let c = uci === bests[j] ? 'best' : loss < .05 ? 'good' : loss < .10 ? 'inaccuracy' : loss < .15 ? 'mistake' : 'blunder';
    cls[j] = c; counts[who][c] = (counts[who][c] || 0) + 1;
    if (c !== 'best' && bests[j]) { const F = 'abcdefgh', b = bests[j];
      const bm = allLegal(pre).find(x => x.fc === F.indexOf(b[0]) && x.fr === 8 - +b[1] && x.tc === F.indexOf(b[2]) && x.tr === 8 - +b[3] && (!b[4] || x.promo === b[4]));
      bestSan[j] = bm ? san(pre, bm) : ''; }
  }
  reviewing = false; review = { evals, cls, bestSan, counts };
  viewIdx = positions.length > 1 ? 0 : null; render();
}
function renderReview() {
  const card = document.getElementById('reviewcard'), btn = document.getElementById('reviewbtn');
  btn.hidden = !!ex || !!review || !!reviewing || history.length < 2 || !(result(S) || (!mode.cpu && !clock));
  card.hidden = !review && !reviewing;
  if (!review) { document.getElementById('evalfill').style.width = '50%'; document.getElementById('evaltxt').textContent = reviewing ? 'Checking moves…' : ''; document.getElementById('revcounts').innerHTML = ''; return; }
  const idx = viewIdx == null ? review.evals.length - 1 : viewIdx + 1, cp = review.evals[idx] ?? 0;
  document.getElementById('evalfill').style.width = (winChance(Math.max(-1500, Math.min(1500, cp))) * 100).toFixed(1) + '%';
  document.getElementById('evaltxt').textContent = Math.abs(cp) >= 9000 ? (cp > 0 ? 'White is winning (checkmate)' : 'Black is winning (checkmate)') : Math.abs(cp) < 30 ? 'Even' : `${cp > 0 ? 'White' : 'Black'} is ahead by ${(Math.abs(cp) / 100).toFixed(1)}`;
  const row = side => `<div class="rrow"><b>${side === 'w' ? 'White' : 'Black'}</b>${['best','good','inaccuracy','mistake','blunder'].map(k => `<span class="q q-${k}" title="${QNAME[k]}">${QSYM[k]} ${review.counts[side][k] || 0}</span>`).join('')}</div>`;
  document.getElementById('revcounts').innerHTML = row('w') + row('b');
}
document.getElementById('reviewbtn').onclick = startReview;
document.getElementById('winreview').onclick = () => { document.getElementById('win').classList.remove('show'); startReview(); };
render();
