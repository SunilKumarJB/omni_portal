import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PRODUCT_CATALOG } from '../src/data/products';
import { VIDEO_TEMPLATES } from '../src/data/scenarios';
import { buildVideoPrompt, defaultDialogue, speechMayBeTooLong } from '../src/lib/videoBrief';

const kettle = PRODUCT_CATALOG.find((p) => p.id === 'telepathic_kettle')!;
const lamp = PRODUCT_CATALOG.find((p) => p.id === 'mood_lamp')!;
const tiffin = PRODUCT_CATALOG.find((p) => p.name === 'Smart Tiffin')!;
const monsoon = VIDEO_TEMPLATES.find((t) => t.id === 'monsoon_drama')!;

test('changing the product and name updates all generated text', () => {
  const before = buildVideoPrompt(monsoon, kettle, 'Maya');
  const after = buildVideoPrompt(monsoon, lamp, 'Asha');
  assert.match(before, /Telepathic Kettle/);
  assert.match(after, /Mood Lamp/);
  assert.match(after, /Asha/);
  assert.doesNotMatch(after, /Telepathic Kettle|Maya/);
  assert.match(defaultDialogue(lamp, 'Asha', 'en'), /Asha/);
  assert.doesNotMatch(defaultDialogue(lamp, 'Asha', 'en'), /Telepathic Kettle|\[Character_Name\]/);
});

test('product action does not add an office to the houseboat scene', () => {
  const prompt = buildVideoPrompt(monsoon, tiffin, 'Maya');
  assert.match(prompt, /houseboat/);
  assert.match(prompt, /stainless-steel/);
  assert.doesNotMatch(prompt, /sunny office|office desk/);
});

test('custom scene starts blank and empty speech does not trigger length guidance', () => {
  assert.equal(
    buildVideoPrompt(VIDEO_TEMPLATES.find((t) => t.id === 'custom')!, kettle, 'Maya'),
    '',
  );
  assert.equal(speechMayBeTooLong('', 10), false);
  assert.equal(speechMayBeTooLong('A short line.', 10), false);
  assert.equal(speechMayBeTooLong('word '.repeat(40), 10), true);
});
