import axios from 'axios';
import { FlaskConical } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { PortalMark } from '@/components/AppHeader';
import CharacterSelector from '@/components/CharacterSelector';
import DialogueSelector from '@/components/DialogueSelector';
import NameStep from '@/components/NameStep';
import ProductSelector from '@/components/ProductSelector';
import PromptSelector from '@/components/PromptSelector';
import ResultPanel from '@/components/ResultPanel';
import ReviewGenerate from '@/components/ReviewGenerate';
import SideRail from '@/components/SideRail';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { generateVideo } from '../lib/api';
import type {
  CharacterPreset,
  GenerationStatus,
  LanguageCode,
  ProductPreset,
  VideoRequestData,
  VideoTemplate,
} from '../lib/types';

const STEPS: { id: 1 | 2 | 3 | 4 | 5 | 6; label: string }[] = [
  { id: 1, label: 'Character' },
  { id: 2, label: 'Product' },
  { id: 3, label: 'Dialogue' },
  { id: 4, label: 'Presenter' },
  { id: 5, label: 'Scenario' },
  { id: 6, label: 'Review' },
];

const PRESET_IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

/** Extension and content type for a preset image path, defaulting to png. */
function presetImageType(path: string): { ext: string; mime: string } {
  const ext = (path.split('?')[0].split('.').pop() ?? '').toLowerCase();
  return { ext: ext || 'png', mime: PRESET_IMAGE_MIME[ext] ?? 'image/png' };
}

/** Pulls the FastAPI `detail` field out of an error body without asserting its shape. */
function errorDetail(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('detail' in body)) return undefined;
  const { detail } = body;
  return typeof detail === 'string' && detail.trim() ? detail : undefined;
}

function describeGenerateError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === undefined) return `Could not reach the server — ${err.message}`;
    const detail = errorDetail(err.response?.data);
    return detail
      ? `Generation failed (HTTP ${status}): ${detail}`
      : `Generation failed (HTTP ${status})`;
  }
  return 'Something went wrong starting your video. Please try again.';
}

