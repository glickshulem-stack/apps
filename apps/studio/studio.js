// Aurum Studio: open a video, choose the part to keep, save it as a video or as an MP3.
// The screen runs here (web, updates without reinstall); the tablet app does the saving through window.Studio.
const VERSION = '0.2.0';
const FOLDER = 'Aurum Studio';
const $ = id => document.getElementById(id);
const native = typeof window.Studio !== 'undefined';
const video = $('video'), tl = $('timeline'), canvas = $('thumbs');
let file = null, dur = 0, a = 0, b = 0, url = null, poll = null, thumbJob = 0;

$('ver').textContent = VERSION;

const fmt = s => {
  if (!isFinite(s)) s = 0;
  const m = Math.floor(s / 60), r = s - m * 60;
  const h = Math.floor(m / 60);
  const ss = r.toFixed(1).padStart(4, '0');
  return h ? `${h}:${String(m % 60).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

function toast(t, ms = 3200) {
  const el = $('toast'); el.textContent = t; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, ms);
}

// ---------- opening a video ----------
document.querySelectorAll('[data-open]').forEach(btn => btn.onclick = () => { $('file').value = ''; $('file').click(); });
$('file').onchange = () => {
  const f = $('file').files[0];
  if (!f) return;
  file = f;
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(f);
  video.src = url;
  $('fname').textContent = f.name;
  $('empty').hidden = true;
};
video.onloadedmetadata = () => {
  dur = video.duration || 0;
  a = 0; b = dur;
  $('total').textContent = fmt(dur);
  ['transport', 'timeline', 'partcard', 'savecard'].forEach(id => $(id).hidden = false);
  draw(); drawThumbs();
};
video.onerror = () => { if (video.src) toast('This video can’t be played here. Try another file.'); };

// ---------- the part to keep ----------
function draw() {
  const w = tl.clientWidth;
  const x = t => (dur ? t / dur : 0) * w;
  $('sel').style.left = x(a) + 'px'; $('sel').style.width = (x(b) - x(a)) + 'px';
  $('shadeL').style.width = x(a) + 'px'; $('shadeR').style.width = (w - x(b)) + 'px';
  $('playhead').style.left = x(video.currentTime) + 'px';
  $('now').textContent = fmt(video.currentTime);
  $('vstart').textContent = fmt(a); $('vend').textContent = fmt(b); $('vlen').textContent = fmt(b - a);
}
const MIN = 0.5; // shortest part, seconds
function setA(t) { a = Math.max(0, Math.min(t, b - MIN)); draw(); }
function setB(t) { b = Math.min(dur, Math.max(t, a + MIN)); draw(); }
$('setstart').onclick = () => setA(video.currentTime);
$('setend').onclick = () => setB(video.currentTime);
$('resetpart').onclick = () => { a = 0; b = dur; draw(); };

const timeAt = e => { const r = tl.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur; };
let drag = null;
tl.addEventListener('pointerdown', e => {
  if (!dur) return;
  tl.setPointerCapture(e.pointerId);
  drag = e.target.closest('#hl') ? 'a' : e.target.closest('#hr') ? 'b' : 'seek';
  if (drag !== 'seek') video.pause();
  move(e);
});
tl.addEventListener('pointermove', e => { if (drag) move(e); });
const end = () => { drag = null; };
tl.addEventListener('pointerup', end); tl.addEventListener('pointercancel', end);
function move(e) {
  const t = timeAt(e);
  if (drag === 'a') { setA(t); video.currentTime = a; }
  else if (drag === 'b') { setB(t); video.currentTime = b; }
  else { video.currentTime = t; draw(); }
}

// ---------- playing (plays the chosen part) ----------
const ICON_PLAY = '<path d="M8 5l11 7-11 7z"/>', ICON_PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
$('play').onclick = () => {
  if (!video.paused) { video.pause(); return; }
  if (video.currentTime < a || video.currentTime >= b - 0.05) video.currentTime = a;
  video.play();
};
video.onplay = () => { $('playicon').innerHTML = ICON_PAUSE; tick(); };
video.onpause = () => { $('playicon').innerHTML = ICON_PLAY; draw(); };
video.ontimeupdate = draw;
function tick() {
  if (video.paused) return;
  if (video.currentTime >= b) { video.pause(); video.currentTime = b; }
  draw(); requestAnimationFrame(tick);
}
window.addEventListener('resize', () => { draw(); drawThumbs(); });

// ---------- little pictures along the timeline ----------
async function drawThumbs() {
  const job = ++thumbJob;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width = Math.round(tl.clientWidth * dpr), H = canvas.height = Math.round(tl.clientHeight * dpr);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, W, H);
  if (!url || !dur) return;
  const v = document.createElement('video');
  v.muted = true; v.preload = 'auto'; v.src = url;
  await new Promise(r => { v.onloadeddata = r; v.onerror = r; });
  if (!v.videoWidth) return;
  const tw = H * v.videoWidth / v.videoHeight, n = Math.max(1, Math.ceil(W / tw));
  for (let i = 0; i < n; i++) {
    if (job !== thumbJob) return;
    v.currentTime = Math.min(dur - 0.05, (i + 0.5) * dur / n);
    await new Promise(r => { const done = () => { v.removeEventListener('seeked', done); r(); }; v.addEventListener('seeked', done); setTimeout(done, 1500); });
    try { ctx.drawImage(v, i * tw, 0, tw, H); } catch { }
  }
  v.removeAttribute('src'); v.load();
}

// ---------- saving ----------
function base() { return (file ? file.name.replace(/\.[^.]+$/, '') : 'video') + (a > 0.05 || b < dur - 0.05 ? ' (cut)' : ''); }
function save(kind) {
  if (!file) return;
  if (!native) { toast('Saving works in the Aurum Studio app on your tablet.'); return; }
  video.pause();
  const r = Studio.export(JSON.stringify({ kind, start: Math.round(a * 1000), end: Math.round(b * 1000), name: base(), folder: FOLDER }));
  if (r !== 'ok') { toast(r.replace(/^error:\s*/, '')); return; }
  $('jtitle').textContent = kind === 'mp3' ? 'Making your MP3' : 'Making your video';
  $('jmsg').textContent = 'Starting…'; $('jbar').style.width = '0';
  $('jworking').hidden = false; $('jdone').hidden = true; $('job').hidden = false;
  clearInterval(poll); poll = setInterval(watch, 400);
}
function watch() {
  let j; try { j = JSON.parse(Studio.job()); } catch { return; }
  $('jbar').style.width = j.pct + '%';
  if (j.state === 'working') { $('jmsg').textContent = `${j.msg} ${j.pct}%`; return; }
  clearInterval(poll);
  if (j.state === 'done') {
    $('jtitle').textContent = 'Saved';
    $('jmsg').innerHTML = '';
    $('jmsg').append('Your file ', Object.assign(document.createElement('b'), { textContent: j.name }), ' is in ',
      Object.assign(document.createElement('b'), { textContent: j.folder }), ' on your tablet.');
    $('jworking').hidden = true; $('jdone').hidden = false;
  } else {
    $('job').hidden = true;
    if (j.state === 'error') toast(j.msg, 6000);
  }
}
$('savevideo').onclick = () => save('video');
$('savemp3').onclick = () => save('mp3');
$('jcancel').onclick = () => { if (native) Studio.cancel(); };
$('jopen').onclick = () => Studio.openResult();
$('jshare').onclick = () => Studio.shareResult();
$('jclose').onclick = () => { $('job').hidden = true; };
