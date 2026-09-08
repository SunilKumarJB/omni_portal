import axios from 'axios';
import { FlaskConical, Images } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PortalMark } from '@/components/AppHeader';
import NameStep from '@/components/NameStep';
import SideRail from '@/components/SideRail';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { HERO_MAX_PER_CATEGORY, HERO_PRODUCT_SLOTS, PRODUCT_CATALOG } from '@/data/products';
import { flushDraft, loadDraft, saveDraft, type VideoDraft } from '@/lib/draft';
import { pickHeroProducts } from '@/lib/productPicker';
import {
  briefContext,
  buildVideoPrompt,
  defaultDialogue,
  type PromptDraft,
} from '@/lib/videoBrief';
import { generateVideo } from '../lib/api';
import type {
  CharacterPreset,
  GenerationStatus,
  LanguageCode,
  ProductPreset,
  VideoRequestData,
  VideoTemplate,
} from '../lib/types';

const CharacterSelector = lazy(() => import('@/components/CharacterSelector'));
const DialogueSelector = lazy(() => import('@/components/DialogueSelector'));
const ProductSelector = lazy(() => import('@/components/ProductSelector'));
const PromptSelector = lazy(() => import('@/components/PromptSelector'));
const ResultPanel = lazy(() => import('@/components/ResultPanel'));
const ReviewGenerate = lazy(() => import('@/components/ReviewGenerate'));

function focusStepHeading(node: HTMLDivElement | null) {
  node?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}

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
  return err instanceof Error ? err.message : 'Could not start your video. Please try again.';
}

