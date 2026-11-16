const VERSION = '0.5.0';
if (navigator.userAgent.includes('GlickApp')) document.getElementById('back').style.visibility = 'hidden';
document.getElementById('ver').textContent = VERSION;
{ const t = new URLSearchParams(location.search).get('theme'); if (t) document.body.dataset.theme = t; }

// Board: board[r][c], r=0 is rank 8. Piece = {t:'p|n|b|r|q|k', c:'w|b'} or null.
const piece = (c, t, cls='pc') => `<svg class="${cls}" viewBox="0 0 40 40"><use href="pieces.svg#${c}${t}"/></svg>`;
const VALUE = { p:1, n:3, b:3, r:5, q:9, k:0 };
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
  const name = s.turn==='w' ? 'White' : 'Black', other = s.turn==='w' ? 'Black' : 'White';
  if (allLegal(s).length === 0) return inCheck(s, s.turn) ? `Checkmate! ${other} wins` : 'Stalemate. It\'s a draw';
  if (s.half >= 100) return 'Draw by the 50-move rule';
  if ((s.positions[posKey(s)]||0) >= 3) return 'Draw by repetition';
  if (insufficient(s.board)) return 'Draw. Not enough pieces to checkmate';
  return null;
}

// ---------- UI ----------
const boardEl = document.getElementById('board'), statusEl = document.getElementById('status');
function newGame() { S = initial(); S.positions[posKey(S)] = 1; history = []; selected = null; legalForSel = []; save(); render(); }
function save() { try { localStorage.setItem('chess-game', JSON.stringify({S, history, flipped})); } catch {} }
function load() { try { const d = JSON.parse(localStorage.getItem('chess-game')); if (d && d.S) { S = d.S; history = d.history; flipped = d.flipped; return true; } } catch {} return false; }

function render() {
  boardEl.innerHTML = '';
  const over = result(S), chk = !over && inCheck(S, S.turn) ? kingPos(S.board, S.turn) : (over?.startsWith('Checkmate') ? kingPos(S.board, S.turn) : null);
  for (let i=0;i<8;i++) for (let j=0;j<8;j++) {
    const r = flipped ? 7-i : i, c = flipped ? 7-j : j;
    const d = document.createElement('div');
    d.className = 'sq ' + ((r+c)%2 ? 'dark' : 'light'); d.style.backgroundPosition = `${(c*37+r*11)%100}% ${(r*53+c*7)%100}%`;
    const L = S.last; if (L && ((L.fr===r&&L.fc===c)||(L.tr===r&&L.tc===c))) d.classList.add('last');
    if (selected && selected[0]===r && selected[1]===c) d.classList.add('sel');
    if (chk && chk[0]===r && chk[1]===c) d.classList.add('check');
    const mv = legalForSel.find(m => m.tr===r && m.tc===c);
    if (mv) d.classList.add(S.board[r][c] || mv.enpassant ? 'capture' : 'move');
    const p = S.board[r][c];
    if (p) d.innerHTML = piece(p.c, p.t);
    if (i===7) d.insertAdjacentHTML('beforeend', `<span class="coord f">${'abcdefgh'[c]}</span>`);
    if (j===0) d.insertAdjacentHTML('beforeend', `<span class="coord r">${8-r}</span>`);
    d.onclick = () => tap(r, c);
    boardEl.appendChild(d);
  }
  const mat = col => S.captured[col].reduce((a,t)=>a+VALUE[t],0);
  const bar = col => {
    const caps = S.captured[col].slice().sort((a,b)=>VALUE[b]-VALUE[a]).map(t => piece(opp(col), t, '')).join('');
    const diff = mat(col) - mat(opp(col));
    return `<div class="avatar ${col}">${piece(col,'k','')}</div><div class="pname">${col==='w'?'White':'Black'}</div><div class="caps">${caps}${diff>0?`<span class="adv">+${diff}</span>`:''}</div>`;
  };
  const top = document.getElementById('player-top'), bot = document.getElementById('player-bottom');
  const topCol = flipped ? 'w' : 'b', botCol = opp(topCol);
  top.innerHTML = bar(topCol); bot.innerHTML = bar(botCol);
  top.classList.toggle('active', !over && S.turn===topCol); bot.classList.toggle('active', !over && S.turn===botCol);
  document.getElementById('turn-dot').className = 'turn-dot ' + S.turn;
  statusEl.classList.toggle('over', !!over);
  statusEl.textContent = over || `${S.turn==='w' ? 'White' : 'Black'} to move${chk ? ' (check!)' : ''}`;
}

function tap(r, c) {
  if (result(S)) return;
  const mv = legalForSel.filter(m => m.tr===r && m.tc===c);
  if (mv.length) {
    if (mv.length > 1) return askPromo(mv);
    return doMove(mv[0]);
  }
  const p = S.board[r][c];
  if (p && p.c === S.turn && !(selected && selected[0]===r && selected[1]===c)) { selected = [r,c]; legalForSel = legalMoves(S, r, c); }
  else { selected = null; legalForSel = []; }
  render();
}
function doMove(m) {
  history.push(S); S = apply(S, m);
  const k = posKey(S); S.positions[k] = (S.positions[k]||0) + 1;
  selected = null; legalForSel = []; save(); render();
}
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
document.getElementById('undo').onclick = () => { if (history.length) { S = history.pop(); selected = null; legalForSel = []; save(); render(); } };
document.getElementById('flip').onclick = () => { flipped = !flipped; save(); render(); };
document.getElementById('newgame').onclick = () => document.getElementById('confirm').classList.add('show');
document.getElementById('yes').onclick = () => { document.getElementById('confirm').classList.remove('show'); newGame(); };
document.getElementById('no').onclick = () => document.getElementById('confirm').classList.remove('show');

if (!load()) newGame(); else render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../../sw.js', {scope:'../../'}).catch(()=>{});
