#!/usr/bin/env node
// Prüflauf. `node tests/run.js` fährt die schnellen Fälle,
// `node tests/run.js --full` zusätzlich die statistischen (mehrere Minuten).
// `node tests/run.js <teil>` wählt Fälle über einen Namensteil aus.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const full = args.includes('--full');
const filter = args.filter(a => !a.startsWith('--'))[0];

const dir = path.join(__dirname, 'cases');
let faelle = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()
  .map(f => ({ datei: f, ...require(path.join(dir, f)) }));
if (filter) faelle = faelle.filter(f => f.datei.includes(filter) || f.name.includes(filter));

let ausgelassen = 0;
const ergebnisse = [];
for (const fall of faelle) {
  if (fall.slow && !full) { ausgelassen++; continue; }
  const t0 = Date.now();
  let r;
  try { r = fall.run(); }
  catch (e) { r = { ok: false, info: 'Ausnahme: ' + e.message }; }
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  ergebnisse.push({ ...fall, ...r, s });
  console.log(`${r.ok ? 'OK  ' : 'FEHL'}  ${fall.name}  (${s}s)\n        ${r.info}`);
}

const fehl = ergebnisse.filter(r => !r.ok);
console.log(`\n${ergebnisse.length - fehl.length} von ${ergebnisse.length} bestanden` +
  (ausgelassen ? `, ${ausgelassen} statistische ausgelassen (--full)` : ''));
process.exit(fehl.length ? 1 : 0);
