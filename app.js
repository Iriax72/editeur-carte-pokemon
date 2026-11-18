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
  illustrator: '', number: '4/149', legal: '', rarity: '●',
  info: 'N° 004  Pokémon Lézard  Taille : 0,6 m  Poids : 8,5 kg',
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

/* ============ Rendu de la carte (modèle Soleil et Lune) ============ */
const logo = new Image();
logo.onload = () => { logo.ok = true; redraw(); };
logo.onerror = () => { if (!logo.png) { logo.png = 1; logo.src = 'assets/set/logo.png'; } };
logo.src = 'assets/set/logo.svg';

function pill(c, x, y, w, h, r) {
  rr(c, x, y, w, h, r); c.fillStyle = lin(c, 0, y, 0, y + h, ['#fbfcfd', '#c6cad1', '#e2e5e9']); c.fill();
  c.lineWidth = 1.2; c.strokeStyle = '#767c85'; c.stroke();
}
function draw(o = {}) {
  const assets = o.assets !== false, c = ctx, k = state.kind;
  c.setTransform(S, 0, 0, S, 0, 0); c.clearRect(0, 0, W, H); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  if (o.bg) { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); }
  const base = k === 'trainer' ? '#d9d6ca' : TYPES[state.type][1];
  const ink = lum(base) < .42 ? '#f4f4f8' : '#1a1a1a';
  c.save(); rr(c, 0, 0, W, H, 30); c.clip();
  c.fillStyle = lin(c, 0, 0, 0, H, ['#f9ea55', '#f1d92f', '#f6e445']); c.fillRect(0, 0, W, H);   // bordure jaune
  c.save(); rr(c, 27, 27, W - 54, H - 54, 14); c.clip();                                           // fond du type
  const g = c.createRadialGradient(W * .55, H * .62, 40, W * .55, H * .62, 640);
  g.addColorStop(0, mix(base, 255, .3)); g.addColorStop(.55, base); g.addColorStop(1, mix(base, 0, .2));
  c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  rr(c, 27, 27, W - 54, H - 54, 14); c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,.4)'; c.stroke();

  /* En-tête : pastille de stade, nom, PV, type */
  const label = k === 'pokemon' ? state.stage.toUpperCase() : k === 'trainer' ? state.subtype.toUpperCase() : 'ÉNERGIE';
  c.font = `italic bold 15px ${FONT}`; const bw = Math.max(80, c.measureText(label).width + 28);
  pill(c, 30, 42, bw, 27, 5);
  c.fillStyle = '#2a2a2a'; c.textAlign = 'center'; c.fillText(label, 30 + bw / 2, 61); c.textAlign = 'left';
  const nx0 = 30 + bw + 9, hasType = k !== 'trainer', hp = k === 'pokemon' && state.hp;
  fit(c, state.name || 'Nom', 35, (hp ? 468 : hasType ? 548 : 596) - nx0);
  c.fillStyle = ink; c.fillText(state.name || 'Nom', nx0, 67);
  if (hp) {
    c.textAlign = 'right'; c.font = `bold 37px ${FONT}`; c.fillText(state.hp, 548, 70);
    const w = c.measureText(state.hp).width; c.font = `bold 14px ${FONT}`; c.fillText('PV', 544 - w, 70); c.textAlign = 'left';
  }
  if (hasType) sym(c, state.type, 556, 37, 38, assets);

  /* Cadre argenté de l'illustration (+ bandeau d'info pour les Pokémon) */
  const fx = 47, fy = 82, fw = 537, fh = 361, pk = k === 'pokemon';
  rr(c, fx, fy, fw, fh, 6); c.fillStyle = lin(c, fx, fy, fx + fw, fy + fh, ['#f6f7f9', '#a9aeb6', '#eceef1', '#9097a0', '#f4f5f7']); c.fill();
  c.lineWidth = 1.2; c.strokeStyle = '#6c727a'; c.stroke();
  const ix = fx + 5, iy = fy + 5, iw = fw - 10, ih = pk ? 330 : 351;
  c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
  if (illu && illu.complete && illu.naturalWidth) {
    const sc = Math.max(iw / illu.naturalWidth, ih / illu.naturalHeight) * state.zoom;
    const dw = illu.naturalWidth * sc, dh = illu.naturalHeight * sc;
    c.drawImage(illu, ix + (iw - dw) / 2 + (state.ox / 100) * (dw - iw) / 2, iy + (ih - dh) / 2 + (state.oy / 100) * (dh - ih) / 2, dw, dh);
  } else {
    c.fillStyle = lin(c, ix, iy, ix + iw, iy + ih, [mix(base, 255, .6), mix(base, 255, .2), mix(base, 0, .1)]); c.fillRect(ix, iy, iw, ih);
    if (k === 'energy') sym(c, state.type, ix + iw / 2 - 100, iy + ih / 2 - 100, 200, assets);
    else { c.fillStyle = 'rgba(0,0,0,.28)'; c.font = `italic 20px ${FONT}`; c.textAlign = 'center'; c.fillText('Illustration', ix + iw / 2, iy + ih / 2 + 7); c.textAlign = 'left'; }
  }
  c.restore(); c.lineWidth = 1; c.strokeStyle = 'rgba(0,0,0,.55)'; c.strokeRect(ix, iy, iw, ih);
  if (pk) { fit(c, state.info, 12, 520, 'normal'); c.fillStyle = '#222'; c.textAlign = 'center'; c.fillText(state.info, fx + fw / 2, 435); c.textAlign = 'left'; }

  /* Corps */
  c.fillStyle = ink;
  if (pk) {
    const atks = state.attacks.filter(a => a.name || a.text);
    const maxCost = Math.max(1, ...atks.map(a => a.cost.length)), nx = Math.max(203, 47 + maxCost * 31 + 10);
    c.font = `16px ${FONT}`;
    const bl = atks.map(a => ({ a, ls: a.text ? wrap(c, a.text, 526) : [] }));
    const hh = b => b.ls.length ? 40 + b.ls.length * 19 : 36;
    const gap = Math.max(6, (296 - bl.reduce((s, b) => s + hh(b), 0)) / (bl.length + 1));
    let y = 448 + gap;
    bl.forEach(b => {
      b.a.cost.slice(0, 5).forEach((t, j) => sym(c, t, 47 + j * 31, y + 1, 29, assets));
      c.fillStyle = ink; fit(c, b.a.name, 29, 500 - nx); c.fillText(b.a.name, nx, y + 23);
      if (b.a.damage) { c.textAlign = 'right'; c.font = `bold 34px ${FONT}`; c.fillText(b.a.damage, 582, y + 24); c.textAlign = 'left'; }
      c.font = `16px ${FONT}`; b.ls.forEach((l, j) => c.fillText(l, 50, y + 51 + j * 19));
      y += hh(b) + gap;
    });
    /* Barre faiblesse / résistance / retraite */
    pill(c, 15, 753, 363, 29, 6); pill(c, 396, 753, 217, 29, 6);
    c.fillStyle = '#1d1d1d'; c.font = `bold 15px ${FONT}`;
    c.fillText('Faiblesse', 33, 773); c.fillText('Résistance', 209, 773); c.fillText('Retraite', 413, 773);
    c.fillStyle = '#666'; c.fillRect(198, 758, 1.5, 19);
    const tv = (d, x) => { if (!d.type) return; sym(c, d.type, x, 756.5, 22, assets); c.fillStyle = '#1d1d1d'; c.font = `bold 22px ${FONT}`; c.fillText(d.value, x + 26, 775); };
    tv(state.weak, 103);
    c.font = `bold 15px ${FONT}`; tv(state.resist, 209 + c.measureText('Résistance').width + 8);
    for (let i = 0; i < +state.retreat; i++) sym(c, 'colorless', 480 + i * 24, 756.5, 22, assets);
  } else {
    c.font = `18px ${FONT}`; wrap(c, state.text, 526).forEach((l, i) => c.fillText(l, 52, 482 + i * 25));
  }

  /* Pied de carte : illustrateur, numéro, logo d'extension, mention, ambiance */
  c.fillStyle = ink;
  if (state.illustrator) { c.font = `italic bold 12px ${FONT}`; c.fillText('Illus. ' + state.illustrator, 38, 806); }
  const hasLogo = assets && logo.ok; if (hasLogo) { const r = Math.min(26 / logo.naturalWidth, 26 / logo.naturalHeight, 1e3) || 1;
    c.drawImage(logo, 38, 819, logo.naturalWidth * r, logo.naturalHeight * r); }
  c.font = `15px ${FONT}`; c.fillText([state.number, state.rarity].filter(Boolean).join('  '), hasLogo ? 72 : 38, 835);
  if (state.legal) { c.font = `9px ${FONT}`; c.fillText(state.legal, 42, 849); }
  c.font = `14.5px ${FONT}`; wrap(c, state.flavor, 288).slice(0, 3).forEach((l, i) => c.fillText(l, 286, 803 + i * 18));
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
