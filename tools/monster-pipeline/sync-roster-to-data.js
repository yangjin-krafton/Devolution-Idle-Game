const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const rosterDir = path.join(__dirname, 'roster');
const monstersDir = path.join(repoRoot, 'src', 'data', 'monsters');

function cleanSkillKey(skill) {
  return String(skill || '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

function parseSkillFocus(skillFocus) {
  return String(skillFocus || '')
    .split('/')
    .map(cleanSkillKey)
    .filter(Boolean);
}

function formatValue(value, indent = 0) {
  const space = ' '.repeat(indent);
  const next = ' '.repeat(indent + 2);

  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item => `${next}${formatValue(item, indent + 2)}`);
    return `[\n${items.join(',\n')}\n${space}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  const lines = entries.map(([key, val]) => `${next}${key}: ${formatValue(val, indent + 2)}`);
  return `{\n${lines.join(',\n')}\n${space}}`;
}

function pickDevolvedForm(d1) {
  const sameRole = (d1.devo2 || []).find(d2 => d2.role === d1.role);
  return sameRole || (d1.devo2 || [])[0] || null;
}

function getWildImg(currentSource, fallbackBaseName) {
  const match = currentSource.match(/img:\s*IMG \+ '([^']+)'/);
  if (match) return match[1];
  return `enemy_${fallbackBaseName}.png`;
}

function generateMonsterModule(fileName, rosterData, currentSource) {
  const baseId = rosterData.wild.name_en;
  const wildImg = getWildImg(currentSource, baseId);

  const devo1List = rosterData.devo1.map((d1, index) => {
    const devolved = pickDevolvedForm(d1);
    return {
      id: `${baseId}_d1_${index}`,
      name: d1.name_kr,
      nameEn: d1.name_en,
      desc: d1.desc_kr,
      role: d1.role,
      imgRef: `AIMG.${d1.role}[0]`,
      devolvedImgRef: `AIMG.${d1.role}[1]`,
      hp: d1.hp,
      maxHp: d1.hp,
      stats: d1.stats,
      devolvedName: devolved?.name_kr || d1.name_kr,
      devolvedNameEn: devolved?.name_en || d1.name_en,
      devolvedDesc: devolved?.desc_kr || d1.desc_kr,
      devolvedStats: devolved?.stats || d1.stats,
      xp: 0,
      xpThreshold: 5,
      inEgg: false,
      devolved: false,
      skillFocus: d1.skillFocus,
      visual: d1.visual || null,
      actionKeys: parseSkillFocus(d1.skillFocus),
    };
  });

  const devo2List = [];
  let d2Index = 0;
  rosterData.devo1.forEach((d1, parentIndex) => {
    (d1.devo2 || []).forEach(d2 => {
      devo2List.push({
        id: `${baseId}_d2_${d2Index++}`,
        name: d2.name_kr,
        nameEn: d2.name_en,
        desc: d2.desc_kr,
        role: d2.role,
        hp: d2.hp,
        maxHp: d2.hp,
        stats: d2.stats,
        parentDevo1: `${baseId}_d1_${parentIndex}`,
        skillFocus: d2.skillFocus || null,
        visual: d2.visual || null,
      });
    });
  });

  const wildBlock = `  wild: {
    id: ${JSON.stringify(baseId)},
    name: ${JSON.stringify(rosterData.wild.name_kr)},
    nameEn: ${JSON.stringify(rosterData.wild.name_en)},
    desc: ${JSON.stringify(rosterData.wild.desc_kr)},
    img: IMG + ${JSON.stringify(wildImg)},
    attackPower: ${rosterData.wild.attackPower},
    tamingThreshold: ${rosterData.wild.tamingThreshold},
    escapeThreshold: ${rosterData.wild.escapeThreshold},
    hp: ${rosterData.wild.hp},
    stats: ${formatValue(rosterData.wild.stats, 4)},
    sensoryType: ${formatValue(rosterData.wild.sensoryType, 4)},
    personality: ${JSON.stringify(rosterData.wild.personality)},
    habitat: ${JSON.stringify(rosterData.wild.habitat || null)},
    visual: ${formatValue(rosterData.wild.visual || null, 4)},
    wildMechanic: ${formatValue(rosterData.wild.wildMechanic || null, 4)},
    skills: ${formatValue(rosterData.wild.skills || [], 4)},
    reactions: REACTIONS.${rosterData.wild.personality},
  },`;

  const devo1Block = devo1List
    .map(d1 => `    {
      id: ${JSON.stringify(d1.id)},
      name: ${JSON.stringify(d1.name)},
      nameEn: ${JSON.stringify(d1.nameEn)},
      desc: ${JSON.stringify(d1.desc)},
      role: ${JSON.stringify(d1.role)},
      img: ${d1.imgRef},
      devolvedImg: ${d1.devolvedImgRef},
      hp: ${d1.hp},
      maxHp: ${d1.maxHp},
      stats: ${formatValue(d1.stats, 6)},
      devolvedName: ${JSON.stringify(d1.devolvedName)},
      devolvedNameEn: ${JSON.stringify(d1.devolvedNameEn)},
      devolvedDesc: ${JSON.stringify(d1.devolvedDesc)},
      devolvedStats: ${formatValue(d1.devolvedStats, 6)},
      xp: ${d1.xp},
      xpThreshold: ${d1.xpThreshold},
      inEgg: false,
      devolved: false,
      skillFocus: ${JSON.stringify(d1.skillFocus)},
      visual: ${formatValue(d1.visual, 6)},
      actions: makeActions(${formatValue(d1.actionKeys, 6)}),
    }`)
    .join(',\n');

  const devo2Block = devo2List
    .map(d2 => `    {
      id: ${JSON.stringify(d2.id)},
      name: ${JSON.stringify(d2.name)},
      nameEn: ${JSON.stringify(d2.nameEn)},
      desc: ${JSON.stringify(d2.desc)},
      role: ${JSON.stringify(d2.role)},
      hp: ${d2.hp},
      maxHp: ${d2.maxHp},
      stats: ${formatValue(d2.stats, 6)},
      parentDevo1: ${JSON.stringify(d2.parentDevo1)},
      skillFocus: ${JSON.stringify(d2.skillFocus)},
      visual: ${formatValue(d2.visual, 6)},
    }`)
    .join(',\n');

  return `import { makeActions } from '../skills.js';
import { REACTIONS } from '../reactions.js';

const IMG = 'asset/monsters/';

const AIMG = {
  attacker: [IMG + 'fire_ally.png', IMG + 'fire_devolved.png'],
  tank: [IMG + 'grass_ally.png', IMG + 'grass_devolved.png'],
  support: [IMG + 'water_ally.png', IMG + 'water_devolved.png'],
  speedster: [IMG + 'fire_ally.png', IMG + 'fire_devolved.png'],
};

export default {
  id: ${JSON.stringify(baseId)},

${wildBlock}

  devo1: [
${devo1Block}
  ],

  devo2: [
${devo2Block}
  ],
};
`;
}

function syncOne(fileName) {
  const rosterPath = path.join(rosterDir, fileName.replace(/\.js$/, '.json'));
  const monsterPath = path.join(monstersDir, fileName);
  const rosterData = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
  const currentSource = fs.readFileSync(monsterPath, 'utf8');
  const nextSource = generateMonsterModule(fileName, rosterData, currentSource);
  fs.writeFileSync(monsterPath, nextSource, 'utf8');
}

function main() {
  const files = fs.readdirSync(monstersDir).filter(name => name.endsWith('.js')).sort();
  for (const fileName of files) {
    syncOne(fileName);
    process.stdout.write(`synced ${fileName}\n`);
  }
}

main();
