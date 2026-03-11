export function validateSkillDefinition(skill) {
  const issues = [];

  if (!skill?.id) issues.push('missing id');
  if (!skill?.name) issues.push(`skill ${skill?.id || '(unknown)'} missing name`);
  if (!skill?.category) issues.push(`skill ${skill?.id || '(unknown)'} missing category`);
  if (skill?.pp != null && skill?.pp < 0) issues.push(`skill ${skill.id} has negative pp`);
  if (skill?.maxPp != null && skill?.maxPp < 0) issues.push(`skill ${skill.id} has negative maxPp`);
  if (skill?.pp != null && skill?.maxPp != null && skill.pp > skill.maxPp) {
    issues.push(`skill ${skill.id} pp exceeds maxPp`);
  }
  if (skill?.category === 'stimulate' && !skill?.axis) {
    issues.push(`stimulate skill ${skill.id} missing axis`);
  }
  if (skill?.category === 'capture' && !skill?.axis) {
    issues.push(`capture skill ${skill.id} missing axis`);
  }

  return issues;
}

export function validateSkillLibrary(library, canonicalKeys) {
  const issues = [];

  for (const key of canonicalKeys) {
    const skill = library[key];
    issues.push(...validateSkillDefinition(skill));
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function normalizeEquippedKeys(skillPoolKeys, equippedKeys, maxEquipped = 3) {
  const pool = [...new Set(skillPoolKeys.map(key => String(key).trim()))];
  const requested = (equippedKeys ?? pool.slice(0, maxEquipped)).map(key => String(key).trim());
  const equipped = requested.filter(key => pool.includes(key)).slice(0, maxEquipped);

  if (equipped.length === 0) {
    return pool.slice(0, maxEquipped);
  }

  return equipped;
}
