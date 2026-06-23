import { FlaskConical } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import AudioSelector from '../components/AudioSelector.jsx';
import CharacterSelector from '../components/CharacterSelector.jsx';
import DialogueSelector from '../components/DialogueSelector.tsx';
import PromptSelector from '../components/PromptSelector.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import ReviewGenerate from '../components/ReviewGenerate.jsx';
import StepIndicator from '../components/StepIndicator.jsx';
import { generateVideo } from '../lib/api.js';

const STEPS = [
  { id: 1, label: 'Scenario' },
  { id: 2, label: 'Dialogue' },
  { id: 3, label: 'Character' },
  { id: 4, label: 'Audio' },
  { id: 5, label: 'Review' },
];

export default function Home() {
  const [testMode, setTestMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [generationState, setGenerationState] = useState(null);
  const [requestData, setRequestData] = useState(null);

  // Step 1
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  // Step 2
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [dialogueText, setDialogueText] = useState('');
  // Step 3
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterImageFile, setCharacterImageFile] = useState(null);
  // Step 4
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const canGoNext = useCallback(() => {
    if (currentStep === 1) return !!selectedTemplate && videoPrompt.trim().length >= 10;
    if (currentStep === 2) return true; // dialogue is optional
    if (currentStep === 3) return !!selectedCharacter || !!characterImageFile;
    if (currentStep === 4) return true; // audio is optional
    return true;
  }, [
    currentStep,
    selectedTemplate,
    videoPrompt,
    selectedCharacter,
    characterImageFile,
    selectedAudio,
    audioFile,
  ]);

  /**
   * Fetches a public asset URL and returns it as a File object.
   * Returns null silently if the file is missing or the fetch fails.
   */
  async function fetchAsFile(url, filename, mimeType) {
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

      // Append dialogue to prompt if provided
      const finalPrompt = dialogueText.trim()
        ? `${videoPrompt}\n\nSpoken dialogue (exact line): "${dialogueText.trim()}"`
        : videoPrompt;

      const result = await generateVideo({
        prompt: finalPrompt,
        styleId: selectedTemplate?.id ?? 'custom',
        themeId: 'default',
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Preparing your request…</p>
        </div>
      </div>
    );
  }

  if (generationState === 'done' && requestData) {
    return (
      <ResultPanel
        requestData={requestData}
        selectedTemplate={selectedTemplate}
        dialogueText={dialogueText}
        selectedLanguage={selectedLanguage}
        testMode={testMode}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        actions={
          <div className="flex select-none items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              Test mode
            </span>
            <Switch
              checked={testMode}
              onCheckedChange={setTestMode}
              aria-label="Toggle test mode"
            />
          </div>
        }
      />

      {/* ── Hero — the one place the AI-gradient brand moment appears ─────── */}
      <div className="relative w-full overflow-hidden">
        {/* Confined four-color corner wash (top-left), per GML gradient rules */}
        <div className="ai-gradient-corner" aria-hidden />

        <div className="relative mx-auto w-full max-w-5xl px-6 pb-8 pt-14">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-px w-6 bg-foreground/50" />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Gemini Enterprise Agent Platform
            </span>
          </div>

          <h1 className="mb-4 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-foreground sm:text-6xl">
            The Omni Portal
          </h1>

          <p className="mb-3 font-display text-lg font-light tracking-wide text-muted-foreground sm:text-xl">
            Step inside your imagination
          </p>

          <p className="text-sm font-medium tracking-wide text-foreground/80">
            Type a prompt. Transport yourself anywhere.
          </p>
        </div>
      </div>

      {/* ── Stepper ─────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-5xl px-6 pb-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* ── Step content ────────────────────────────────── */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 pb-16">
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

        {/* Navigation */}
        {currentStep < 5 && (
          <div className="mt-10 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              Back
            </Button>
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
      </div>
    </div>
  );
}
