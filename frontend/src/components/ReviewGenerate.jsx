import React from 'react'
import { MapPin, FlaskConical, Quote, Sparkles } from 'lucide-react'

const LANG_NAMES = {
  en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali',
  mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi',
}

const GCP_SERVICES = [
  { name: 'Omni',          color: '#4285F4' },
  { name: 'Nano Banana',   color: '#34A853' },
  { name: 'Cloud Storage', color: '#EA4335' },
  { name: 'Firestore',     color: '#A142F4' },
]

export default function ReviewGenerate({
  testMode, selectedTemplate, videoPrompt,
  dialogueText, selectedLanguage,
  selectedCharacter, characterImageFile,
  selectedAudio, audioFile, onGenerate,
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <div className="mb-8">
        <span className="g-step-label">Step 5 of 5</span>
        <h2 className="g-step-title">Review &amp; generate</h2>
        <p className="g-step-sub">Confirm everything looks right, then let Omni do its thing.</p>
      </div>

      {testMode && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FBBC05]/[0.06] border border-[#FBBC05]/15">
          <FlaskConical className="w-4 h-4 text-[#FBBC05] flex-shrink-0" />
          <span className="text-sm text-white/65">
            <span className="text-[#FBBC05] font-semibold">Test mode</span> — placeholder video, no real GCP calls.
          </span>
        </div>
      )}

      {/* Scenario card */}
      {selectedTemplate && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111] overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: selectedTemplate.accent }} />
          <div className="p-4 space-y-2">
            <p className="g-label">Scenario</p>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{selectedTemplate.emoji}</span>
              <span className="text-sm font-semibold text-white">{selectedTemplate.title}</span>
            </div>
            {selectedTemplate.id !== 'custom' && (
              <div className="flex items-center gap-1.5 text-xs text-white/38">
                <MapPin className="w-3 h-3" style={{ color: selectedTemplate.accent }} />
                {selectedTemplate.location}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogue card */}
      {dialogueText?.trim() && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111] overflow-hidden">
          <div className="h-0.5 w-full bg-[#4285F4]" />
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="g-label">Dialogue</p>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/[0.08] text-white/38">
                {LANG_NAMES[selectedLanguage] ?? selectedLanguage}
              </span>
            </div>
            <div className="flex gap-2">
              <Quote className="w-4 h-4 flex-shrink-0 text-[#4285F4] mt-0.5" />
              <p
                className="text-sm text-white/75 leading-relaxed italic"
                lang={selectedLanguage}
              >
                {dialogueText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prompt */}
      <div className="g-card">
        <p className="g-label">Prompt</p>
        <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{videoPrompt}</p>
      </div>

      {/* Character + Audio */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="g-card">
          <p className="g-label">Character</p>
          {selectedCharacter ? (
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-2xl">{selectedCharacter.avatar}</span>
              <span className="text-sm text-white font-medium">{selectedCharacter.name}</span>
            </div>
          ) : characterImageFile ? (
            <span className="text-sm text-[#34A853] mt-1 block">Custom image</span>
          ) : (
            <span className="text-xs text-white/25 mt-1 block">—</span>
          )}
        </div>

        <div className="g-card">
          <p className="g-label">Audio</p>
          {selectedAudio ? (
            <div className="flex items-center gap-2.5 mt-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${selectedAudio.dot ?? '#4285F4'}20`, border: `1.5px solid ${selectedAudio.dot ?? '#4285F4'}50` }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: selectedAudio.dot ?? '#4285F4' }} />
              </div>
              <span className="text-sm text-white font-medium">{selectedAudio.name}</span>
            </div>
          ) : audioFile ? (
            <span className="text-sm text-[#34A853] mt-1 block">Custom audio</span>
          ) : (
            <span className="text-xs text-white/25 mt-1 block">—</span>
          )}
        </div>
      </div>

      {/* GCP services */}
      <div className="g-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-white/25" />
          <p className="g-label mb-0">Powered by</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {GCP_SERVICES.map(({ name, color }) => (
            <div
              key={name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{ background: `${color}0A`, borderColor: `${color}28` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="text-xs" style={{ color: `${color}CC` }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Generate CTA */}
      <div className="pt-3">
        <button
          onClick={onGenerate}
          className="btn-primary w-full py-3.5 text-base justify-center rounded-2xl"
        >
          {testMode ? '🧪 Generate (test mode)' : 'Generate video with Omni →'}
        </button>
        <p className="text-center text-xs text-white/25 mt-3">
          {testMode ? 'Returns a placeholder video instantly' : 'Generation takes 3–8 minutes · You\'ll get a QR code to return anytime'}
        </p>
      </div>
    </div>
  )
}
