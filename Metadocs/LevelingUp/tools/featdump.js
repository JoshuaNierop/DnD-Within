// Side by side: D&D Within class + subclass feature text vs the 2024 PHB text for one class and a
// level range, as input for rewriting in our own words. Console only - never commit the output.
// usage: XPHB_DATA=<dir> node featdump.js <data.js> <class> <fromLevel> [toLevel]
const fs = require('fs'), vm = require('vm');
const { load, flat } = require('./lib.js');
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2], 'utf8') + ';this.DATA=DATA;', ctx);
const CLS = process.argv[3], LO = +process.argv[4], HI = +(process.argv[5] || process.argv[4]);
const j = load('class/class-' + CLS + '.json');
const c = j.class.find((x) => x.source === 'XPHB');
const clean = (t) => t.replace(/\{@\w+ ([^}|]+)(\|[^}]*)?\}/g, '$1').replace(/\s+/g, ' ');
const ourText = (f) => (typeof f.desc === 'object' ? f.desc.en : f.desc) + (f.act ? ' [act: ' + f.act + ']' : '');
const C = ctx.DATA[CLS];
function show(label, ours, theirs) {
  console.log('\n## ' + label);
  (ours || []).forEach((f) => console.log('OURS  ' + f.name + ': ' + ourText(f)));
  theirs.forEach((x) => console.log('2024  ' + x.name + ': ' + clean(flat(x.entries)).slice(0, 1400)));
}
for (let L = LO; L <= HI; L++) {
  const cf = (j.classFeature || []).filter((x) => x.source === 'XPHB' && x.className === c.name && x.level === L && x.name !== 'Subclass Feature');
  if (cf.length || ((C.features || {})[L] || []).length) show(CLS + ' L' + L, (C.features || {})[L], cf);
  (j.subclass || []).filter((s) => s.source === 'XPHB' && s.classSource === 'XPHB').forEach((s) => {
    const key = Object.keys(C.subclasses || {}).find((k) => (C.subclasses[k].name || '').toLowerCase().includes(s.shortName.toLowerCase()));
    const sf = (j.subclassFeature || []).filter((x) => x.source === 'XPHB' && x.subclassShortName === s.shortName && x.className === c.name && x.level === L && x.name !== s.name);
    const ours = key ? (C.subclasses[key].features || {})[L] : null;
    if (sf.length || (ours || []).length) show(s.name + ' (' + (key || '?') + ') L' + L, ours, sf);
  });
}
