import { TAILORED_PROMPTS } from '../data/scenarios';
import type { LanguageCode, ProductPreset, VideoTemplate } from './types';

export function defaultDialogue(
  product: ProductPreset | null,
  name: string,
  language: LanguageCode,
) {
  return (product?.dialogue[language] ?? '').replace(
    /\[Character_Name\]/g,
    name.trim() || 'our presenter',
  );
}

export function buildVideoPrompt(
  template: VideoTemplate,
  product: ProductPreset | null,
  name: string,
) {
  if (template.id === 'custom') return '';
  const productName = product?.name ?? 'the product';
  const scene = (TAILORED_PROMPTS[template.id]?.[product?.posture ?? 'active'] ?? template.prompt)
    .replace(/the product|the vehicle/g, productName)
    .replace(/product's|vehicle's/g, `${productName}'s`);
  return `Create a product video for ${productName}, starring ${name.trim() || 'our presenter'} (represented by [REF_Character]). Product action and appearance: [REF_Character] is ${product?.visualDescription ?? 'showcasing the product'}. Use one consistent setting, weather, and lighting from the following scene: ${scene}`;
}

export function briefContext(product: ProductPreset | null, name: string) {
  return `${product?.id ?? ''}:${name.trim()}`;
}

export interface PromptDraft {
  text: string;
  context: string;
}

export function speechMayBeTooLong(text: string, seconds: number) {
  // A gentle estimate, not a language-independent speech-duration guarantee.
  return (
    text.trim().split(/\s+/).filter(Boolean).length > seconds * 2.5 || text.length > seconds * 15
  );
}
