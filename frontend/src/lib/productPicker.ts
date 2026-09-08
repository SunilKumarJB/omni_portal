/** Fisher-Yates on a copy; `random` is injectable so the pick can be tested deterministically. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks `count` products at random, allowing at most `maxPerCategory` from any one category
 * so the six on screen read as a range. If the cap cannot fill every slot (small catalog),
 * the remaining slots are topped up without the cap rather than left empty.
 */
export function pickHeroProducts<T extends { category: string }>(
  catalog: readonly T[],
  count: number,
  maxPerCategory: number,
  random: () => number = Math.random,
): T[] {
  const shuffled = shuffle(catalog, random);
  const perCategory = new Map<string, number>();
  const picked: T[] = [];

  for (const product of shuffled) {
    if (picked.length >= count) break;
    const used = perCategory.get(product.category) ?? 0;
    if (used >= maxPerCategory) continue;
    perCategory.set(product.category, used + 1);
    picked.push(product);
  }

  for (const product of shuffled) {
    if (picked.length >= count) break;
    if (!picked.includes(product)) picked.push(product);
  }

  return picked;
}
