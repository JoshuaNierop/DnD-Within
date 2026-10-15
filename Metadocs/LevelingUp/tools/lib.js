// Helpers to flatten 5etools entries into plain text (XPHB = 2024 PHB).
const fs = require('fs'), path = require('path');
// Folder with the 2024 PHB (XPHB) JSON data. Kept outside the repo for licensing reasons.
const RAW = process.env.XPHB_DATA;
if (!RAW) { console.error('Set XPHB_DATA to the folder with the XPHB data (see Metadocs/LevelingUp/README.md)'); process.exit(1); }
function load(rel) { return JSON.parse(fs.readFileSync(path.join(RAW, rel), 'utf8')); }
function stripTags(s) {
  return String(s).replace(/\{@(\w+) ([^}]*)\}/g, function (m, tag, body) {
    var parts = body.split('|');
    if (tag === 'dice' || tag === 'damage' || tag === 'd20' || tag === 'hit' || tag === 'dc') return parts[0];
    if (tag === 'variantrule' || tag === 'condition' || tag === 'action' || tag === 'skill' || tag === 'sense' || tag === 'status' || tag === 'hazard' || tag === 'book' || tag === 'quickref' || tag === 'item' || tag === 'creature' || tag === 'filter' || tag === 'feat' || tag === 'spell' || tag === 'classFeature' || tag === 'subclassFeature' || tag === 'class' || tag === 'race' || tag === 'background' || tag === 'optfeature' || tag === 'language' || tag === 'table' || tag === 'deity' || tag === 'itemProperty' || tag === 'itemMastery' || tag === 'card' || tag === 'deck' || tag === 'boon' || tag === 'cult' || tag === 'trap' || tag === 'object' || tag === 'vehicle' || tag === 'reward' || tag === 'psionic' || tag === 'charoption' || tag === 'recipe' || tag === 'facility' || tag === 'loader' || tag === 'adventure' || tag === 'scaledice' || tag === 'scaledamage') {
      if (tag === 'classFeature' || tag === 'subclassFeature') return parts[0];
      if (tag === 'scaledice' || tag === 'scaledamage') return parts[2] || parts[0];
      return parts.length > 2 && parts[2] ? parts[2] : parts[0];
    }
    return parts[0];
  }).replace(/\{@(\w+)\}/g, '');
}
function flat(e, depth) {
  depth = depth || 0;
  if (e == null) return '';
  if (typeof e === 'string') return stripTags(e);
  if (Array.isArray(e)) return e.map(function (x) { return flat(x, depth); }).filter(Boolean).join('\n');
  if (e.type === 'list') return (e.items || []).map(function (x) { return '  - ' + flat(x, depth + 1); }).join('\n');
  if (e.type === 'item') return (e.name ? e.name + ': ' : '') + flat(e.entries || e.entry, depth + 1);
  if (e.type === 'table') {
    var rows = (e.rows || []).map(function (r) { return '    | ' + r.map(function (c) { return typeof c === 'object' ? flat(c.roll ? (c.roll.exact != null ? String(c.roll.exact) : c.roll.min + '-' + c.roll.max) : c, depth + 1) : stripTags(c); }).join(' | '); });
    return '    [table ' + (e.caption || '') + '] ' + (e.colLabels || []).map(stripTags).join(' | ') + '\n' + rows.join('\n');
  }
  if (e.type === 'refClassFeature' || e.type === 'refSubclassFeature' || e.type === 'refOptionalfeature') return '  (ref) ' + stripTags(e.classFeature || e.subclassFeature || e.optionalfeature || '');
  if (e.type === 'abilityDc' || e.type === 'abilityAttackMod') return '  [' + e.type + ' ' + (e.attributes || []).join('/') + ']';
  var head = e.name ? '# ' + stripTags(e.name) + ': ' : '';
  return head + flat(e.entries || e.items || e.entry || [], depth + 1);
}
module.exports = { load, flat, stripTags, RAW };
