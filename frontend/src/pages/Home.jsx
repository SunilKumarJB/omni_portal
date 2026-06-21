import React, { useState, useCallback } from 'react'
import { FlaskConical } from 'lucide-react'
import StepIndicator from '../components/StepIndicator.jsx'
import PromptSelector from '../components/PromptSelector.jsx'
import DialogueSelector from '../components/DialogueSelector.tsx'
import CharacterSelector from '../components/CharacterSelector.jsx'
import AudioSelector from '../components/AudioSelector.jsx'
import ReviewGenerate from '../components/ReviewGenerate.jsx'
import ResultPanel from '../components/ResultPanel.jsx'
import { generateVideo } from '../lib/api.js'

const STEPS = [
  { id: 1, label: 'Scenario' },
  { id: 2, label: 'Dialogue' },
  { id: 3, label: 'Character' },
  { id: 4, label: 'Audio' },
  { id: 5, label: 'Review' },
]

export default function Home() {
  const [testMode, setTestMode]               = useState(false)
  const [currentStep, setCurrentStep]         = useState(1)
  const [generationState, setGenerationState] = useState(null)
  const [requestData, setRequestData]         = useState(null)

  // Step 1
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [videoPrompt, setVideoPrompt]           = useState('')
  // Step 2
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [dialogueText, setDialogueText]         = useState('')
  // Step 3
  const [selectedCharacter, setSelectedCharacter]   = useState(null)
  const [characterImageFile, setCharacterImageFile] = useState(null)
  // Step 4
  const [selectedAudio, setSelectedAudio] = useState(null)
  const [audioFile, setAudioFile]         = useState(null)

  const canGoNext = useCallback(() => {
    if (currentStep === 1) return !!selectedTemplate && videoPrompt.trim().length >= 10
    if (currentStep === 2) return true  // dialogue is optional
    if (currentStep === 3) return !!selectedCharacter || !!characterImageFile
    if (currentStep === 4) return !!selectedAudio || !!audioFile
    return true
  }, [currentStep, selectedTemplate, videoPrompt, selectedCharacter, characterImageFile, selectedAudio, audioFile])

  const handleGenerate = async () => {
    setGenerationState('submitting')
    try {
      // Append dialogue to prompt if provided
      const finalPrompt = dialogueText.trim()
        ? `${videoPrompt}\n\nSpoken dialogue (exact line): "${dialogueText.trim()}"`
        : videoPrompt

      const result = await generateVideo({
        prompt: finalPrompt,
        styleId: selectedTemplate?.id ?? 'custom',
        themeId: 'default',
        characterPresetId: selectedCharacter?.id,
        audioPresetId: selectedAudio?.id,
        characterImage: characterImageFile,
        audioFile,
      })
      setRequestData(result)
      setGenerationState('done')
    } catch {
      setGenerationState('error')
    }
  }

  const handleReset = () => {
    setCurrentStep(1); setGenerationState(null); setRequestData(null)
    setSelectedTemplate(null); setVideoPrompt('')
    setSelectedLanguage('en'); setDialogueText('')
    setSelectedCharacter(null); setCharacterImageFile(null)
    setSelectedAudio(null); setAudioFile(null)
  }

  if (generationState === 'submitting') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/45">Preparing your request…</p>
        </div>
      </div>
    )
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
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">

      {/* Google brand stripe — 3px only, at the very top */}
      <div className="g-rainbow-bar" />

      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-[#0A0A0A]/95 border-b border-white/[0.06] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Portal icon — clean, single-color blue */}
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="#111"/>
              <circle cx="17" cy="17" r="10" fill="none" stroke="#4285F4" strokeWidth="1" opacity="0.25"/>
              <circle cx="17" cy="17" r="7" fill="none" stroke="#4285F4" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="17" cy="17" r="3.5" fill="#4285F4" opacity="0.9"/>
              <circle cx="17" cy="17" r="1.5" fill="white"/>
            </svg>
            <span className="text-[15px] font-semibold text-white tracking-tight">
              The Omni Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTestMode(!testMode)}
              className={`g-chip text-xs ${testMode ? 'g-chip-active' : ''}`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              {testMode ? 'Test on' : 'Test mode'}
            </button>
            {/* GCP badge — G-dot only, subtle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="2.5" cy="2.5" r="2.5" fill="#4285F4"/>
                <circle cx="7.5" cy="2.5" r="2.5" fill="#EA4335"/>
                <circle cx="2.5" cy="7.5" r="2.5" fill="#34A853"/>
                <circle cx="7.5" cy="7.5" r="2.5" fill="#FBBC05"/>
              </svg>
              <span className="text-[11px] text-white/40 font-medium">GCP</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <div className="relative w-full">
        {/* Full-width ambient glow — no clipping */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 55% 90% at 8% 60%, rgba(66,133,244,0.10) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto w-full px-6 pt-12 pb-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-px w-5 bg-[#4285F4]/60" />
            <span className="text-[11px] text-white/55 uppercase tracking-[0.18em] font-medium">
              Google Cloud Gemini Enterprise Agent Platform
            </span>
          </div>

          {/* Main title */}
          <h1
            className="text-5xl sm:text-6xl font-black text-white leading-[0.95] tracking-tight mb-4"
            style={{ textShadow: '0 0 80px rgba(66,133,244,0.18)' }}
          >
            The Omni Portal
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/60 font-light tracking-wide mb-4">
            Step Inside Your Imagination
          </p>

          {/* Tagline */}
          <p className="text-sm text-[#4285F4]/90 font-medium tracking-wide">
            Type a prompt. Transport yourself anywhere.
          </p>
        </div>
      </div>

      {/* ── Stepper ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto w-full px-6 pb-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* ── Step content ────────────────────────────────── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16">
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
          <div className="flex justify-between mt-10">
            <button
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              className={`btn-outlined ${currentStep === 1 ? 'invisible' : ''}`}
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              {/* Skip button only on optional steps */}
              {currentStep === 2 && (
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-sm text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.60)] transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={() => setCurrentStep(s => Math.min(5, s + 1))}
                disabled={!canGoNext()}
                className="btn-primary px-8"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
