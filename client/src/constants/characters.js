export const CHARACTER_OPTIONS = [
  { key: "masked-bandit", name: "Masked Bandit", title: "Silent Outlaw", portrait: "/assets/characters/masked-bandit.png", accent: "from-zinc-300 to-zinc-700" },
  { key: "mafia-boss", name: "Mafia Boss", title: "Underworld Kingpin", portrait: "/assets/characters/mafia-boss.png", accent: "from-rose-300 to-red-700" },
  { key: "street-fighter", name: "Street Fighter", title: "Neon Brawler", portrait: "/assets/characters/street-fighter.png", accent: "from-cyan-300 to-blue-700" },
  { key: "silent-assassin", name: "Silent Assassin", title: "Ghostblade", portrait: "/assets/characters/silent-assassin.png", accent: "from-emerald-300 to-teal-700" },
  { key: "sheriff", name: "Sheriff", title: "Frontier Marshal", portrait: "/assets/characters/sheriff.png", accent: "from-yellow-200 to-amber-700" },
  { key: "joker", name: "Joker", title: "Chaos Trickster", portrait: "/assets/characters/joker.png", accent: "from-fuchsia-300 to-purple-700" }
];

export const CHARACTER_BY_NAME = Object.fromEntries(CHARACTER_OPTIONS.map((c) => [c.name, c]));

export const getCharacterMeta = (name) => CHARACTER_BY_NAME[name] || CHARACTER_OPTIONS[0];
