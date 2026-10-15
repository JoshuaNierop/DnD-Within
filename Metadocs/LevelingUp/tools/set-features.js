// Edits class/subclass features in data.js from a JSON list of operations (keeps commas and level blocks valid).
// usage: node set-features.js <data.js> <ops.json>
// op: { cls, sub?, level, replace?: "<existing name>", remove?: "<existing name>", feature?: { name, act?, desc } }
//   replace + feature = swap that entry; remove = delete it; feature alone = append it to the level (block created if needed).
const fs = require('fs');
const [FILE, OPS] = process.argv.slice(2);
const src = fs.readFileSync(FILE, 'utf8');
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const L = src.split(eol);
const ops = JSON.parse(fs.readFileSync(OPS, 'utf8'));
const sp = (n) => ' '.repeat(n);
const fmt = (f) => '{ name: ' + JSON.stringify(f.name) + (f.act ? ", act: '" + f.act + "'" : '') + ', desc: ' + JSON.stringify(f.desc) + ' }';
const fail = (op, msg) => { console.error('FAILED ' + JSON.stringify(op).slice(0, 120) + ': ' + msg); process.exit(1); };

function region(op) {
  const cs = L.findIndex((l) => l === sp(4) + op.cls + ': {');
  if (cs < 0) fail(op, 'class not found');
  const ss = L.findIndex((l, i) => i > cs && l.startsWith(sp(8) + 'subclasses: {'));
  const ce = L.findIndex((l, i) => i > cs && /^ {4}\},?$/.test(l));
  if (!op.sub) {
    const fs0 = L.findIndex((l, i) => i > cs && i < ss && l === sp(8) + 'features: {');
    const fe = L.findIndex((l, i) => i > fs0 && /^ {8}\},?$/.test(l));
    return { start: fs0, end: fe, lvlIndent: 12 };
  }
  const sb = L.findIndex((l, i) => i > ss && i < ce && l === sp(12) + op.sub + ': {');
  if (sb < 0) fail(op, 'subclass not found');
  const sbe = L.findIndex((l, i) => i > sb && /^ {12}\},?$/.test(l));
  const fs0 = L.findIndex((l, i) => i > sb && i < sbe && l === sp(16) + 'features: {');
  const fe = L.findIndex((l, i) => i > fs0 && /^ {16}\},?$/.test(l));
  return { start: fs0, end: fe, lvlIndent: 20 };
}
function blocks(r) {   // [{ level, open, close }]
  const out = [], re = new RegExp('^ {' + r.lvlIndent + '}(\\d+): \\[$');
  for (let i = r.start + 1; i < r.end; i++) {
    const m = L[i].match(re);
    if (m) { const close = L.findIndex((l, j) => j > i && new RegExp('^ {' + r.lvlIndent + '}\\],?$').test(l)); out.push({ level: +m[1], open: i, close }); i = close; }
  }
  return out;
}
const setComma = (i, on) => { L[i] = L[i].replace(/,?$/, on ? ',' : ''); };

for (const op of ops) {
  const r = region(op), bs = blocks(r), b = bs.find((x) => x.level === op.level);
  const itemIndent = sp(r.lvlIndent + 4);
  const findItem = (name) => {
    if (!b) fail(op, 'level ' + op.level + ' not found');
    for (let i = b.open + 1; i < b.close; i++) if (L[i].includes('{ name: ' + JSON.stringify(name) + ',')) return i;
    fail(op, 'feature "' + name + '" not found at level ' + op.level);
  };
  if (op.replace) {
    const i = findItem(op.replace);
    L[i] = itemIndent + fmt(op.feature) + (L[i].trimEnd().endsWith(',') ? ',' : '');
  } else if (op.remove) {
    const i = findItem(op.remove);
    const wasLast = !L[i].trimEnd().endsWith(',');
    L.splice(i, 1);
    if (b.close - b.open - 1 === 1) {   // block now empty → remove it
      const blockWasLast = !L[b.close - 1].trimEnd().endsWith(',');
      L.splice(b.open, 2);
      if (blockWasLast) { const prev = blocks(r).filter((x) => x.level < op.level).pop(); if (prev) setComma(prev.close, false); }
    } else if (wasLast) setComma(i - 1, false);
  } else if (op.feature) {
    if (b) {
      setComma(b.close - 1, true);
      L.splice(b.close, 0, itemIndent + fmt(op.feature));
    } else {
      const next = bs.find((x) => x.level > op.level);
      const lines = [sp(r.lvlIndent) + op.level + ': [', itemIndent + fmt(op.feature), sp(r.lvlIndent) + ']' + (next ? ',' : '')];
      if (next) L.splice(next.open, 0, ...lines);
      else {
        const last = bs[bs.length - 1];
        if (last) setComma(last.close, true);
        L.splice(r.end, 0, ...lines);
      }
    }
  } else fail(op, 'nothing to do');
}
fs.writeFileSync(FILE, L.join(eol));
console.log('applied', ops.length, 'feature edits');