function drawHeroProducts() {
  return pickHeroProducts(PRODUCT_CATALOG, HERO_PRODUCT_SLOTS, HERO_MAX_PER_CATEGORY);
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<VideoDraft | null>(null);
  useEffect(() => {
    let active = true;
    loadDraft()
      .then((value) => {
        if (active) setDraft(value);
      })
      .catch(() =>
        toast.error('Draft storage is unavailable. Keep this tab open to retain your work.'),
      )
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  return loaded ? (
    <VideoWizard initial={draft} />
  ) : (
    <div className="p-8" role="status">
      Opening your draft…
    </div>
  );
}

function VideoWizard({ initial }: { initial: VideoDraft | null }) {
  const [testMode, setTestMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(initial?.currentStep ?? 1);
  const [requestData, setRequestData] = useState<VideoRequestData | null>(
    initial?.requestData ?? null,
  );
  const [runKey, setRunKey] = useState(0);
  const [userName, setUserName] = useState(initial?.userName ?? '');
  const [heroProducts, setHeroProducts] = useState(initial?.heroProducts ?? drawHeroProducts);
  const [selectedProduct, setSelectedProduct] = useState<ProductPreset | null>(
    initial?.selectedProduct ?? null,
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    initial?.selectedLanguage ?? 'en',
  );
  const [dialogueText, setDialogueText] = useState(initial?.dialogueText ?? '');
  const [dialogueTouched, setDialogueTouched] = useState(initial?.dialogueTouched ?? false);
  const [dialogueContext, setDialogueContext] = useState(initial?.dialogueContext ?? '');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterPreset | null>(
    initial?.selectedCharacter ?? null,
  );
  const [characterImageFile, setCharacterImageFile] = useState<File | null>(
    initial?.characterImageFile ?? null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(
    initial?.selectedTemplate ?? null,
  );
  const [promptDrafts, setPromptDrafts] = useState<Record<string, PromptDraft>>(
    initial?.promptDrafts ?? {},
  );
  const [duration, setDuration] = useState(initial?.duration ?? 10);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>(initial?.aspectRatio ?? '16:9');
  const [saveError, setSaveError] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const context = briefContext(selectedProduct, userName);
  const customPrompt = selectedTemplate ? promptDrafts[selectedTemplate.id] : undefined;
  const videoPrompt = selectedTemplate
    ? (customPrompt?.text ?? buildVideoPrompt(selectedTemplate, selectedProduct, userName))
    : '';
  const spokenLine = dialogueTouched
    ? dialogueText
    : defaultDialogue(selectedProduct, userName, selectedLanguage);
  const needsReview =
    (!!customPrompt && customPrompt.context !== context) ||
    (dialogueTouched && !!dialogueText.trim() && dialogueContext !== context);
  const setVideoPrompt = (text: string) => {
    if (selectedTemplate)
      setPromptDrafts((prev) => ({ ...prev, [selectedTemplate.id]: { text, context } }));
  };
  const resetPrompt = () => {
    if (selectedTemplate)
      setPromptDrafts((prev) => {
        const next = { ...prev };
        delete next[selectedTemplate.id];
        return next;
      });
  };
  const editDialogue = (text: string) => {
    setDialogueText(text);
    setDialogueContext(context);
  };
  const acknowledgeChanges = () => {
    setDialogueContext(context);
    if (selectedTemplate && customPrompt) setVideoPrompt(customPrompt.text);
  };

  useEffect(() => {
    void saveDraft({
      version: 1,
      currentStep,
      userName,
      heroProducts,
      selectedProduct,
      selectedLanguage,
      dialogueText,
      dialogueTouched,
      dialogueContext,
      selectedCharacter,
      characterImageFile,
      selectedTemplate,
      promptDrafts,
      duration,
      aspectRatio,
      requestData: requestData?.request_id ? requestData : null,
    })
      .then(() => setSaveError(false))
      .catch(() => setSaveError(true));
  }, [
    currentStep,
    userName,
    heroProducts,
    selectedProduct,
    selectedLanguage,
    dialogueText,
    dialogueTouched,
    dialogueContext,
    selectedCharacter,
    characterImageFile,
    selectedTemplate,
    promptDrafts,
    duration,
    aspectRatio,
    requestData,
  ]);

  useEffect(() => {
    const flush = () => {
      void flushDraft().catch(() => setSaveError(true));
    };
    const onVisibility = () => {
      if (document.hidden) flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      void flushDraft().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const region = contentRef.current;
    region?.scrollTo({ top: 0 });
    region?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [currentStep, !!requestData]);

  const isStepComplete = useCallback(
    (step: number) => {
      if (step === 1) return userName.trim().length >= 1;
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
    if (currentStep === 1 && userName.trim().length < 1) {
      return 'Enter a name for your character to name the person in your video.';
    }
    if (currentStep === 2 && !selectedProduct) {
      return 'Select a hero product to continue.';
    }
    if (currentStep === 3) {
      return 'Use this dialogue, or choose no spoken dialogue.';
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
      return 'Check your choices before creating the video.';
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
    if (needsReview || ![1, 2, 4, 5].every(isStepComplete)) {
      setCurrentStep(6);
      return;
    }
    setRunKey((k) => k + 1);
    setRequestData({
      request_id: '',
      status: 'pending',
      stage: 'queued',
      progress: 0,
      prompt: videoPrompt,
      dialogue: spokenLine.trim() || undefined,
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
          is_sample: true,
          final_prompt: videoPrompt,
          prompt: videoPrompt,
          dialogue: spokenLine.trim() || undefined,
          language: selectedLanguage,
          video_url: selectedTemplate?.videoSrc ?? undefined,
          video_page_url: null,
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

      if (!resolvedCharacterImage)
        throw new Error('The presenter photo could not be loaded. Select the photo again.');

      // Trigger video generation on the GCP Omni backend
      const result = await generateVideo({
        prompt: videoPrompt,
        styleId: selectedTemplate?.id ?? 'custom',
        dialogue: spokenLine.trim() || undefined,
        language: selectedLanguage,
        characterPresetId: selectedCharacter?.id,
        characterImage: resolvedCharacterImage,
        productId: selectedProduct?.id,
        durationSeconds: duration,
        aspectRatio,
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
    if (!window.confirm('Discard this draft and start a new video?')) return;
    setCurrentStep(1);
    setRequestData(null);
    setUserName('');
    setHeroProducts(drawHeroProducts());
    setSelectedProduct(null);
    setSelectedTemplate(null);
    setPromptDrafts({});
    setDialogueContext('');
    setDuration(10);
    setAspectRatio('16:9');
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
        onBrandClick={() => {
          setRequestData(null);
          setCurrentStep(1);
        }}
        maxNavigableStep={maxNavigableStep}
        onStepSelect={setCurrentStep}
      />

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Compact bar for small screens (rail is hidden < lg) */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 lg:hidden">
          <button
            type="button"
            onClick={() => {
              setRequestData(null);
              setCurrentStep(1);
            }}
            className="flex items-center gap-3 rounded-full text-left transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Return to the first step"
          >
            <PortalMark />
            <span className="hidden min-[440px]:inline text-[15px] font-semibold tracking-tight text-foreground">
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
            <Button
              variant="outline"
              size="icon"
              aria-label="Open gallery"
              asChild
              className="h-9 w-9 rounded-full"
            >
              <Link to="/gallery">
                <Images className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile progress strip */}
        <div className="flex shrink-0 items-center gap-3 px-6 pb-3 lg:hidden">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {requestData ? 'Video status' : `Step ${currentStep} / ${STEPS.length}`}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {saveError && (
          <p role="alert" className="px-6 py-2 text-sm text-destructive">
            Draft could not be saved. Keep this tab open.
          </p>
        )}
        {/* Scrollable step content — the only scroll region; page size stays constant */}
        <div
          ref={contentRef}
          className="wizard-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 lg:px-10 lg:py-6 xl:px-12"
        >
          <Suspense fallback={<p role="status">Opening this step…</p>}>
            {/* Keyed wrapper replays the entrance animation on each step/result transition */}
            <div
              ref={focusStepHeading}
              key={requestData ? `result-${runKey}` : currentStep}
              className="wizard-content animate-step-in w-full"
            >
              {requestData ? (
                <ResultPanel
                  requestData={requestData}
                  selectedTemplate={selectedTemplate}
                  dialogueText={spokenLine}
                  selectedLanguage={selectedLanguage}
                  onReset={handleReset}
                  onRetry={handleGenerate}
                  onEdit={() => {
                    setRequestData(null);
                    setCurrentStep(6);
                  }}
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
                      products={heroProducts}
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
                      dialogueText={spokenLine}
                      setDialogueText={editDialogue}
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
                      onResetPrompt={resetPrompt}
                      dialogueText={spokenLine}
                    />
                  )}
                  {currentStep === 6 && (
                    <ReviewGenerate
                      testMode={testMode}
                      userName={userName}
                      selectedProduct={selectedProduct}
                      selectedTemplate={selectedTemplate}
                      videoPrompt={videoPrompt}
                      dialogueText={spokenLine}
                      selectedLanguage={selectedLanguage}
                      selectedCharacter={selectedCharacter}
                      characterImageFile={characterImageFile}
                      onGenerate={handleGenerate}
                      onEdit={setCurrentStep}
                      duration={duration}
                      setDuration={setDuration}
                      aspectRatio={aspectRatio}
                      setAspectRatio={setAspectRatio}
                      needsReview={needsReview}
                      onAcknowledge={acknowledgeChanges}
                      canGenerate={[1, 2, 4, 5].every(isStepComplete)}
                    />
                  )}
                </>
              )}
            </div>
          </Suspense>
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    editDialogue('');
                    setDialogueTouched(true);
                    setCurrentStep(4);
                  }}
                >
                  No dialogue
                </Button>
              )}
              {currentStep < 6 && (
                <Button
                  onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
                  disabled={!canGoNext}
                  className="px-8"
                >
                  {currentStep === 3 ? 'Use this dialogue' : 'Continue'}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
