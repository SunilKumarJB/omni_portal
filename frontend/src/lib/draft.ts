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

let memory: VideoDraft | null = null;
let connection: Promise<IDBDatabase> | undefined;
function database() {
  if (connection) return connection;
  connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('omni-video-draft', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return connection;
}

export async function loadDraft(): Promise<VideoDraft | null> {
  if (memory) return memory;
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction('drafts').objectStore('drafts').get('current');
    request.onsuccess = () => {
      const value = request.result;
      memory = value?.version === 1 ? value : null;
      resolve(memory);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraft(value: VideoDraft) {
  memory = value;
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    transaction.objectStore('drafts').put(value, 'current');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
