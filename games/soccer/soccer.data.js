// STREET SOCCER — Mannschaften, Turnierrunden, Aufstellung und Flaggen.
//
// Bewusst ausgelagert: Das sind Daten und eine Zeichenroutine, die nichts vom
// Spielzustand wissen. Sie hängen an window.RetroSoccer, weil die Spiele als
// klassische Scripts geladen werden — es gibt keinen Build-Schritt und damit
// keine Module.

window.RetroSoccer = window.RetroSoccer || {};

const ROUNDS    = ['ACHTELFINALE', 'VIERTELFINALE', 'HALBFINALE', 'FINALE'];

const FORMATION = [
  { role: 'GK',  x: 0.50, y: 0.05 },
  { role: 'DEF', x: 0.36, y: 0.30 },
  { role: 'FWD', x: 0.64, y: 0.60 }
];

// c/a = Trikotfarben, bewusst hell genug für den dunklen Rasen.
// f = Flagge fürs Menü, in den echten Landesfarben — die sind zum Teil
// dunkel (Schwarz, Marineblau) und taugen deshalb nicht als Trikot.
const TEAMS = [
  { n: 'DEUTSCHLAND', c: '#f5f5f5', a: '#9e9e9e', f: { t: 'h', c: ['#000000', '#dd0000', '#ffce00'] } },
  { n: 'BRASILIEN',   c: '#ffd54f', a: '#26c6da', f: { t: 'br', c: ['#009b3a', '#fedf00', '#002776'] } },
  { n: 'ARGENTINIEN', c: '#81d4fa', a: '#f5f5f5', f: { t: 'h', c: ['#74acdf', '#ffffff', '#74acdf'] } },
  { n: 'FRANKREICH',  c: '#7986cb', a: '#ef5350', f: { t: 'v', c: ['#0055a4', '#ffffff', '#ef4135'] } },
  { n: 'ITALIEN',     c: '#42a5f5', a: '#f5f5f5', f: { t: 'v', c: ['#008c45', '#f4f5f0', '#cd212a'] } },
  { n: 'ENGLAND',     c: '#fafafa', a: '#ef5350', f: { t: 'cr', c: ['#ffffff', '#ce1124'] } },
  { n: 'SPANIEN',     c: '#ef5350', a: '#ffca28', f: { t: 'h', c: ['#aa151b', '#f1bf00', '#aa151b'], w: [1, 2, 1] } },
  { n: 'NIEDERLANDE', c: '#fb8c00', a: '#f5f5f5', f: { t: 'h', c: ['#ae1c28', '#ffffff', '#21468b'] } },
  { n: 'PORTUGAL',    c: '#e53935', a: '#66bb6a', f: { t: 'v', c: ['#046a38', '#da291c'], w: [2, 3] } },
  { n: 'BELGIEN',     c: '#ff7043', a: '#fdd835', f: { t: 'v', c: ['#000000', '#fdda24', '#ef3340'] } },
  { n: 'KROATIEN',    c: '#ec407a', a: '#f5f5f5', f: { t: 'h', c: ['#ff0000', '#ffffff', '#171796'], m: 'check' } },
  { n: 'URUGUAY',     c: '#4fc3f7', a: '#f5f5f5', f: { t: 'h', c: ['#ffffff', '#0038a8', '#ffffff', '#0038a8', '#ffffff'], m: 'sun' } },
  { n: 'MEXIKO',      c: '#66bb6a', a: '#f5f5f5', f: { t: 'v', c: ['#006847', '#ffffff', '#ce1126'], m: 'emblem' } },
  { n: 'JAPAN',       c: '#9575cd', a: '#ef5350', f: { t: 'di', c: ['#ffffff', '#bc002d'] } },
  { n: 'NIGERIA',     c: '#9ccc65', a: '#f5f5f5', f: { t: 'v', c: ['#008751', '#ffffff', '#008751'] } },
  { n: 'USA',         c: '#f5f5f5', a: '#5c6bc0', f: { t: 'us', c: [] } }
];

