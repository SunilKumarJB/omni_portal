import type {
  CharacterPreset,
  LanguageCode,
  ProductPreset,
  VideoRequestData,
  VideoTemplate,
} from './types';
import type { PromptDraft } from './videoBrief';

export interface VideoDraft {
  version: 1;
  currentStep: number;
  userName: string;
  heroProducts: ProductPreset[];
  selectedProduct: ProductPreset | null;
  selectedLanguage: LanguageCode;
  dialogueText: string;
  dialogueTouched: boolean;
  dialogueContext: string;
  selectedCharacter: CharacterPreset | null;
  characterImageFile: File | null;
  selectedTemplate: VideoTemplate | null;
  promptDrafts: Record<string, PromptDraft>;
  duration: number;
  aspectRatio: '16:9' | '9:16';
  requestData: VideoRequestData | null;
}

type StoredDraft = Omit<VideoDraft, 'version' | 'characterImageFile'> & { version: 2 };

let memory: VideoDraft | null = null;
let connection: Promise<IDBDatabase> | undefined;
let persistedPhoto: File | null | undefined;
let pending: VideoDraft | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let maxWaitTimer: ReturnType<typeof setTimeout> | undefined;
let writes: Promise<void> = Promise.resolve();
let waiters: { resolve: () => void; reject: (error: unknown) => void }[] = [];

function database() {
  if (connection) return connection;
  connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('omni-video-draft', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      connection = undefined;
      reject(request.error);
    };
  });
  return connection;
}

export async function loadDraft(): Promise<VideoDraft | null> {
  if (memory) return memory;
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts');
    const store = transaction.objectStore('drafts');
    const request = store.get('current');
    const photo = store.get('photo');
    transaction.oncomplete = () => {
      // A save may have happened while the database was opening.
      if (!memory) {
        const value = request.result;
        if (value?.version === 1) {
          memory = value as VideoDraft;
          // The next save moves the old embedded File to its own record.
          persistedPhoto = undefined;
        } else if (value?.version === 2) {
          persistedPhoto = photo.result ?? null;
          memory = { ...value, version: 1, characterImageFile: persistedPhoto };
        }
      }
      resolve(memory);
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function persist(value: VideoDraft): Promise<void> {
  const db = await database();
  const { characterImageFile, version: _version, ...fields } = value;
  const stored: StoredDraft = { ...fields, version: 2 };
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    store.put(stored, 'current');
    // Text edits must not serialize and rewrite the uploaded photo.
    if (characterImageFile !== persistedPhoto) {
      if (characterImageFile) store.put(characterImageFile, 'photo');
      else store.delete('photo');
    }
    transaction.oncomplete = () => {
      persistedPhoto = characterImageFile;
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** Commit queued text before step changes, route changes, or hiding the page. */
export function flushDraft(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = undefined;
  if (maxWaitTimer) clearTimeout(maxWaitTimer);
  maxWaitTimer = undefined;
  if (!pending) return writes;
  const value = pending;
  const listeners = waiters;
  pending = null;
  waiters = [];
  // Serialize transactions, but allow a later save to recover from a failed one.
  writes = writes.catch(() => {}).then(() => persist(value));
  void writes.then(
    () => {
      for (const listener of listeners) listener.resolve();
    },
    (error: unknown) => {
      for (const listener of listeners) listener.reject(error);
    },
  );
  return writes;
}

export function saveDraft(value: VideoDraft): Promise<void> {
  const previous = memory;
  memory = value;
  pending = value;
  const result = new Promise<void>((resolve, reject) => waiters.push({ resolve, reject }));
  const needsImmediateSave =
    !previous ||
    previous.currentStep !== value.currentStep ||
    previous.characterImageFile !== value.characterImageFile ||
    previous.requestData !== value.requestData;
  if (needsImmediateSave) {
    void flushDraft().catch(() => {});
  } else {
    if (!maxWaitTimer) {
      maxWaitTimer = setTimeout(() => {
        void flushDraft().catch(() => {});
      }, 2000);
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void flushDraft().catch(() => {});
    }, 500);
  }
  return result;
}
