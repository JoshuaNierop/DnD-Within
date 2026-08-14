// Quick data.js sanity check. (The full level-up flow test lives in
// Metadocs/LevelingUp/combo-smoke.mjs.)
import { readFileSync } from 'fs';
import vm from 'vm';
const sandbox = { getProfBonus: () => 2 };
vm.createContext(sandbox);
vm.runInContext(readFileSync('data.js', 'utf8') + ';__D = DATA;', sandbox);
const DATA = sandbox.__D;
console.log('pool:', Object.keys(DATA.spellPool).length);
console.log('classes:', Object.keys(DATA.spells));
console.log('wiz9:', DATA.spells.wizard[9].length);
console.log('bard9:', DATA.spells.bard[9].length);
console.log('cleric9:', DATA.spells.cleric[9].length);
console.log('druid9:', DATA.spells.druid[9].length);
console.log('paladin max:', Math.max(...Object.keys(DATA.spells.paladin).map(Number)));
console.log('ranger max:', Math.max(...Object.keys(DATA.spells.ranger).map(Number)));
// validate
let miss = [];
for (const [cls, levels] of Object.entries(DATA.spells)) {
  for (const [l, names] of Object.entries(levels)) {
    for (const n of names) if (!DATA.spellPool[n]) miss.push(cls + 'L' + l + ':' + n);
  }
}
console.log('missing:', miss.length ? miss : 'none');
if (miss.length) process.exit(1);
