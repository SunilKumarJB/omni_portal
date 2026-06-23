import { FlaskConical, MapPin, Quote, Sparkles } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StepHeading, { FieldLabel } from './StepHeading.jsx';

const LANG_NAMES = {
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
  { name: 'Omni', color: '#2986FF' },
  { name: 'Nano Banana', color: '#2EBA53' },
  { name: 'Cloud Storage', color: '#EA4335' },
  { name: 'Firestore', color: '#FFC30E' },
];

export default function ReviewGenerate({
  testMode,
  selectedTemplate,
  videoPrompt,
  dialogueText,
  selectedLanguage,
  selectedCharacter,
  characterImageFile,
  selectedAudio,
  audioFile,
  onGenerate,
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <StepHeading eyebrow="Step 5 of 5" title="Review & generate">
        Confirm everything looks right, then let Omni do its thing.
      </StepHeading>

      {testMode && (
        <div className="flex items-center gap-3 rounded-md border border-warning/30 bg-warning/[0.08] px-4 py-3">
          <FlaskConical className="h-4 w-4 flex-shrink-0 text-warning" />
          <span className="text-sm text-foreground/80">
            <span className="font-semibold text-warning">Test mode</span> — placeholder video, no
            real GCP calls.
          </span>
        </div>
      )}

      {/* Scenario card */}
      {selectedTemplate && (
        <Card className="overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: selectedTemplate.accent }} />
          <div className="space-y-2 p-4">
            <FieldLabel>Scenario</FieldLabel>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{selectedTemplate.emoji}</span>
              <span className="text-sm font-semibold text-foreground">
                {selectedTemplate.title}
              </span>
            </div>
            {selectedTemplate.id !== 'custom' && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" style={{ color: selectedTemplate.accent }} />
                {selectedTemplate.location}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Dialogue card */}
      {dialogueText?.trim() && (
        <Card className="overflow-hidden">
          <div className="ai-gradient-line h-0.5 w-full" />
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <FieldLabel>Dialogue</FieldLabel>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
                {LANG_NAMES[selectedLanguage] ?? selectedLanguage}
              </span>
            </div>
            <div className="flex gap-2">
              <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p
                className="text-sm italic leading-relaxed text-foreground/80"
                lang={selectedLanguage}
              >
                {dialogueText}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Prompt */}
      <Card className="p-5">
        <FieldLabel>Prompt</FieldLabel>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {videoPrompt}
        </p>
      </Card>

      {/* Character + Audio */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <FieldLabel>Character</FieldLabel>
          {selectedCharacter ? (
            <div className="mt-1 flex items-center gap-2.5">
              <span className="text-2xl">{selectedCharacter.avatar}</span>
              <span className="text-sm font-medium text-foreground">{selectedCharacter.name}</span>
            </div>
          ) : characterImageFile ? (
            <span className="mt-1 block text-sm text-success">Custom image</span>
          ) : (
            <span className="mt-1 block text-xs text-muted-foreground">—</span>
          )}
        </Card>

        <Card className="p-5">
          <FieldLabel>Audio</FieldLabel>
          {selectedAudio ? (
            <div className="mt-1 flex items-center gap-2.5">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted/50">
                <div className="h-2 w-2 rounded-full bg-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{selectedAudio.name}</span>
            </div>
          ) : audioFile ? (
            <span className="mt-1 block text-sm text-success">Custom audio</span>
          ) : (
            <span className="mt-1 block text-xs text-muted-foreground">—</span>
          )}
        </Card>
      </div>

      {/* GCP services — the sanctioned four-color accent moment */}
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <FieldLabel className="mb-0">Powered by</FieldLabel>
        </div>
        <div className="flex flex-wrap gap-2">
          {GCP_SERVICES.map(({ name, color }) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5"
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Generate CTA */}
      <div className="pt-3">
        <Button onClick={onGenerate} size="lg" className="w-full rounded-lg py-6 text-base">
          {testMode ? 'Generate (test mode)' : 'Generate video with Omni →'}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {testMode
            ? 'Returns a placeholder video instantly'
            : "Generation takes 3–8 minutes · You'll get a QR code to return anytime"}
        </p>
      </div>
    </div>
  );
}
