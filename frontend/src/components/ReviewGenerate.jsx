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
    <div className="mx-auto max-w-[1360px] space-y-6">
      <StepHeading eyebrow="Step 5 of 5" title="Review & generate" className="mb-0">
        Confirm everything looks right, then let Omni do its thing.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Creative parameters */}
        <div className="lg:col-span-7 space-y-4">
          {testMode && (
            <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/[0.08] px-4 py-3">
              <FlaskConical className="h-4 w-4 flex-shrink-0 text-warning" />
              <span className="text-xs text-foreground/80 font-medium">
                <span className="font-semibold text-warning">Test mode active</span> — uses
                placeholder assets, bypasses GCP billing.
              </span>
            </div>
          )}

          {/* Scenario card */}
          {selectedTemplate && (
            <Card className="overflow-hidden shadow-sm">
              <div className="h-0.5 w-full" style={{ background: selectedTemplate.accent }} />
              <div className="space-y-3 p-4">
                <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Scenario
                </FieldLabel>
                <div className="flex items-center gap-2.5">
                  <span className="text-xl leading-none">{selectedTemplate.emoji}</span>
                  <span className="text-base font-bold text-foreground">
                    {selectedTemplate.title}
                  </span>
                </div>
                {selectedTemplate.id !== 'custom' && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <MapPin className="h-3.5 w-3.5" style={{ color: selectedTemplate.accent }} />
                    {selectedTemplate.location}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Dialogue card */}
          {dialogueText?.trim() && (
            <Card className="overflow-hidden shadow-sm">
              <div className="ai-gradient-line h-0.5 w-full" />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dialogue
                  </FieldLabel>
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {LANG_NAMES[selectedLanguage] ?? selectedLanguage}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <p
                    className="text-sm italic leading-relaxed text-foreground/85 font-medium"
                    lang={selectedLanguage}
                  >
                    "{dialogueText}"
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Prompt */}
          <Card className="p-5 shadow-sm space-y-3">
            <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prompt
            </FieldLabel>
            <p className="whitespace-pre-wrap text-sm xl:text-base leading-relaxed text-foreground/80 bg-muted/10 p-3 rounded-lg border border-border/40">
              {videoPrompt}
            </p>
          </Card>
        </div>

        {/* Right Column: Presenter, Audio & GCP metadata + CTA */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          {/* Character + Audio grid in side panel */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Card className="p-4 shadow-sm space-y-2">
              <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Presenter
              </FieldLabel>
              {selectedCharacter ? (
                <div className="flex items-center gap-3 pt-1">
                  <div
                    className="h-9 w-9 rounded-lg overflow-hidden border border-border flex items-center justify-center text-xl bg-muted/40"
                    style={{ background: selectedCharacter.bg }}
                  >
                    <img
                      src={selectedCharacter.img}
                      alt={selectedCharacter.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground block">
                      {selectedCharacter.name}
                    </span>
                    {selectedCharacter.gender && (
                      <span className="text-xs text-muted-foreground block">
                        {selectedCharacter.gender === 'M' ? 'Male' : 'Female'}
                      </span>
                    )}
                  </div>
                </div>
              ) : characterImageFile ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-success font-semibold bg-success/10 px-2.5 py-1 rounded-md mt-1">
                  Custom image selected
                </span>
              ) : (
                <span className="block text-xs text-muted-foreground italic mt-1">—</span>
              )}
            </Card>

            <Card className="p-4 shadow-sm space-y-2">
              <FieldLabel className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Soundtrack
              </FieldLabel>
              {selectedAudio ? (
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground block truncate max-w-[140px]">
                      {selectedAudio.name}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {selectedAudio.mood} · {selectedAudio.bpm} BPM
                    </span>
                  </div>
                </div>
              ) : audioFile ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-success font-semibold bg-success/10 px-2.5 py-1 rounded-md mt-1">
                  Custom audio selected
                </span>
              ) : (
                <span className="block text-xs text-muted-foreground italic mt-1">
                  No soundtrack (will be silent)
                </span>
              )}
            </Card>
          </div>

          {/* GCP Services */}
          <Card className="p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <FieldLabel className="mb-0 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Powered by GCP
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

          {/* Generate Action Card */}
          <Card className="p-5 border-foreground/20 bg-foreground/[0.02] shadow-sm">
            <Button
              onClick={onGenerate}
              size="lg"
              className="w-full rounded-lg py-6 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {testMode ? 'Generate (Test Mode)' : 'Generate Video with Omni →'}
            </Button>
            <p className="mt-3 text-center text-xs leading-normal text-muted-foreground font-medium">
              {testMode
                ? 'Creates a mock video asset instantaneously.'
                : 'Renders in 3–8 minutes. A QR code will be provided so you can check back anytime.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
