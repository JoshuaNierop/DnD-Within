// Checks paraphrased monster text against the source dump (made with DUMP_DIR, see build-monster-db.js):
// same monsters, sections and block names; every number of the source block still present; and no
// copied wording (longest shared run of words, after removing the fixed 2024 stat-block formulas).
// usage: node check-own-words.js <source-N.json> <own-N.json> [maxRun=7]
const fs = require('fs');
const [srcFile, ownFile, maxArg] = process.argv.slice(2);
if (!srcFile || !ownFile) { console.error('usage: node check-own-words.js <source.json> <own.json> [maxRun]'); process.exit(1); }
const MAX = Number(maxArg) || 7;
const src = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
const own = JSON.parse(fs.readFileSync(ownFile, 'utf8'));

const nums = (s) => (String(s).match(/\d+/g) || []).reduce((m, n) => { m[n] = (m[n] || 0) + 1; return m; }, {});
// Fixed formulas of a 2024 stat block (attack/save lines, spell lists) are mechanics, not wording
function strip(s) {
  return String(s)
    .replace(/(Melee or Ranged|Melee|Ranged) Attack Roll: [+-]\d+[^.]*?ft\./g, ' ')
    .replace(/(Hit|Hit or Miss): \d+ \([^)]*\) \w+ damage/g, ' ')
    .replace(/plus \d+ \([^)]*\) \w+ damage/g, ' ')
    .replace(/\w+ Saving Throw: DC \d+/g, ' ')
    .replace(/^(At Will|\d+\/\w+( \w+)*( Each)?):.*$/gm, ' ')
    .replace(/Failure by \d+ or More:/g, ' ')
    .replace(/(Failure|Success|Trigger|Response|Failure or Success):/g, ' ');
}
const words = (s) => strip(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
function longestRun(a, b) {
  let best = 0, at = -1;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diag = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diag + 1 : 0;
      if (prev[j] > best) { best = prev[j]; at = i; }
      diag = tmp;
    }
  }
  return { len: best, text: a.slice(at - best, at).join(' ') };
}

const problems = [];
Object.keys(src).forEach((id) => {
  const s = src[id].sections, o = own[id];
  if (!o) { problems.push(id + ': missing'); return; }
  Object.keys(o).forEach((k) => { if (!s[k]) problems.push(id + ': extra section ' + k); });
  Object.keys(s).forEach((k) => {
    const a = s[k], b = o[k] || [];
    if (a.length !== b.length) { problems.push(id + ' / ' + k + ': ' + b.length + ' blocks, source has ' + a.length); return; }
    a.forEach((blk, i) => {
      const ob = b[i], where = id + ' / ' + k + ' / ' + (blk.name || '#' + i);
      if (!ob || ob.name !== blk.name) { problems.push(where + ': block name must stay "' + blk.name + '"'); return; }
      if (!ob.text || !ob.text.trim()) { problems.push(where + ': empty text'); return; }
      const ns = nums(blk.text), no = nums(ob.text);
      const lost = Object.keys(ns).filter((n) => (no[n] || 0) < ns[n]);
      if (lost.length) problems.push(where + ': numbers missing: ' + lost.join(', '));
      const run = longestRun(words(blk.text), words(ob.text));
      if (run.len > MAX) problems.push(where + ': ' + run.len + ' words copied: "' + run.text + '"');
    });
  });
});
Object.keys(own).forEach((id) => { if (!src[id]) problems.push(id + ': not in the source batch'); });
if (problems.length) { console.log(problems.length + ' problem(s):\n' + problems.join('\n')); process.exit(1); }
console.log('ok — ' + Object.keys(src).length + ' monsters');
