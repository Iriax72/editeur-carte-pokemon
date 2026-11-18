'use strict';

/* ============ Données ============ */
const W = 630, H = 880, S = 2;
const FONT = '"Gill Sans","Gill Sans MT","Trebuchet MS",Verdana,sans-serif';
const ASSET_DIR = 'assets/types/';
const TYPES = { // id : [libellé, couleur, lettre de secours]
  grass: ['Plante', '#79c957', 'P'], fire: ['Feu', '#f07a3b', 'F'], water: ['Eau', '#4aa8ea', 'E'],
  lightning: ['Électrique', '#f8d33a', 'É'], psychic: ['Psy', '#b765cc', 'Ps'], fighting: ['Combat', '#c46a3e', 'C'],
  darkness: ['Obscurité', '#4b4a6e', 'O'], metal: ['Métal', '#9ba8b8', 'M'], fairy: ['Fée', '#f2a6cc', 'Fé'],
  dragon: ['Dragon', '#c9a53a', 'D'], colorless: ['Incolore', '#d9d4c7', 'I']
};
const KEY = 'tcg-card-v1';
const blankAtk = () => ({ cost: [], name: '', damage: '', text: '' });
const DEFAULT = () => ({
  kind: 'pokemon', type: 'fire', stage: 'De base', name: 'Salamèche', hp: '70', subtype: 'Objet',
  attacks: [
    { cost: ['fire'], name: 'Flammèche', damage: '30', text: 'Défaussez une Énergie de ce Pokémon.' },
    blankAtk(), blankAtk()
  ],
  weak: { type: 'water', value: '×2' }, resist: { type: '', value: '' }, retreat: 1,
  text: '', flavor: 'La flamme au bout de sa queue indique sa santé.',
  illustrator: '', number: '001/100', set: '', rarity: '●',
  img: null, zoom: 1, ox: 0, oy: 0
});

let state = load();
let illu = null; // objet Image de l'illustration
const $ = id => document.getElementById(id);
const cv = $('card'), ctx = cv.getContext('2d');

/* ============ Stockage (durée de l'onglet) ============ */
function load() {
  try { const s = JSON.parse(sessionStorage.getItem(KEY)); if (s) return Object.assign(DEFAULT(), s); } catch (e) {}
  return DEFAULT();
}
function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('Image trop lourde pour être mémorisée après un rafraîchissement.'); } }

/* ============ Symboles ============ */
const symImgs = {};
Object.keys(TYPES).forEach(t => {
  const im = new Image(); im.onload = () => { im.ok = true; redraw(); }; im.src = ASSET_DIR + t + '.svg'; symImgs[t] = im;
});
function sym(c, t, x, y, s, assets = true) {
  const im = symImgs[t];
  if (assets && im && im.ok) { c.drawImage(im, x, y, s, s); return; }
  c.save(); c.beginPath(); c.arc(x + s / 2, y + s / 2, s / 2, 0, 7); c.fillStyle = TYPES[t][1]; c.fill();
  c.lineWidth = s / 14; c.strokeStyle = 'rgba(0,0,0,.45)'; c.stroke();
  c.fillStyle = lum(TYPES[t][1]) > .6 ? '#222' : '#fff'; c.font = `bold ${s * .5}px ${FONT}`;
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(TYPES[t][2], x + s / 2, y + s / 2 + 1); c.restore();
}

