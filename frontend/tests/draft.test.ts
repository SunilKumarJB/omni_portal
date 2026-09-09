import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { flushDraft, loadDraft, saveDraft, type VideoDraft } from '../src/lib/draft';

const fixture: VideoDraft = {
  version: 1,
  currentStep: 1,
  userName: 'Maya',
  heroProducts: [],
  selectedProduct: null,
  selectedLanguage: 'en',
  dialogueText: '',
  dialogueTouched: false,
  dialogueContext: '',
  selectedCharacter: null,
  characterImageFile: new File(['photo'], 'photo.png', { type: 'image/png' }),
  selectedTemplate: null,
  promptDrafts: {},
  duration: 10,
  aspectRatio: '16:9',
  requestData: null,
};

function read(db: IDBDatabase, key: 'current'): Promise<Record<string, unknown>>;
function read(db: IDBDatabase, key: 'photo'): Promise<unknown>;
function read(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = db.transaction('drafts').objectStore('drafts').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

test('draft storage migrates photos, groups text edits, and flushes navigation', async () => {
  globalThis.indexedDB = new IDBFactory();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('omni-video-draft', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve) => {
    const tx = db.transaction('drafts', 'readwrite');
    tx.objectStore('drafts').put(fixture, 'current');
    tx.oncomplete = () => resolve();
  });

  const draft = await loadDraft();
  assert.equal(draft?.userName, 'Maya');
  assert.ok(draft?.characterImageFile);
  assert.ok(draft);

  const writes: IDBValidKey[] = [];
  const originalPut = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value, key) {
    if (key) writes.push(key);
    return originalPut.call(this, value, key);
  };
  try {
    const migration = saveDraft({ ...draft, userName: 'Asha' });
    await flushDraft();
    await migration;
    assert.equal((await read(db, 'current')).version, 2);
    assert.equal((await read(db, 'current')).characterImageFile, undefined);
    assert.ok(await read(db, 'photo'));
    assert.deepEqual(writes, ['current', 'photo']);
    const reloadPath = '../src/lib/draft.ts?reload';
    const restoredStorage = await import(reloadPath);
    const restored = await restoredStorage.loadDraft();
    assert.equal(restored.userName, 'Asha');
    assert.ok(restored.characterImageFile);
    assert.equal(restored.version, 1);

    writes.length = 0;
    const first = saveDraft({ ...draft, userName: 'A' });
    const second = saveDraft({ ...draft, userName: 'Ash' });
    const third = saveDraft({ ...draft, userName: 'Asha Rao' });
    assert.equal((await loadDraft())?.userName, 'Asha Rao');
    assert.equal((await read(db, 'current')).userName, 'Asha');
    await Promise.all([first, second, third]);
    assert.equal((await read(db, 'current')).userName, 'Asha Rao');
    assert.deepEqual(writes, ['current']);

    writes.length = 0;
    const typing = saveDraft({ ...draft, userName: 'Changed before navigation' });
    const navigation = saveDraft({
      ...draft,
      userName: 'Changed before navigation',
      currentStep: 2,
    });
    await Promise.all([typing, navigation]);
    assert.equal((await read(db, 'current')).currentStep, 2);
    assert.deepEqual(writes, ['current']);

    writes.length = 0;
    const replacement = new File(['replacement'], 'new.png', { type: 'image/png' });
    const photoSave = saveDraft({ ...draft, characterImageFile: replacement });
    const removal = saveDraft({ ...draft, characterImageFile: null });
    await Promise.all([photoSave, removal]);
    assert.equal(await read(db, 'photo'), undefined);
    assert.equal((await read(db, 'current')).characterImageFile, undefined);
    assert.deepEqual(writes, ['current', 'photo', 'current']);

    const lastEdit = saveDraft({ ...draft, characterImageFile: null, userName: 'Page hidden' });
    await flushDraft();
    await lastEdit;
    assert.equal((await read(db, 'current')).userName, 'Page hidden');
  } finally {
    IDBObjectStore.prototype.put = originalPut;
    db.close();
  }
});
