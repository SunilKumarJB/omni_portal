import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import React from 'react';

const DEFAULT_STYLES = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Epic wide shots, dramatic lighting, film grain',
    icon: '🎬',
  },
  {
    id: 'commercial',
    name: 'Commercial',
    description: 'Clean, punchy, brand-focused with strong CTA energy',
    icon: '📺',
  },
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Authentic feel with natural handheld lighting',
    icon: '🎥',
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Fast cuts, trending vertical aesthetic',
    icon: '📱',
  },
  {
    id: 'tutorial',
    name: 'Tutorial',
    description: 'Step-by-step, clear instructional visuals',
    icon: '📚',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Warm tones, aspirational everyday moments',
    icon: '✨',
  },
];

const DEFAULT_THEMES = [
  {
    id: 'professional',
    name: 'Professional',
    color: '#4285F4',
    description: 'Corporate polish & authority',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    color: '#A142F4',
    description: 'High energy, saturated colors',
  },
  {
    id: 'dark_moody',
    name: 'Dark & Moody',
    color: '#1F2937',
    border: '#444',
    description: 'Deep shadows, luxury feel',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    color: '#5F6368',
    description: 'Clean space, elegant simplicity',
  },
  { id: 'nature', name: 'Nature', color: '#137333', description: 'Organic greens, fresh outdoors' },
  { id: 'urban', name: 'Urban', color: '#E37400', description: 'City energy, contemporary' },
];

export default function VideoStyleSelector({
  aiSuggestions,
  selectedStyle,
  setSelectedStyle,
  selectedTheme,
  setSelectedTheme,
  videoPrompt,
  setVideoPrompt,
}) {
  const styles = aiSuggestions?.styles?.length ? aiSuggestions.styles : DEFAULT_STYLES;
  const themes = aiSuggestions?.themes?.length ? aiSuggestions.themes : DEFAULT_THEMES;
  const samples = aiSuggestions?.sample_prompts || [];

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-slide-up">
      {/* ── Video style (filter chips) ─────────────────── */}
      <section>
        <p className="g-label">Video style</p>
        <h2 className="text-lg font-normal text-[#E3E3E3] mb-4">
          {aiSuggestions
            ? 'Gemini-recommended styles for your product'
            : 'Choose a production style'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStyle(s)}
              className={clsx('g-chip', selectedStyle?.id === s.id && 'g-chip-active')}
            >
              <span>{s.icon}</span> {s.name}
            </button>
          ))}
        </div>
        {selectedStyle && (
          <p className="mt-3 text-xs text-[rgba(255,255,255,0.50)]">{selectedStyle.description}</p>
        )}
      </section>

      {/* ── Visual theme (cards) ───────────────────────── */}
      <section>
        <p className="g-label">Visual theme</p>
        <h2 className="text-lg font-normal text-[#E3E3E3] mb-4">Color palette &amp; mood</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t)}
              className={clsx(
                'g-card-hover flex items-center gap-3 text-left',
                selectedTheme?.id === t.id && 'g-card-selected',
              )}
            >
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0"
                style={{
                  background: t.color,
                  outline: t.border ? `1px solid ${t.border}` : 'none',
                }}
              />
              <div className="min-w-0">
                <div className="text-sm text-[#E3E3E3] font-medium">{t.name}</div>
                <div className="text-xs text-[rgba(255,255,255,0.45)] truncate">
                  {t.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Prompt ────────────────────────────────────── */}
      <section>
        <p className="g-label">Video prompt</p>
        <h2 className="text-lg font-normal text-[#E3E3E3] mb-4">
          Describe what happens in your video
        </h2>

        {samples.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#4285F4]" />
              <span className="text-xs text-[rgba(255,255,255,0.50)]">
                Gemini suggestions — click to use
              </span>
            </div>
            <div className="space-y-2">
              {samples.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setVideoPrompt(p.text)}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl text-sm border transition-colors duration-150',
                    videoPrompt === p.text
                      ? 'border-[#4285F4]/60 bg-[#4285F4]/10 text-white'
                      : 'border-white/[0.07] bg-[#111] text-white/60 hover:border-white/[0.14] hover:bg-[#161616]',
                  )}
                >
                  <span className="text-[#4285F4] text-xs mr-2">[{p.style_hint}]</span>
                  {p.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={videoPrompt}
          onChange={(e) => setVideoPrompt(e.target.value)}
          placeholder="Describe your video: what happens, who's in it, the mood, key moments…"
          rows={4}
          maxLength={1000}
          className="g-input resize-none"
        />
        <div className="flex justify-between mt-1.5">
          {videoPrompt.length < 10 ? (
            <span className="text-xs text-[#EA4335]">
              {10 - videoPrompt.length} more characters needed
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs text-[rgba(255,255,255,0.30)]">{videoPrompt.length}/1000</span>
        </div>
      </section>
    </div>
  );
}