/* ============ Utilitaires de dessin ============ */
function lum(h) { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
function mix(h, to, a) { const n = parseInt(h.slice(1), 16); const f = v => Math.round(v + (to - v) * a);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function lin(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
function wrap(c, t, w) {
  const out = [];
  for (const p of String(t).split('\n')) { let l = '';
    for (const wd of p.split(' ')) { const n = l ? l + ' ' + wd : wd; if (c.measureText(n).width > w && l) { out.push(l); l = wd; } else l = n; }
    out.push(l); }
  return out;
}
function fit(c, txt, size, maxW, style = 'bold') { do { c.font = `${style} ${size}px ${FONT}`; size--; } while (c.measureText(txt).width > maxW && size > 14); }

/* ============ Rendu de la carte ============ */
function draw(o = {}) {
  const assets = o.assets !== false, c = ctx, k = state.kind;
  c.setTransform(S, 0, 0, S, 0, 0); c.clearRect(0, 0, W, H); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  if (o.bg) { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); }
  const base = k === 'trainer' ? '#e8e2d2' : TYPES[state.type][1];
  const ink = lum(base) > .6 ? '#1b1b24' : '#ffffff';
  c.save(); rr(c, 0, 0, W, H, 34); c.clip();
  c.fillStyle = lin(c, 0, 0, W, H, ['#fbeb8a', '#c9a227', '#f6e07a', '#b58a1c', '#f3dc7a']); c.fillRect(0, 0, W, H);
  rr(c, 22, 22, W - 44, H - 44, 18); c.fillStyle = lin(c, 0, 0, W, H, [mix(base, 255, .35), base, mix(base, 0, .18)]); c.fill();
  c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke();

  /* En-tête */
  c.fillStyle = ink; c.font = `italic bold 17px ${FONT}`;
  c.fillText(k === 'pokemon' ? state.stage : k === 'trainer' ? 'Dresseur · ' + state.subtype : 'Énergie', 48, 58);
  const hasType = k !== 'trainer', hp = k === 'pokemon' && state.hp;
  fit(c, state.name || 'Nom', 38, hasType ? (hp ? 340 : 440) : 530); c.fillText(state.name || 'Nom', 48, 98);
  if (hasType) sym(c, state.type, 546, 56, 38, assets);
  if (hp) { c.textAlign = 'right'; c.font = `bold 38px ${FONT}`; c.fillText(state.hp, 530, 98);
    c.font = `bold 17px ${FONT}`; c.fillText('PV', 530 - c.measureText(state.hp).width - 0, 58); c.font = `bold 38px ${FONT}`;
    c.textAlign = 'left'; }

  /* Illustration */
  const fx = 46, fy = 112, fw = 538, fh = 290;
  rr(c, fx, fy, fw, fh, 8); c.fillStyle = lin(c, fx, fy, fx + fw, fy + fh, ['#f4f6fa', '#9aa3b2', '#eef1f6', '#7d8696', '#f4f6fa']); c.fill();
  c.save(); rr(c, fx + 8, fy + 8, fw - 16, fh - 16, 4); c.clip();
  const ix = fx + 8, iy = fy + 8, iw = fw - 16, ih = fh - 16;
  if (illu && illu.complete && illu.naturalWidth) {
    const sc = Math.max(iw / illu.naturalWidth, ih / illu.naturalHeight) * state.zoom;
    const dw = illu.naturalWidth * sc, dh = illu.naturalHeight * sc;
    c.drawImage(illu, ix + (iw - dw) / 2 + (state.ox / 100) * (dw - iw) / 2, iy + (ih - dh) / 2 + (state.oy / 100) * (dh - ih) / 2, dw, dh);
  } else {
    c.fillStyle = lin(c, ix, iy, ix + iw, iy + ih, [mix(base, 255, .6), mix(base, 255, .2), mix(base, 0, .1)]); c.fillRect(ix, iy, iw, ih);
    if (k === 'energy') sym(c, state.type, ix + iw / 2 - 100, iy + ih / 2 - 100, 200, assets);
    else { c.fillStyle = 'rgba(0,0,0,.28)'; c.font = `italic 20px ${FONT}`; c.textAlign = 'center'; c.fillText('Illustration', ix + iw / 2, iy + ih / 2 + 7); c.textAlign = 'left'; }
  }
  c.restore();

  /* Corps */
  const panel = (x, y, w, h) => { rr(c, x, y, w, h, 10); c.fillStyle = k === 'trainer' ? 'rgba(255,255,255,.6)' : mix(base, 255, .72); c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(0,0,0,.18)'; c.stroke(); };
  c.fillStyle = '#16161e';
  if (k === 'pokemon') {
    panel(46, 416, 538, 272);
    const atks = state.attacks.filter(a => a.name || a.text);
    const maxCost = Math.max(1, ...atks.map(a => a.cost.length)), nx = 58 + maxCost * 29 + 8;
    c.font = `16px ${FONT}`;
    const blocks = atks.map(a => ({ a, lines: a.text ? wrap(c, a.text, 506) : [] }));
    const total = blocks.reduce((s, b) => s + 38 + b.lines.length * 20, 0), gap = Math.max(4, (272 - total) / (blocks.length + 1));
    let y = 416 + gap;
    blocks.forEach((b, i) => {
      if (i) { c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(66, y - gap / 2, 498, 1.5); }
      b.a.cost.slice(0, 5).forEach((t, j) => sym(c, t, 58 + j * 29, y + 2, 26, assets));
      c.fillStyle = '#16161e'; fit(c, b.a.name, 26, 530 - nx - 90); c.fillText(b.a.name, nx, y + 25);
      if (b.a.damage) { c.textAlign = 'right'; c.font = `bold 32px ${FONT}`; c.fillText(b.a.damage, 570, y + 28); c.textAlign = 'left'; }
      c.font = `16px ${FONT}`; b.lines.forEach((l, j) => c.fillText(l, 60, y + 52 + j * 20));
      y += 38 + b.lines.length * 20 + gap;
    });
    panel(46, 698, 538, 52);
    [['faiblesse', 'weak', 148], ['résistance', 'resist', 315], ['retraite', null, 482]].forEach(([lab, key, cx]) => {
      c.fillStyle = '#3b3b4a'; c.font = `bold 13px ${FONT}`; c.textAlign = 'center'; c.fillText(lab, cx, 714);
      c.fillStyle = '#16161e'; c.font = `bold 20px ${FONT}`;
      if (key) { const d = state[key]; if (d.type) { const w = c.measureText(d.value).width; sym(c, d.type, cx - (22 + w) / 2, 719, 22, assets); c.textAlign = 'left'; c.fillText(d.value, cx - (22 + w) / 2 + 26, 738); } else c.fillText('—', cx, 738); }
      else if (+state.retreat) { const n = +state.retreat, x0 = cx - (n * 24) / 2; for (let i = 0; i < n; i++) sym(c, 'colorless', x0 + i * 24, 719, 22, assets); }
      else c.fillText('—', cx, 738);
      c.textAlign = 'left';
    });
  } else {
    panel(46, 416, 538, 328);
    c.fillStyle = '#16161e'; c.font = `20px ${FONT}`;
    const ls = wrap(c, state.text, 500), y0 = 416 + 164 - (ls.length * 28) / 2 + 20;
    c.textAlign = 'center'; ls.forEach((l, i) => c.fillText(l, 315, y0 + i * 28)); c.textAlign = 'left';
  }

  /* Ambiance et pied de carte */
  panel(46, 758, 538, 64);
  c.fillStyle = '#2a2a38'; c.font = `italic 15px ${FONT}`;
  const fl = wrap(c, state.flavor, 512).slice(0, 3), fy0 = 790 - (fl.length - 1) * 9 + 1;
  c.textAlign = 'center'; fl.forEach((l, i) => c.fillText(l, 315, fy0 + i * 18)); c.textAlign = 'left';
  c.fillStyle = ink; c.font = `bold 14px ${FONT}`;
  if (state.illustrator) c.fillText('Illus. ' + state.illustrator, 48, 846);
  c.textAlign = 'right'; c.fillText([state.set, state.number, state.rarity].filter(Boolean).join('  '), 582, 846);
  c.restore();
}
let queued = false;
function redraw() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; draw(); }); }

