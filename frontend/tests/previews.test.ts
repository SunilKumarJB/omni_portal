import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PromptSelector from '../src/components/PromptSelector';
import { VIDEO_TEMPLATES } from '../src/data/scenarios';

test('scenario grid and selected detail do not load video before user interaction', () => {
  for (const selectedTemplate of [null, VIDEO_TEMPLATES[0]]) {
    const html = renderToStaticMarkup(
      createElement(PromptSelector, {
        userName: 'Maya',
        selectedProduct: null,
        selectedTemplate,
        setSelectedTemplate: () => {},
        videoPrompt: '',
        setVideoPrompt: () => {},
        onResetPrompt: () => {},
        dialogueText: '',
      }),
    );
    assert.doesNotMatch(html, /<video|\.mp4/);
    assert.match(html, /\.webp/);
    if (selectedTemplate) assert.match(html, /Play preview/);
  }
});

test('all video scenarios have small existing WebP posters', () => {
  for (const template of VIDEO_TEMPLATES.filter((item) => item.videoSrc)) {
    assert.ok(template.poster);
    const data = readFileSync(new URL(`../public${template.poster}`, import.meta.url));
    assert.equal(data.toString('ascii', 8, 12), 'WEBP');
    assert.ok(data.length < 50_000, `${template.title} poster exceeds 50 KB`);
  }
});
