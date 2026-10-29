/* ASCII sprites. Bonnie (邦妮, agent 006, "毒苹果") and Fanny (芬妮, agent 007).
   Colours are stylised: red hood + apple for Bonnie, strawberry pink + magnifier
   for Fanny. Swap the colour functions once the official palette is decided. */
(function () {
  const MV = window.MV, ST = MV.ST;

  const pad = (rows) => { const w = Math.max(...rows.map((r) => r.length)); return rows.map((r) => r.padEnd(w)); };

  const BONNIE = pad([
    '         .--.         ',
    '      .-\'    \'-.      ',
    '     /  .----.  \\     ',
    '    /  /~~~~~~\\  \\    ',
    '   |  | ^    ^ |  |   ',
    '   |  |  o  o  |  |   ',
    '   |  |   __   |  |   ',
    '    \\  \\ \'--\' /  /    ',
    '    /\'. \'----\' .\'\\    ',
    '   /   \'.=@=.\'   \\   ',
    '  /   /  |##|  \\   \\  ',
    ' /___/ ( |##| ) \\___\\ ',
    '      (@)|##|         ',
    '         |##|         ',
    '         /  \\         ',
    '        /_/\\_\\        ',
  ]);
  const FANNY = pad([
    '        ________        ',
    '     .-\'  ____  \'-.     ',
    '    /___.\'    \'.___\\    ',
    '       /~~~~~~~~\\       ',
    '      | ~      ~ |      ',
    '      |  ^    ^  |      ',
    '      |    ww    |  .-. ',
    '       \\  \'--\'  /  ( O )',
    '     .--\'----\'--. /\'-\' ',
    '    /  |  <3  |  /     ',
    '   /  /|  ::  |\\/      ',
    '  \'--\' |  ::  |        ',
    '       |______|        ',
    '        | || |         ',
    '        | || |         ',
    '       (__)(__)        ',
  ]);

  function bonnieColor(ch, x, y) {
    if (ch === '@') return ST.RB;
    if (ch === '~') return ST.Y;
    if (y >= 4 && y <= 7 && x >= 8 && x <= 13) return ch === 'o' || ch === '^' ? ST.W : ST.S;
    if (ch === '#') return ST.D;
    if (y >= 12) return ST.N;
    return ST.R;
  }
  function fannyColor(ch, x, y) {
    if (y <= 2) return ST.P;
    if (ch === '~') return ST.B;
    if (x >= 18 && y >= 6 && y <= 8) return ch === 'O' ? ST.CB : ST.C;
    if (y >= 4 && y <= 7 && x >= 8 && x <= 15) return ch === '^' ? ST.W : ST.S;
    if (ch === '<' || ch === '3') return ST.R;
    if (y >= 13) return ST.N;
    return ST.P;
  }

  const S = (MV.SPRITES = {
    bonnie: { art: BONNIE, color: bonnieColor },
    fanny: { art: FANNY, color: fannyColor },
    fannyMini: { art: pad([' _n_ ', '(^.^)', ' /|\\ ']), color: (c, x, y) => (y === 0 ? ST.P : y === 1 ? ST.S : ST.P) },
    bonnieMini: { art: pad([' .^. ', '(o.o)', ' /@\\ ']), color: (c) => (c === '@' ? ST.RB : ST.R) },
    magnifier: {
      art: pad(['  .---.   ', ' /  .  \\  ', '|  ( )  | ', ' \\     /  ', '  \'---\'\\  ', '        \\ ', '         \\']),
      color: (c, x, y) => (y >= 4 && x >= 7 ? ST.B : c === '.' && y === 1 ? ST.W : ST.C),
    },
    camera: {
      art: pad(['   ___      ', ' _| o |____ ', '|  .---.  o|', '| ( (O) )  |', '|  \'---\'   |', '\'----------\'']),
      color: (c) => (c === 'O' ? ST.CB : c === 'o' ? ST.R : ST.W),
    },
    cake: {
      art: pad(['     ,     ', '    (*)    ', '   _|_|_   ', '  {~~~~~}  ', ' {_______} ', ' |@ @ @ @| ', ' |_______| ']),
      color: (c, x, y) => (y <= 1 ? (c === '*' ? ST.Y : ST.B) : c === '@' ? ST.R : c === '~' ? ST.W : ST.P),
    },
    apple: { art: pad(['  ,(  ', ' .-\'-.', '(  @  )', ' \'-.-\' ']), color: (c, x, y) => (y === 0 ? ST.A : ST.R) },
    hand: { art: pad(['  ___', ' /  _)', '/  /__', '\\____/']), color: () => ST.S },
    // Candidate forms Bonnie tests (one per "if you turned into ..." line).
    table: { art: pad([' ____________ ', '[____________]', '  ||      ||  ', '  ||      ||  ', '  ||      \'\'  ']), color: (c, x, y) => (y < 2 ? ST.B : ST.N) },
    eggplant: { art: pad(['    \\|/   ', '   .-\'-.  ', '  /     \\ ', ' |  \' \'  |', ' |   ,   |', '  \\_____/ ']), color: (c, x, y) => (y === 0 ? ST.A : ST.FB) },
    cat: { art: pad([' /\\_/\\  ', '( o.o ) ', ' > ^ <  ', '/|   |\\ ']), color: (c, x, y) => (c === 'o' ? ST.C : y === 0 ? ST.FB : ST.W) },
    steak: { art: pad(['   _______  ', '  / ~ ~ ~ \\ ', ' | ~  @  ~ |', '  \\_______/ ']), color: (c) => (c === '@' ? ST.W : c === '~' ? ST.Y : ST.R) },
    flower: { art: pad(['   _ _   ', '  (_X_)  ', ' (_)@(_) ', '  (_X_)  ', '    |    ', '   \\|/   ']), color: (c, x, y) => (y >= 4 ? ST.A : c === '@' ? ST.Y : ST.BOL) },
    piece: { art: pad([' .--. .--.', ' |  \'-\'  |', ' \'-.   .-\'', ' .-\'   \'-.', ' |  .-.  |', ' \'--\' \'--\'']), color: () => ST.D },
    dog: { art: pad([' /^ ^\\  ', '/ 0 0 \\ ', 'V\\ Y /V ', ' / - \\  ']), color: (c) => (c === '0' ? ST.W : ST.N) },
    tomato: { art: pad(['   \\|/   ', ' .-\'^\'-. ', '/       \\', '\\       /', ' \'-...-\' ']), color: (c, x, y) => (y === 0 || c === '^' ? ST.A : ST.R) },
  });

  const MIRROR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{' };
  MV.spriteSize = (spr) => ({ w: S[spr] ? S[spr].art[0].length : spr.art[0].length, h: S[spr] ? S[spr].art.length : spr.art.length });

  /* opt: flip, tint (single style), ghost (0..1, dotted outline), reveal (0..1 top-down),
     dissolve (0..1 random erase), corrupt (0..1 noise), t (for animated noise), rows ([a,b] mask) */
  MV.sprite = function (g, x0, y0, name, opt = {}) {
    const spr = typeof name === 'string' ? S[name] : name;
    const h = spr.art.length, w = spr.art[0].length, t = opt.t || 0, f = Math.floor(t * 20);
    const reveal = opt.reveal ?? 1;
    for (let y = 0; y < h; y++) {
      if (y >= reveal * h) break;
      const row = spr.art[y];
      for (let x = 0; x < w; x++) {
        let ch = opt.flip ? row[w - 1 - x] : row[x];
        if (ch === ' ') continue;
        const sx = opt.flip ? w - 1 - x : x;
        let st = opt.tint ?? spr.color(ch, sx, y);
        if (opt.flip && MIRROR[ch]) ch = MIRROR[ch];
        const id = x * 131 + y * 977 + (opt.seed || 0);
        if (opt.dissolve && MV.rnd(id) < opt.dissolve) continue;
        if (opt.ghost) {
          if (MV.rnd(id + f * 3) < opt.ghost * 0.45) continue;
          ch = MV.rnd(id + f) < 0.5 ? '.' : ':';
          st = MV.rnd(id + f * 7) < 0.15 ? ST.PB : opt.ghostStyle ?? ST.G;
        }
        if (opt.corrupt && MV.rnd(id + f * 11) < opt.corrupt) { ch = '#%?@&$'[MV.hash16(id + f) % 6]; st = ST.D; }
        g.set(x0 + x, y0 + y, ch, st);
      }
    }
  };
})();
