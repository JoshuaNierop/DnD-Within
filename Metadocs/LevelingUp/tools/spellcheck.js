// Compare D&D Within spellPool (levels <= maxLevel) with the 2024 PHB data:
// casting time, concentration, duration, range. usage: XPHB_DATA=<dir> node spellcheck.js <data.js> <maxLevel> [out.json]
const fs = require('fs'), vm = require('vm');
const { load } = require('./lib.js');
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8') + ';this.DATA=DATA;', ctx);
const D = ctx.DATA, maxL = +(process.argv[3] || 2);
const xs = load('spells/spells-xphb.json').spell;
const byName = {}; xs.forEach(s => byName[s.name.toLowerCase()] = s);
const unitOf = (t) => ({ action: 'action', bonus: 'bonus', reaction: 'reaction', minute: 'minute', hour: 'hour' })[t.unit] || t.unit;
const timeTxt = (t) => t.number + ' ' + ({ action: 'action', bonus: 'bonus action', reaction: 'reaction', minute: 'minute', hour: 'hour' }[t.unit] || t.unit) + (t.number > 1 && (t.unit === 'minute' || t.unit === 'hour') ? 's' : '');
function durTxt(d) {
  const x = d[0];
  if (x.type === 'instant') return 'Instantaneous';
  if (x.type === 'permanent') return 'Until dispelled';
  if (x.type === 'special') return 'Special';
  const a = x.duration.amount, u = x.duration.type;
  return (x.concentration ? 'Concentration, ' : '') + a + ' ' + u + (a > 1 ? 's' : '');
}
function rangeTxt(r) {
  if (!r) return '';
  if (r.type === 'point') { const d = r.distance; if (d.type === 'self') return 'Self'; if (d.type === 'touch') return 'Touch'; if (d.type === 'sight') return 'Sight'; if (d.type === 'unlimited') return 'Unlimited'; return d.amount + (d.type === 'feet' ? 'ft' : ' ' + d.type); }
  if (r.distance) return 'Self (' + r.distance.amount + 'ft ' + r.type + ')';
  return r.type;
}
const issues = [];
for (const [name, p] of Object.entries(D.spellPool)) {
  if (p.level > maxL) continue;
  const s = byName[name.toLowerCase()];
  if (!s) continue;
  const out = [];
  const want = unitOf(s.time[0]); const t = String(p.time || '').toLowerCase();
  const have = /bonus/.test(t) ? 'bonus' : /reaction/.test(t) ? 'reaction' : /hour/.test(t) ? 'hour' : /minute|min\b/.test(t) ? 'minute' : /action/.test(t) ? 'action' : '?';
  if (want !== have) out.push('time ' + p.time + ' → ' + timeTxt(s.time[0]));
  const conc = !!(s.duration[0] && s.duration[0].concentration);
  if (conc !== /concentration/i.test(p.dur || '')) out.push('dur ' + p.dur + ' → ' + durTxt(s.duration));
  const rt = rangeTxt(s.range);
  const rn = String(p.range || '').replace(/\s/g, '').toLowerCase();
  const rw = rt.replace(/\s/g, '').toLowerCase();
  if (rw && rn && !rn.startsWith(rw.slice(0, 4)) && !(rw.startsWith('self') && rn.startsWith('self'))) out.push('range ' + p.range + ' → ' + rt);
  if (out.length) issues.push({ name, level: p.level, out, t24: timeTxt(s.time[0]), d24: durTxt(s.duration), r24: rt });
}
console.log(issues.length + ' spells (level <= ' + maxL + ') differ from 2024:');
issues.forEach(i => console.log('- L' + i.level + ' ' + i.name + ': ' + i.out.join('; ')));
if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(issues, null, 1));
