import { Pencil, Quote, RotateCcw, Volume2 } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { LanguageCode, ProductPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading, { FieldLabel } from './StepHeading';

/* Types */

interface Language {
  code: LanguageCode;
  name: string;
  native: string;
  script: string;
}

interface Props {
  userName: string;
  selectedProduct: ProductPreset | null;
  selectedLanguage: LanguageCode;
  setSelectedLanguage: React.Dispatch<React.SetStateAction<LanguageCode>>;
  dialogueText: string;
  setDialogueText: React.Dispatch<React.SetStateAction<string>>;
  /** Set once the director has typed here; lives in the parent so it survives unmount. */
  dialogueTouched: boolean;
  setDialogueTouched: React.Dispatch<React.SetStateAction<boolean>>;
}

/* Language list */

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
];

/** What a product-less step shows: an empty line in every language. */
const EMPTY_DIALOGUE: Record<LanguageCode, string> = {
  en: '',
  hi: '',
  ta: '',
  te: '',
  kn: '',
  ml: '',
  bn: '',
  mr: '',
  gu: '',
  pa: '',
};

/* Component */

export default function DialogueSelector({
  userName,
  selectedProduct,
  selectedLanguage,
  setSelectedLanguage,
  dialogueText,
  setDialogueText,
  dialogueTouched,
  setDialogueTouched,
}: Props) {
  const translations = selectedProduct?.dialogue ?? EMPTY_DIALOGUE;
  const original = translations['en'] ?? '';
  const rawTranslated = translations[selectedLanguage] ?? original;

  // Replace [Character_Name] with the actual character name
  const cName = userName || 'our character';
  const translated = rawTranslated.replace(/\[Character_Name\]/g, cName);

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage)!;

  // The dialogue lives in the parent, so entering the step seeds it with the default
  // translation for the current product/name. Once the director has typed here —
  // including clearing the line on purpose — their text is never overwritten again.
  useEffect(() => {
    if (!dialogueTouched) setDialogueText(translated);
  }, []);

  function handleLanguageSelect(code: LanguageCode) {
    setSelectedLanguage(code);
    if (dialogueTouched) return; // keep the director's own line
    const rawSel = translations[code] ?? '';
    setDialogueText(rawSel.replace(/\[Character_Name\]/g, cName));
  }

  function handleReset() {
    setDialogueText(translated);
    setDialogueTouched(false);
  }

  const isEdited = dialogueTouched && dialogueText !== translated;

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 3 of 6" title="Choose your dialogue" className="mb-0">
        Select a language — then edit the dialogue if you want to customise it.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-card/70 p-4 shadow-sm lg:col-span-5">
          <FieldLabel className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Select language
          </FieldLabel>

          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-5 gap-2.5">
            {LANGUAGES.map((lang) => {
              const active = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={cn(
                    'flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-3 py-2 text-center transition-all duration-200',
                    'hover:scale-[1.02] active:scale-98',
                    active
                      ? 'border-foreground bg-foreground/5 ring-1 ring-foreground shadow-sm'
                      : 'border-border bg-background/35 hover:border-foreground/30 hover:bg-accent/40 hover:shadow-md hover:shadow-black/5',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-bold leading-none transition-colors duration-150 xl:text-base',
                      active ? 'text-foreground' : 'text-foreground/90',
                    )}
                  >
                    {lang.native}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7">
          <div className="w-full min-w-0 rounded-xl border border-border bg-card/70 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Spoken Preview
            </div>

            <div className="flex w-full min-w-0 items-center gap-4 pt-2">
              <div className="flex flex-shrink-0 flex-col items-center gap-2">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border bg-background text-2xl shadow-md transition-all duration-300 border-border">
                  <span className="animate-pulse-slow">
                    {selectedProduct ? selectedProduct.emoji : '🎙️'}
                  </span>
                </div>
                <span className="text-xs xl:text-sm font-bold text-muted-foreground tracking-wider uppercase truncate max-w-[90px] xl:max-w-[110px]">
                  {selectedProduct ? selectedProduct.name.split(' ').pop() : 'Presenter'}
                </span>
              </div>

              <div className="relative flex min-h-[72px] min-w-0 flex-1 items-center rounded-xl border border-border/60 bg-muted/30 p-4 shadow-inner">
                <div className="-left-2.5 absolute top-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-border/60" />
                <div className="-left-2 absolute top-6 h-0 w-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-muted/30" />

                <p
                  className={cn(
                    'line-clamp-2 w-full text-base leading-relaxed transition-all duration-200',
                    dialogueText.trim()
                      ? 'text-foreground font-medium italic font-display'
                      : 'text-muted-foreground/60 italic text-xs xl:text-sm',
                  )}
                  lang={selectedLanguage}
                >
                  {dialogueText.trim() ? `"${dialogueText}"` : 'Silence (no spoken dialogue)...'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-card/70 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <FieldLabel className="mb-0 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  {selectedProduct?.id === 'custom'
                    ? `Write dialogue in ${currentLang.name}`
                    : `Edit spoken dialogue · ${currentLang.name}`}
                </FieldLabel>
              </div>
              {isEdited && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground underline underline-offset-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>

            <Textarea
              value={dialogueText}
              onChange={(e) => {
                setDialogueText(e.target.value);
                setDialogueTouched(true);
              }}
              placeholder={
                selectedProduct?.id === 'custom'
                  ? `Write the spoken dialogue in ${currentLang.name}…`
                  : `Dialogue in ${currentLang.name}…`
              }
              rows={3}
              maxLength={500}
              lang={selectedLanguage}
              className="resize-none overflow-hidden bg-background text-sm leading-relaxed"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {isEdited ? (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Customised
                </span>
              ) : (
                <span>This line will be spoken by your character in the video</span>
              )}
              <span className="tabular-nums font-medium">{dialogueText.length} / 500</span>
            </div>
          </div>

          {selectedProduct && selectedProduct.id !== 'custom' && (
            <div className="overflow-hidden rounded-xl border border-border bg-card/70 shadow-sm">
              <div className="h-0.5 bg-border" />
              <div className="flex gap-3 px-4 py-3">
                <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div>
                  <FieldLabel className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    Original Product Script Reference · English
                  </FieldLabel>
                  <p className="line-clamp-2 text-sm italic leading-relaxed text-foreground/75">
                    "{original}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedLanguage !== 'en' && selectedProduct?.id !== 'custom' && translated && (
            <div className="space-y-1 rounded-xl border border-border bg-card/70 bg-muted/5 px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                <FieldLabel className="mb-0 block text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Official translation reference · {currentLang.name}
                </FieldLabel>
              </div>
              <p
                className="line-clamp-2 pl-5 text-sm font-medium leading-relaxed text-foreground/80"
                lang={selectedLanguage}
              >
                {translated}
              </p>
            </div>
          )}

          {!dialogueText.trim() && (
            <p className="text-center text-xs text-muted-foreground/70 italic pt-1">
              Leave blank to generate the video without spoken dialogue (only soundtrack and video)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