/* ============ Formulaire ============ */
const getP = (p) => p.split('.').reduce((o, k) => o?.[k], state);
function setP(p, v) { const ks = p.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], state)[last] = v; }
function tpBtn(t, cls, pick) {
  return `<button type="button" class="tp ${cls}" style="--c:${TYPES[t][1]}" data-pick="${pick}" data-t="${t}" title="${TYPES[t][0]}" aria-label="${TYPES[t][0]}">` +
    `<img src="${ASSET_DIR}${t}.svg" alt="" onerror="this.remove()" onload="this.nextElementSibling.remove()"><span>${TYPES[t][2]}</span></button>`;
}
function buildStatic() {
  $('typePicker').innerHTML = Object.keys(TYPES).map(t => tpBtn(t, '', 'type')).join('');
  document.querySelectorAll('.typesel').forEach(s => s.innerHTML = '<option value="">Aucune</option>' + Object.entries(TYPES).map(([id, v]) => `<option value="${id}">${v[0]}</option>`).join(''));
  $('attacks').innerHTML = [0, 1, 2].map(i => `<div class="atk"><h3>Attaque ${i + 1}</h3>
    <div class="cost" id="cost${i}"></div><div class="palette">${Object.keys(TYPES).map(t => tpBtn(t, 'sm', 'add:' + i)).join('')}</div>
    <div class="row"><label>Nom<input data-k="attacks.${i}.name" maxlength="28"></label><label>Dégâts<input data-k="attacks.${i}.damage" maxlength="6"></label></div>
    <label>Description<textarea data-k="attacks.${i}.text" rows="2" maxlength="200"></textarea></label></div>`).join('');
}
function syncForm() {
  document.body.dataset.kind = state.kind;
  document.querySelectorAll('[data-k]').forEach(e => { e.value = getP(e.dataset.k) ?? ''; });
  document.querySelectorAll('#typePicker .tp').forEach(b => b.classList.toggle('on', b.dataset.t === state.type));
  state.attacks.forEach((a, i) => {
    $('cost' + i).innerHTML = a.cost.length ? a.cost.map((t, j) => tpBtn(t, 'sm', `rm:${i}:${j}`)).join('') : '<em>Aucune énergie requise</em>';
  });
  document.documentElement.style.setProperty('--accent', state.kind === 'trainer' ? '#d9d2bf' : TYPES[state.type][1]);
}
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 4200); }