export default function Home() {
  // Deliberately not persisted: every demo run starts against the real backend.
  const [testMode, setTestMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [requestData, setRequestData] = useState<VideoRequestData | null>(null);
  // Bumped per generation attempt so the result panel remounts (and its elapsed timer restarts).
  const [runKey, setRunKey] = useState(0);

  // Step 1: Director Name
  const [userName, setUserName] = useState('');
  // Step 2: Hero Product
  const [selectedProduct, setSelectedProduct] = useState<ProductPreset | null>(null);
  // Step 3: Dialogue & Language
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [dialogueText, setDialogueText] = useState('');
  // True once the director has typed in the dialogue box; keeps their text (or a
  // deliberately blank line) from being overwritten when they revisit step 3.
  const [dialogueTouched, setDialogueTouched] = useState(false);
  // Step 4: Character/Presenter
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterPreset | null>(null);
  const [characterImageFile, setCharacterImageFile] = useState<File | null>(null);
  // Step 5: Scenario & Dynamic Prompt
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');

  const isStepComplete = useCallback(
    (step: number) => {
      if (step === 1) return userName.trim().length >= 2;
      if (step === 2) return !!selectedProduct;
      if (step === 3) return true; // Dialogue is optional
      if (step === 4) return !!selectedCharacter || !!characterImageFile;
      if (step === 5) return !!selectedTemplate && videoPrompt.trim().length >= 10;
      return true;
    },
    [
      userName,
      selectedProduct,
      selectedCharacter,
      characterImageFile,
      selectedTemplate,
      videoPrompt,
    ],
  );

  const canGoNext = isStepComplete(currentStep);

  // Steps already satisfied can be revisited; the first unsatisfied step is as far
  // forward as the rail may jump.
  const firstIncompleteStep = STEPS.find((s) => !isStepComplete(s.id))?.id ?? 6;
  const maxNavigableStep = requestData ? 0 : Math.max(currentStep, firstIncompleteStep);

  const nextRequirement = (() => {
    if (currentStep === 1 && userName.trim().length < 2) {
      return 'Enter a name for your character to personalize your campaign.';
    }
    if (currentStep === 2 && !selectedProduct) {
      return 'Select a hero product to continue.';
    }
    if (currentStep === 3) {
      return 'Dialogue is optional. Continue or skip this step.';
    }
    if (currentStep === 4 && !selectedCharacter && !characterImageFile) {
      return 'Choose or upload a presenter to continue.';
    }
    if (currentStep === 5 && !selectedTemplate) {
      return 'Select a scenario to continue.';
    }
    if (currentStep === 5 && videoPrompt.trim().length < 10) {
      return 'Add a short prompt so Omni has enough direction.';
    }
    if (currentStep === 6) {
      return 'Go back to change anything, or launch the campaign.';
    }
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
    // Show the result panel straight away — the wizard shell stays put and the panel
    // is patched with the real record once the POST resolves.
    setRunKey((k) => k + 1);
    setRequestData({
      request_id: '',
      status: 'pending',
      stage: 'queued',
      progress: 0,
      prompt: videoPrompt,
      dialogue: dialogueText.trim() || undefined,
      language: selectedLanguage,
      created_at: new Date().toISOString(),
    });
    try {
      if (testMode) {
        const requestId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `test-${Date.now()}`;
        setRequestData({
          request_id: requestId,
          status: 'completed' as GenerationStatus,
          stage: 'completed',
          progress: 100,
          generation_seconds: 4,
          final_prompt: videoPrompt,
          prompt: videoPrompt,
          dialogue: dialogueText.trim() || undefined,
          language: selectedLanguage,
          video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          video_page_url: `${window.location.origin}/video/${requestId}`,
          qr_code_url: null,
          created_at: new Date().toISOString(),
        });
        return;
      }

      // Resolve preset character image
      const resolvedCharacterImage = await (async () => {
        if (!characterImageFile && selectedCharacter?.img) {
          const { ext, mime } = presetImageType(selectedCharacter.img);
          return fetchAsFile(selectedCharacter.img, `${selectedCharacter.id}.${ext}`, mime);
        }
        return characterImageFile;
      })();

      // Trigger video generation on the GCP Omni backend
      const result = await generateVideo({
        prompt: videoPrompt,
        styleId: selectedTemplate?.id ?? 'custom',
        dialogue: dialogueText.trim() || undefined,
        language: selectedLanguage,
        characterPresetId: selectedCharacter?.id,
        characterImage: resolvedCharacterImage,
      });

      setRequestData(result);
    } catch (err) {
      // Back to review with every input intact so the director can retry immediately.
      setRequestData(null);
      setCurrentStep(6);
      toast.error(describeGenerateError(err));
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setRequestData(null);
    setUserName('');
    setSelectedProduct(null);
    setSelectedTemplate(null);
    setVideoPrompt('');
    setSelectedLanguage('en');
    setDialogueText('');
    setDialogueTouched(false);
    setSelectedCharacter(null);
    setCharacterImageFile(null);
  };

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {/* Primary brand moment — four-color AI gradient hugging the top edge */}
      <div className="ai-gradient-top" aria-hidden />

      <SideRail
        steps={STEPS}
        currentStep={requestData ? 7 : currentStep}
        testMode={testMode}
        setTestMode={setTestMode}
        onBrandClick={handleReset}
        maxNavigableStep={maxNavigableStep}
        onStepSelect={setCurrentStep}
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
            key={requestData ? `result-${runKey}` : currentStep}
            className="animate-step-in flex h-full min-h-0 w-full items-center"
          >
            {requestData ? (
              <ResultPanel
                requestData={requestData}
                selectedTemplate={selectedTemplate}
                dialogueText={dialogueText}
                selectedLanguage={selectedLanguage}
                onReset={handleReset}
                onRetry={handleGenerate}
              />
            ) : (
              <>
                {currentStep === 1 && (
                  <NameStep
                    userName={userName}
                    setUserName={setUserName}
                    onNext={() => setCurrentStep(2)}
                  />
                )}
                {currentStep === 2 && (
                  <ProductSelector
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                  />
                )}
                {currentStep === 3 && (
                  <DialogueSelector
                    userName={userName}
                    selectedProduct={selectedProduct}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={setSelectedLanguage}
                    dialogueText={dialogueText}
                    setDialogueText={setDialogueText}
                    dialogueTouched={dialogueTouched}
                    setDialogueTouched={setDialogueTouched}
                  />
                )}
                {currentStep === 4 && (
                  <CharacterSelector
                    selectedCharacter={selectedCharacter}
                    setSelectedCharacter={setSelectedCharacter}
                    characterImageFile={characterImageFile}
                    setCharacterImageFile={setCharacterImageFile}
                  />
                )}
                {currentStep === 5 && (
                  <PromptSelector
                    userName={userName}
                    selectedProduct={selectedProduct}
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                    videoPrompt={videoPrompt}
                    setVideoPrompt={setVideoPrompt}
                    dialogueText={dialogueText}
                  />
                )}
                {currentStep === 6 && (
                  <ReviewGenerate
                    testMode={testMode}
                    userName={userName}
                    selectedProduct={selectedProduct}
                    selectedTemplate={selectedTemplate}
                    videoPrompt={videoPrompt}
                    dialogueText={dialogueText}
                    selectedLanguage={selectedLanguage}
                    selectedCharacter={selectedCharacter}
                    characterImageFile={characterImageFile}
                    onGenerate={handleGenerate}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Pinned action bar */}
        {!requestData && (
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
              {currentStep === 3 && (
                <Button variant="ghost" onClick={() => setCurrentStep((s) => s + 1)}>
                  Skip
                </Button>
              )}
              {currentStep < 6 && (
                <Button
                  onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
                  disabled={!canGoNext}
                  className="px-8"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
