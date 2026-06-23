import { FlaskConical } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PortalMark } from '@/components/AppHeader';
import SideRail from '@/components/SideRail';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { generateVideo } from '../lib/api';
import type {
  AudioPreset,
  CharacterPreset,
  GenerationStatus,
  LanguageCode,
  VideoRequestData,
  VideoTemplate,
} from '../lib/types';

const STEPS: { id: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { id: 1, label: 'Scenario' },
  { id: 2, label: 'Dialogue' },
  { id: 3, label: 'Character' },
  { id: 4, label: 'Audio' },
  { id: 5, label: 'Review' },
];

const PromptSelector = lazy(() => import('../components/PromptSelector'));
const DialogueSelector = lazy(() => import('../components/DialogueSelector'));
const CharacterSelector = lazy(() => import('../components/CharacterSelector'));
const AudioSelector = lazy(() => import('../components/AudioSelector'));
const ReviewGenerate = lazy(() => import('../components/ReviewGenerate'));
const ResultPanel = lazy(() => import('../components/ResultPanel'));

function StepFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  );
}

export default function Home() {
  const [testMode, setTestMode] = useState(() => localStorage.getItem('omni-test-mode') === 'true');
  const [currentStep, setCurrentStep] = useState(1);
  const [generationState, setGenerationState] = useState<'submitting' | 'done' | 'error' | null>(
    null,
  );
  const [requestData, setRequestData] = useState<VideoRequestData | null>(null);

  // Step 1
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  // Step 2
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [dialogueText, setDialogueText] = useState('');
  // Step 3
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterPreset | null>(null);
  const [characterImageFile, setCharacterImageFile] = useState<File | null>(null);
  // Step 4
  const [selectedAudio, setSelectedAudio] = useState<AudioPreset | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    localStorage.setItem('omni-test-mode', String(testMode));
  }, [testMode]);

  const canGoNext = useCallback(() => {
    if (currentStep === 1) return !!selectedTemplate && videoPrompt.trim().length >= 10;
    if (currentStep === 2) return true; // dialogue is optional
    if (currentStep === 3) return !!selectedCharacter || !!characterImageFile;
    if (currentStep === 4) return true; // audio is optional
    return true;
  }, [currentStep, selectedTemplate, videoPrompt, selectedCharacter, characterImageFile]);

  const nextRequirement = (() => {
    if (currentStep === 1 && !selectedTemplate) return 'Select a scenario to continue.';
    if (currentStep === 1 && videoPrompt.trim().length < 10) {
      return 'Add a short prompt so Omni has enough direction.';
    }
    if (currentStep === 3 && !selectedCharacter && !characterImageFile) {
      return 'Choose or upload a presenter to continue.';
    }
    if (currentStep === 2) return 'Dialogue is optional. Continue or skip this step.';
    if (currentStep === 4) return 'Audio is optional. Continue or skip without audio.';
    return 'Ready for the next step.';
  })();

  /**
   * Fetches a public asset URL and returns it as a File object.
   * Returns null silently if the file is missing or the fetch fails.
   */
  async function fetchAsFile(
    url: string,
    filename: string,
    mimeType: string,
  ): Promise<File | null> {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return new File([blob], filename, { type: mimeType });
    } catch {
      return null;
    }
  }

  const handleGenerate = async () => {
    setGenerationState('submitting');
    try {
      if (testMode) {
        const requestId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `test-${Date.now()}`;
        setRequestData({
          request_id: requestId,
          status: 'completed' as GenerationStatus,
          progress: 100,
          prompt: videoPrompt,
          dialogue: dialogueText.trim() || undefined,
          language: selectedLanguage,
          video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          video_page_url: `${window.location.origin}/video/${requestId}`,
          qr_code_url: null,
          created_at: new Date().toISOString(),
        });
        setGenerationState('done');
        return;
      }

      // Resolve preset character and audio in parallel (eliminating network waterfall)
      const [resolvedCharacterImage, resolvedAudioFile] = await Promise.all([
        (async () => {
          if (!characterImageFile && selectedCharacter?.img) {
            const ext = selectedCharacter.img.split('.').pop();
            const mime = ext === 'svg' ? 'image/svg+xml' : 'image/png';
            return fetchAsFile(selectedCharacter.img, `${selectedCharacter.id}.${ext}`, mime);
          }
          return characterImageFile;
        })(),
        (async () => {
          if (!audioFile && selectedAudio?.src) {
            const ext = selectedAudio.src.split('.').pop();
            const mime = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`;
            return fetchAsFile(selectedAudio.src, `${selectedAudio.id}.${ext}`, mime);
          }
          return audioFile;
        })(),
      ]);

      // Dialogue + language are first-class: the backend speaks the line in the chosen
      // language with lip-sync, so the prompt no longer carries the dialogue inline.
      const result = await generateVideo({
        prompt: videoPrompt,
        styleId: selectedTemplate?.id ?? 'custom',
        dialogue: dialogueText.trim() || undefined,
        language: selectedLanguage,
        characterPresetId: selectedCharacter?.id,
        audioPresetId: selectedAudio?.id,
        characterImage: resolvedCharacterImage,
        audioFile: resolvedAudioFile,
      });
      setRequestData(result);
      setGenerationState('done');
    } catch {
      setGenerationState('error');
      toast.error('Something went wrong starting your video. Please try again.');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setGenerationState(null);
    setRequestData(null);
    setSelectedTemplate(null);
    setVideoPrompt('');
    setSelectedLanguage('en');
    setDialogueText('');
    setSelectedCharacter(null);
    setCharacterImageFile(null);
    setSelectedAudio(null);
    setAudioFile(null);
  };

  if (generationState === 'submitting') {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="space-y-5 text-center">
          <div className="orb-container mx-auto scale-75">
            <div className="orb-blob orb-blob-blue" />
            <div className="orb-blob orb-blob-red" />
            <div className="orb-blob orb-blob-yellow" />
            <div className="orb-blob orb-blob-green" />
            <div className="orb-core" />
            <div className="absolute z-10 flex h-14 w-14 flex-col items-center justify-center rounded-full border border-white/10 bg-black/45 shadow-lg backdrop-blur-md">
              <span className="mb-0.5 text-[7px] font-extrabold uppercase leading-none tracking-[0.22em] text-white/50">
                omni
              </span>
              <span className="text-xs font-bold leading-none tracking-tight text-white/90">
                live
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Preparing Omni request</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Building the cinematic scene package…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {/* Primary brand moment — four-color AI gradient hugging the top edge */}
      <div className="ai-gradient-top" aria-hidden />

      <SideRail
        steps={STEPS}
        currentStep={generationState === 'done' ? 6 : currentStep}
        testMode={testMode}
        setTestMode={setTestMode}
        onBrandClick={handleReset}
      />

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Compact bar for small screens (rail is hidden < lg) */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 lg:hidden">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-3 rounded-full text-left transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Return to the first step"
          >
            <PortalMark />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              The Omni Portal
            </span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex select-none items-center gap-2">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch
                checked={testMode}
                onCheckedChange={setTestMode}
                aria-label="Toggle test mode"
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
        {/* Mobile progress strip */}
        <div className="flex shrink-0 items-center gap-3 px-6 pb-3 lg:hidden">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Step {currentStep} / {STEPS.length}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Scrollable step content — the only scroll region; page size stays constant */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 lg:px-10 lg:py-6 xl:px-12">
          {/* Keyed wrapper replays the entrance animation on each step/result transition */}
          <div
            key={generationState === 'done' ? 'result' : currentStep}
            className="animate-step-in flex h-full min-h-0 w-full items-center"
          >
            <Suspense fallback={<StepFallback />}>
              {generationState === 'done' && requestData ? (
                <ResultPanel
                  requestData={requestData}
                  selectedTemplate={selectedTemplate}
                  dialogueText={dialogueText}
                  selectedLanguage={selectedLanguage}
                  onReset={handleReset}
                />
              ) : (
                <>
                  {currentStep === 1 && (
                    <PromptSelector
                      selectedTemplate={selectedTemplate}
                      setSelectedTemplate={setSelectedTemplate}
                      videoPrompt={videoPrompt}
                      setVideoPrompt={setVideoPrompt}
                    />
                  )}
                  {currentStep === 2 && (
                    <DialogueSelector
                      selectedTemplate={selectedTemplate}
                      selectedLanguage={selectedLanguage}
                      setSelectedLanguage={setSelectedLanguage}
                      dialogueText={dialogueText}
                      setDialogueText={setDialogueText}
                    />
                  )}
                  {currentStep === 3 && (
                    <CharacterSelector
                      selectedCharacter={selectedCharacter}
                      setSelectedCharacter={setSelectedCharacter}
                      characterImageFile={characterImageFile}
                      setCharacterImageFile={setCharacterImageFile}
                    />
                  )}
                  {currentStep === 4 && (
                    <AudioSelector
                      selectedAudio={selectedAudio}
                      setSelectedAudio={setSelectedAudio}
                      audioFile={audioFile}
                      setAudioFile={setAudioFile}
                    />
                  )}
                  {currentStep === 5 && (
                    <ReviewGenerate
                      testMode={testMode}
                      selectedTemplate={selectedTemplate}
                      videoPrompt={videoPrompt}
                      dialogueText={dialogueText}
                      selectedLanguage={selectedLanguage}
                      selectedCharacter={selectedCharacter}
                      characterImageFile={characterImageFile}
                      selectedAudio={selectedAudio}
                      audioFile={audioFile}
                      onGenerate={handleGenerate}
                    />
                  )}
                </>
              )}
            </Suspense>
          </div>
        </div>

        {/* Pinned action bar */}
        {currentStep < 5 && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border/60 bg-background/88 px-6 py-3.5 backdrop-blur-md lg:px-10">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              Back
            </Button>
            <p
              className="hidden max-w-md text-center text-xs font-medium text-muted-foreground md:block"
              aria-live="polite"
            >
              {nextRequirement}
            </p>
            <div className="flex items-center gap-3">
              {(currentStep === 2 || currentStep === 4) && (
                <Button variant="ghost" onClick={() => setCurrentStep((s) => s + 1)}>
                  Skip
                </Button>
              )}
              <Button
                onClick={() => setCurrentStep((s) => Math.min(5, s + 1))}
                disabled={!canGoNext()}
                className="px-8"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