document.addEventListener('input', e => {
  const p = e.target.dataset?.k; if (!p) return;
  setP(p, e.target.type === 'range' ? +e.target.value : e.target.value);
  if (p === 'kind') syncForm(); save(); redraw();
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pick]'); if (!b) return;
  const [a, i, j] = b.dataset.pick.split(':');
  if (a === 'type') state.type = b.dataset.t;
  if (a === 'add' && state.attacks[i].cost.length < 5) state.attacks[i].cost.push(b.dataset.t);
  if (a === 'rm') state.attacks[i].cost.splice(+j, 1);
  syncForm(); save(); redraw();
});

/* ============ Illustration ============ */
function setIllu(src) { if (!src) { illu = null; return; } illu = new Image(); illu.onload = redraw; illu.src = src; }
$('file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const m = Math.min(1, 1100 / Math.max(im.naturalWidth, im.naturalHeight)), t = document.createElement('canvas');
    t.width = im.naturalWidth * m; t.height = im.naturalHeight * m; t.getContext('2d').drawImage(im, 0, 0, t.width, t.height);
    state.img = t.toDataURL('image/jpeg', .88); state.zoom = 1; state.ox = state.oy = 0;
    setIllu(state.img); syncForm(); save(); redraw(); };
    im.onerror = () => toast('Ce fichier n\'est pas une image lisible.'); im.src = r.result; };
  r.readAsDataURL(f);
});
$('rmImg').onclick = () => { state.img = null; illu = null; $('file').value = ''; save(); redraw(); };
$('reset').onclick = () => { if (confirm('Effacer la carte actuelle et recommencer ?')) { state = DEFAULT(); illu = null; syncForm(); save(); redraw(); } };

/* ============ Export ============ */
$('dl').onclick = () => {
  const f = $('fmt').value, mime = 'image/' + f;
  const grab = o => { draw(o); return new Promise((ok, ko) => { try { cv.toBlob(b => b ? ok(b) : ko(new Error('export')), mime, .95); } catch (e) { ko(e); } }); };
  grab({ assets: true, bg: f === 'jpeg' })
    .catch(() => { toast('Symboles de secours utilisés : ouvrez le site via un serveur local pour exporter vos propres symboles.'); return grab({ assets: false, bg: f === 'jpeg' }); })
    .then(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b);
      a.download = ((state.name || 'carte').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'carte') + '.' + (f === 'jpeg' ? 'jpg' : f);
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); })
    .catch(() => toast('L\'export a échoué. Essayez un autre format.'))
    .finally(() => draw());
};

/* ============ Démarrage ============ */
buildStatic(); setIllu(state.img); syncForm(); draw();
