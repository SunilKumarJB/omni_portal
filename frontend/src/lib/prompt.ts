export function formatPromptForDisplay(prompt?: string | null) {
  if (!prompt) return '';

  return prompt
    .replace(/\[REF_Character\]'s/g, "the selected presenter's")
    .replace(/\[REF_Character\]/g, 'the selected presenter');
}
