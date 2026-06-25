import { CheckCircle2, FlaskConical, Quote, Sparkles } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPromptForDisplay } from '@/lib/prompt';
import type { CharacterPreset, LanguageCode, ProductPreset, VideoTemplate } from '@/lib/types';
import StepHeading, { FieldLabel } from './StepHeading';

const LANG_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
};

const GCP_SERVICES = [
  { name: 'Gemini Omni', color: '#2986FF' },
  { name: 'Cloud Storage', color: '#EA4335' },
  { name: 'Firestore', color: '#FFC30E' },
];

interface ReviewGenerateProps {
  testMode: boolean;
  userName: string;
  selectedProduct: ProductPreset | null;
  selectedTemplate: VideoTemplate | null;
  videoPrompt: string;
  dialogueText: string;
  selectedLanguage: LanguageCode;
  selectedCharacter: CharacterPreset | null;
  characterImageFile: File | null;
  onGenerate: () => void | Promise<void>;
}

export default function ReviewGenerate({
  testMode,
  userName,
  selectedProduct,
  selectedTemplate,
  videoPrompt,
  dialogueText,
  selectedLanguage,
  selectedCharacter,
  characterImageFile,
  onGenerate,
}: ReviewGenerateProps) {
  const presenterLabel = selectedCharacter
    ? `${selectedCharacter.name}${selectedCharacter.gender ? ` · ${selectedCharacter.gender === 'M' ? 'Male' : 'Female'}` : ''}`
    : characterImageFile
      ? 'Custom image selected'
      : 'Missing presenter';

  const checklist = [
    {
      label: 'Director',
      value: userName || 'Not registered',
      ready: userName.trim().length >= 2,
    },
    {
      label: 'Product',
      value: selectedProduct?.name ?? 'Not selected',
      meta: selectedProduct?.tagline,
      ready: !!selectedProduct,
    },
    {
      label: 'Dialogue',
      value: dialogueText?.trim() || 'Skipped - visual-only scene',
      meta: LANG_NAMES[selectedLanguage] ?? selectedLanguage,
      ready: true,
    },
    {
      label: 'Presenter',
      value: presenterLabel,
      ready: !!selectedCharacter || !!characterImageFile,
    },
    {
      label: 'Scenario',
      value: selectedTemplate?.title ?? 'Not selected',
      meta: selectedTemplate?.location,
      ready: !!selectedTemplate,
      accent: selectedTemplate?.accent,
    },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 6 of 6" title="Review & launch campaign" className="mb-0">
        Confirm your campaign details before Gemini Omni compiles and generates the advertisement.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col gap-2.5 lg:col-span-7">
          {testMode && (
            <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/[0.08] px-4 py-2">
              <FlaskConical className="h-4 w-4 flex-shrink-0 text-warning" />
              <span className="text-xs text-foreground/80 font-medium">
                <span className="font-semibold text-warning">Test mode active</span> — uses
                placeholder assets, bypasses GCP billing.
              </span>
            </div>
          )}

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-sm">
            <div className="ai-gradient-line h-0.5 w-full" />
            <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-2 p-3">
              <div>
                <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Campaign Board
                </FieldLabel>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  Final parameters for the Gemini Omni generation flow.
                </p>
              </div>
              <div className="grid min-h-0 grid-rows-5 gap-1.5">
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className="grid min-h-0 grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-border/70 bg-muted/15 px-3 py-1.5"
                  >
                    <CheckCircle2
                      className={
                        item.ready ? 'h-4 w-4 text-success' : 'h-4 w-4 text-muted-foreground'
                      }
                    />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          {item.label}
                        </span>
                        {item.meta && (
                          <span className="truncate text-xs font-medium text-muted-foreground">
                            {item.meta}
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-0.5 line-clamp-1 text-[13px] font-semibold text-foreground"
                        style={{ color: item.ready ? undefined : 'hsl(var(--muted-foreground))' }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="flex min-h-0 flex-[1.1] flex-col p-4 shadow-sm">
            <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Synthesized Creative Brief (Prompt)
            </FieldLabel>
            <p className="mt-2 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/40 bg-muted/10 p-4 text-sm font-medium leading-relaxed text-foreground/85 xl:text-[15px]">
              {formatPromptForDisplay(videoPrompt)}
            </p>
          </Card>
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:col-span-5">
          <Card className="p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <FieldLabel className="mb-0 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Google Cloud Platform Path
              </FieldLabel>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GCP_SERVICES.map(({ name, color }) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/20 px-2.5 py-1"
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold text-muted-foreground">{name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-1 flex-col justify-between border-foreground/20 bg-foreground/[0.02] p-5 shadow-sm">
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4" />
                  Gemini Omni Multimodal Synthesis
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The model will synthesize a high-fidelity video showcasing the product, matching
                  the visual style, maintaining presenter likeness, and performing native lip-sync
                  in the selected language.
                </p>
              </div>
              {dialogueText?.trim() && (
                <div className="flex gap-2 rounded-lg bg-muted/25 p-3">
                  <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <p className="line-clamp-2 text-sm italic leading-relaxed text-foreground/85">
                    "{dialogueText}"
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={onGenerate}
              size="lg"
              className="generate-google-border mt-4 w-full rounded-lg py-6 text-base font-bold shadow-lg transition-all duration-200"
            >
              {testMode ? 'Launch Campaign (Test Mode)' : 'Launch Campaign with Omni →'}
            </Button>
            <p className="mt-3 text-center text-xs leading-normal text-muted-foreground font-medium">
              {testMode
                ? 'Creates a mock campaign video instantaneously.'
                : 'Renders in 3–8 minutes. A QR code will be provided so you can check back anytime.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
