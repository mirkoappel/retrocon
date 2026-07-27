// Die Einstellung SPIELERWECHSEL muss wirken: gar nicht, bei Ballgewinn, oder
// immer zum Spieler am Ball.
const { session } = require('../harness');

function aufbau(modus) {
  const s = session('soccer', {
    conns: new Map([[1, 'keyboard']]),
    setting: k => (k === 'switch' ? modus : k === 'duration' ? 180 : 'normal')
  });
  for (let i = 0; i < 4; i++) s.tap();
  const S = s.state;
  S.restart = 0; S.kickoffTo = null; S.kickoffToT = 0; S.kickoffLock = 0;
  return { s, S };
}

// Welchen Spieler steuert der Mensch, wenn der Ball beim Mitspieler liegt?
function beiBallgewinn(modus) {
  const { s, S } = aufbau(modus);
  const eigene = S.players.filter(p => p.team === 0 && p.role !== 'GK');
  const start = eigene.find(p => p.ctrl === 1) || eigene[0];
  const anderer = eigene.find(p => p !== start);
  S.ball.owner = anderer; S.ball.x = anderer.x; S.ball.y = anderer.y + 0.03;
  for (let f = 0; f < 40; f++) s.step();
  return S.players.find(p => p.ctrl === 1) === anderer;
}

// Und wenn der Ball frei weit weg vom gesteuerten Spieler liegt?
function amBall(modus) {
  const { s, S } = aufbau(modus);
  const eigene = S.players.filter(p => p.team === 0 && p.role !== 'GK');
  const start = eigene.find(p => p.ctrl === 1) || eigene[0];
  const anderer = eigene.find(p => p !== start);
  S.ball.owner = null; S.ball.vx = 0; S.ball.vy = 0;
  // Nah bei `anderer`, aber ausserhalb seiner Aufnahme — sonst hat er den Ball
  // sofort, und dann waere es kein Wechsel nach Naehe mehr
  S.ball.x = anderer.x; S.ball.y = anderer.y + 0.10;
  start.x = 0.05; start.y = 0.05;                 // weit weg
  const gewechselt = () => S.players.find(p => p.ctrl === 1) === anderer;
  for (let f = 0; f < 40; f++) { s.step(); if (S.ball.owner) break; }
  return gewechselt();
}

module.exports = {
  name: 'Fussball · Einstellung SPIELERWECHSEL',
  run() {
    const fehler = [];
    if (beiBallgewinn('manuell'))     fehler.push('manuell: wechselt trotzdem bei Ballgewinn');
    if (amBall('manuell'))            fehler.push('manuell: wechselt trotzdem zum Ball');
    if (!beiBallgewinn('ballgewinn')) fehler.push('ballgewinn: wechselt nicht zum Ballführenden');
    if (amBall('ballgewinn'))         fehler.push('ballgewinn: wechselt schon zum freien Ball');
    if (!beiBallgewinn('amball'))     fehler.push('amball: wechselt nicht zum Ballführenden');
    if (!amBall('amball'))            fehler.push('amball: wechselt nicht zum freien Ball');
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'NUR SELBST wechselt nie, BEI BALLGEWINN nur mit Ball, AM BALL auch zum freien Ball'
    };
  }
};
