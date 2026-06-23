import { FlaskConical } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { PortalMark } from '@/components/AppHeader';
import SideRail from '@/components/SideRail';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import AudioSelector from '../components/AudioSelector.jsx';
import CharacterSelector from '../components/CharacterSelector.jsx';
import DialogueSelector from '../components/DialogueSelector.tsx';
import PromptSelector from '../components/PromptSelector.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import ReviewGenerate from '../components/ReviewGenerate.jsx';
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
  }, [currentStep, selectedTemplate, videoPrompt, selectedCharacter, characterImageFile]);

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
      <div className="flex h-dvh items-center justify-center bg-background">
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
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {/* Primary brand moment — four-color AI gradient hugging the top edge */}
      <div className="ai-gradient-top" aria-hidden />

      <SideRail
        steps={STEPS}
        currentStep={currentStep}
        testMode={testMode}
        setTestMode={setTestMode}
      />

      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Compact bar for small screens (rail is hidden < lg) */}
        <div className="flex shrink-0 items-center justify-between px-6 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <PortalMark />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              The Omni Portal
            </span>
          </div>
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
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 lg:px-16 lg:py-12">
          {/* Keyed wrapper replays the entrance animation on each step change */}
          <div key={currentStep} className="animate-step-in">
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
          </div>
        </div>

        {/* Pinned action bar */}
        {currentStep < 5 && (
          <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-6 py-4 lg:px-12">
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
      </main>
    </div>
  );
}
