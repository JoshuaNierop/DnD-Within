// Side by side: D&D Within spellPool text vs the 2024 text for spells of one level, as input for
// rewriting in our own words. Console only - never commit the output.
// usage: XPHB_DATA=<dir> node spelldump.js <data.js> <level>
const fs = require('fs'), vm = require('vm');
const { load, flat } = require('./lib.js');
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8') + ';this.DATA=DATA;', ctx);
const LV = +process.argv[3];
const xs = load('spells/spells-xphb.json').spell; const by = {}; xs.forEach((s) => by[s.name.toLowerCase()] = s);
const clean = (t) => t.replace(/\{@\w+ ([^}|]+)(\|[^}]*)?\}/g, '$1').replace(/\s+/g, ' ');
for (const [n, p] of Object.entries(ctx.DATA.spellPool)) {
  if (p.level !== LV) continue;
  const s = by[n.toLowerCase()];
  const hl = s && s.entriesHigherLevel ? JSON.stringify(s.entriesHigherLevel).match(/\{@scale(?:dice|damage) ([^}]+)\}/) : null;
  console.log('## ' + n + (s ? '' : '  [NOT IN 2024]') + '\nOURS: ' + (typeof p.desc === 'object' ? p.desc.en : p.desc) +
    (s ? '\n2024: ' + clean(flat(s.entries)).slice(0, 650) + (s.entriesHigherLevel ? ' || UP: ' + clean(flat(s.entriesHigherLevel)).slice(0, 160) + (hl ? ' [scale ' + hl[1] + ']' : '') : '') : ''));
}