// Flagge zeichnen. Bewusst schlicht: Streifen, Kreuz, Scheibe, plus zwei
// Sonderfälle. Wappen und Sterne wären in dieser Größe ohnehin Matsch.
// Der Kontext kommt als erstes Argument, damit die Funktion ohne die
// Spiel-Closure auskommt.
// Flagge zeichnen. Bewusst schlicht: Streifen, Kreuz, Scheibe, plus zwei
// Sonderfälle. Wappen und Sterne wären in dieser Größe ohnehin Matsch.
function drawFlagIcon(ctx, x, y, fw, fh, fl) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, fw, fh); ctx.clip();
  const c = fl.c;
  if (fl.t === 'h' || fl.t === 'v') {
    const wgt = fl.w || c.map(() => 1);
    const tot = wgt.reduce((a, b) => a + b, 0);
    let off = 0;
    c.forEach((col, i) => {
      const size = (fl.t === 'h' ? fh : fw) * wgt[i] / tot;
      ctx.fillStyle = col;
      if (fl.t === 'h') ctx.fillRect(x, y + off, fw, size + 1);
      else              ctx.fillRect(x + off, y, size + 1, fh);
      off += size;
    });
  } else if (fl.t === 'cr') {              // Kreuzflagge
    ctx.fillStyle = c[0]; ctx.fillRect(x, y, fw, fh);
    ctx.fillStyle = c[1];
    ctx.fillRect(x, y + fh * 0.4, fw, fh * 0.2);
    ctx.fillRect(x + fw * 0.42, y, fw * 0.16, fh);
  } else if (fl.t === 'di') {              // Scheibe
    ctx.fillStyle = c[0]; ctx.fillRect(x, y, fw, fh);
    ctx.fillStyle = c[1];
    ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.28, 0, Math.PI * 2); ctx.fill();
  } else if (fl.t === 'br') {              // Raute mit Kreis
    ctx.fillStyle = c[0]; ctx.fillRect(x, y, fw, fh);
    ctx.fillStyle = c[1];
    ctx.beginPath();
    ctx.moveTo(x + fw / 2, y + fh * 0.14); ctx.lineTo(x + fw * 0.86, y + fh / 2);
    ctx.lineTo(x + fw / 2, y + fh * 0.86); ctx.lineTo(x + fw * 0.14, y + fh / 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = c[2];
    ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.19, 0, Math.PI * 2); ctx.fill();
  } else if (fl.t === 'us') {
    // 13 Streifen, Gösch über sieben davon und 2/5 der Breite — vorher
    // waren es sieben Streifen und ein zu breiter blauer Block ohne
    // Sterne, der eher nach Frankreich aussah als nach den USA.
    const n = 13;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#b22234';
      ctx.fillRect(x, y + i * fh / n, fw, fh / n + 1);
    }
    const gw = fw * 0.40, gh = fh * 7 / n;
    ctx.fillStyle = '#3c3b6e';
    ctx.fillRect(x, y, gw, gh);
    // Sterne als Punktraster. Einzelne Sterne wären in dieser Größe Matsch,
    // das Raster liest sich trotzdem als Sternenfeld.
    ctx.fillStyle = '#ffffff';
    const sr = Math.max(0.6, gh * 0.055);
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        if ((row + col) % 2) continue;            // versetztes Raster
        ctx.beginPath();
        ctx.arc(x + gw * (col + 1) / 7, y + gh * (row + 1) / 6, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Zusatzzeichen. Ohne sie sind Italien und Mexiko sowie Kroatien und die
  // Niederlande in dieser Größe nicht auseinanderzuhalten.
  if (fl.m === 'check') {                  // kroatisches Schachbrett
    const cw2 = fw * 0.055, n = 4;
    for (let r2 = 0; r2 < 2; r2++) for (let c2 = 0; c2 < n; c2++) {
      ctx.fillStyle = (r2 + c2) % 2 ? '#ffffff' : '#d32f2f';
      ctx.fillRect(x + fw / 2 - n * cw2 / 2 + c2 * cw2, y + fh * 0.22 + r2 * cw2, cw2 + 0.5, cw2 + 0.5);
    }
  } else if (fl.m === 'emblem') {          // Wappen in der Mitte
    ctx.fillStyle = 'rgba(70,50,20,0.85)';
    ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.15, 0, Math.PI * 2); ctx.fill();
  } else if (fl.m === 'sun') {             // Sonne in der Gösch
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, fw * 0.36, fh * 0.36);
    ctx.fillStyle = '#f6b40e';
    ctx.beginPath(); ctx.arc(x + fw * 0.18, y + fh * 0.18, fh * 0.11, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(1, fw * 0.015);
  ctx.strokeRect(x, y, fw, fh);
}

window.RetroSoccer.ROUNDS = ROUNDS;
window.RetroSoccer.FORMATION = FORMATION;
window.RetroSoccer.TEAMS = TEAMS;
window.RetroSoccer.drawFlagIcon = drawFlagIcon;
