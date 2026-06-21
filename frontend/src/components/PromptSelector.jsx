import React, { useState } from 'react'
import clsx from 'clsx'
import { MapPin, PenLine, ChevronDown, ChevronUp, Check } from 'lucide-react'

export const VIDEO_TEMPLATES = [
  {
    id: 'cyberpunk',
    number: '01',
    title: 'The Cyberpunk Neon Hustler',
    style: 'Cyberpunk · 8K · Drone tracking',
    location: 'Times Square, NYC — 2099',
    dialogue: 'They said the city never sleeps. Good… neither do I.',
    prompt: 'A hyper-realistic, cinematic tracking shot of [REF_Character] walking confidently through a futuristic, neon-lit Times Square at night. Holographic billboards glow in the rain-slicked streets. [REF_Character] is wearing sleek, modern streetwear with glowing LED accents, looking directly into the camera with a smirk. The lighting is high-contrast cyan and magenta. Shot on 35mm lens, 8K resolution, photorealistic.',
    accent: '#00D4FF',
    emoji: '🌆',
  },
  {
    id: 'action_hero',
    number: '02',
    title: 'The Epic Action Hero',
    style: 'Action blockbuster · Slow-mo · IMAX',
    location: 'The Colosseum, Rome, Italy',
    dialogue: 'Are you not entertained? Because I\'m just getting started.',
    prompt: 'An epic, slow-motion low-angle shot of [REF_Character] standing in the center of the Roman Colosseum during golden hour. Dust particles float in the warm sunlight. [REF_Character] dusts off their shoulder, looking tough and victorious, with a dramatic cape or coat blowing in the wind. Cinematic lighting, IMAX film style, incredibly detailed.',
    accent: '#F59E0B',
    emoji: '⚔️',
  },
  {
    id: 'film_noir',
    number: '03',
    title: 'The Vintage Film Noir Detective',
    style: '1940s Film Noir · B&W · 35mm grain',
    location: 'Eiffel Tower, Paris — Rainy 1920s',
    dialogue: 'Romance is just a myth we tell ourselves to survive the rain.',
    prompt: 'A moody, black and white 1940s film noir shot. [REF_Character] leans against a vintage streetlamp on a cobblestone street in Paris, with the Eiffel Tower glowing dimly in the foggy background. Heavy rain falls, creating deep shadows and dramatic rim lighting on [REF_Character]\'s face. Vintage 35mm film grain, cinematic depth of field, dramatic and mysterious atmosphere.',
    accent: '#94A3B8',
    emoji: '🕵️',
  },
  {
    id: 'animated',
    number: '04',
    title: 'The 3D Animated Mischief Maker',
    style: 'Pixar / Disney 3D · Vibrant · Soft lighting',
    location: 'Mount Fuji, Japan — Cherry blossom season',
    dialogue: 'Spring is here, the blossoms are blooming, and nothing is going to plan!',
    prompt: 'A high-quality 3D animated shot in the style of modern Pixar. [REF_Character] is rendered in a stylized, expressive 3D cartoon style, standing in a vibrant field of pink cherry blossoms with Mount Fuji towering in the background. Bright, cheerful sunlight, soft shadows, and vibrant colors. [REF_Character] does a sudden, comedic double-take toward the camera as cherry blossom petals blow past.',
    accent: '#F472B6',
    emoji: '🌸',
  },
  {
    id: 'treasure_hunter',
    number: '05',
    title: 'The Desert Treasure Hunter',
    style: 'Adventure-fantasy · Drone · Unreal Engine 5',
    location: 'Great Pyramids of Giza, Egypt',
    dialogue: 'Some secrets are meant to stay buried. Too bad I brought a shovel.',
    prompt: 'A sweeping drone shot circling around [REF_Character] standing atop a massive sand dune, with the Great Pyramids of Giza looming beautifully in the background under a blazing sun. [REF_Character] is dressed in rugged explorer gear, holding an ancient glowing artifact. Heat distortion waves ripple in the air. Unreal Engine 5 style render, hyper-detailed, warm orange and teal color grading.',
    accent: '#F97316',
    emoji: '🏺',
  },
  {
    id: 'custom',
    number: '✦',
    title: 'Custom Prompt',
    style: 'Your own vision',
    location: 'Any location you describe',
    dialogue: 'Write exactly what you want Omni to create.',
    prompt: '',
    accent: '#4285F4',
    emoji: '✏️',
  },
]

export default function PromptSelector({ selectedTemplate, setSelectedTemplate, videoPrompt, setVideoPrompt }) {
  const [expanded, setExpanded] = useState(null)

  function selectTemplate(tpl) {
    setSelectedTemplate(tpl)
    if (tpl.id !== 'custom') setVideoPrompt(tpl.prompt)
    else setVideoPrompt('')
  }

  const isCustom = selectedTemplate?.id === 'custom'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <span className="g-step-label">Step 1 of 5</span>
        <h2 className="g-step-title">Choose your scenario</h2>
        <p className="g-step-sub">
          Pick a cinematic world or write your own.{' '}
          <code className="text-[#4285F4] text-[11px] bg-[#4285F4]/10 px-1.5 py-0.5 rounded font-mono not-italic">
            [REF_Character]
          </code>{' '}
          will be replaced by your character image.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {VIDEO_TEMPLATES.map((tpl) => {
          const selected = selectedTemplate?.id === tpl.id
          const isOpen   = expanded === tpl.id

          return (
            <div key={tpl.id} className="flex flex-col">
              <button
                onClick={() => selectTemplate(tpl)}
                className="text-left rounded-2xl border transition-all duration-200 overflow-hidden"
                style={{
                  borderColor: selected ? tpl.accent : 'rgba(255,255,255,0.07)',
                  background:  selected ? `color-mix(in srgb, ${tpl.accent} 8%, #111)` : '#111',
                  boxShadow:   selected ? `0 0 0 1px ${tpl.accent}28, 0 6px 40px ${tpl.accent}0C` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!selected) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'
                    e.currentTarget.style.background  = '#161616'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.background  = '#111'
                  }
                }}
              >
                {/* Accent top strip */}
                <div className="h-0.5 w-full" style={{ background: tpl.accent }} />

                <div className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{tpl.emoji}</span>
                      <div>
                        <div className="text-[10px] text-white/25 font-mono mb-0.5">{tpl.number}</div>
                        <div className="text-sm font-semibold text-white leading-tight">{tpl.title}</div>
                      </div>
                    </div>
                    {selected && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: tpl.accent }}
                      >
                        <Check className="w-3 h-3 text-black" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Style chip */}
                  <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full border border-white/[0.08] text-white/38">
                    {tpl.style}
                  </span>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-white/38">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: tpl.accent }} />
                    {tpl.location}
                  </div>

                  {/* Dialogue preview */}
                  {tpl.id !== 'custom' && (
                    <p
                      className="text-xs text-white/48 italic leading-relaxed border-l-2 pl-3"
                      style={{ borderColor: `${tpl.accent}80` }}
                    >
                      "{tpl.dialogue}"
                    </p>
                  )}
                  {tpl.id === 'custom' && (
                    <p className="text-xs text-white/33 leading-relaxed">{tpl.dialogue}</p>
                  )}

                  {/* Expand prompt toggle */}
                  {tpl.id !== 'custom' && tpl.prompt && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : tpl.id) }}
                      className="flex items-center gap-1 text-[10px] text-white/28 hover:text-white/55 transition-colors"
                    >
                      {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isOpen ? 'Hide prompt' : 'Preview prompt'}
                    </button>
                  )}

                  {/* Expanded prompt preview */}
                  {isOpen && tpl.id !== 'custom' && (
                    <div className="mt-1 p-3 bg-black/30 rounded-xl border border-white/[0.06] text-[11px] text-white/43 leading-relaxed">
                      {tpl.prompt}
                    </div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Prompt editor */}
      {selectedTemplate && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="w-3.5 h-3.5 text-[#4285F4]" />
              <span className="text-sm text-white/65">
                {isCustom ? 'Write your prompt' : 'Prompt (editable)'}
              </span>
            </div>
            {!isCustom && (
              <button
                onClick={() => setVideoPrompt(selectedTemplate.prompt)}
                className="text-xs text-white/28 hover:text-[#4285F4] transition-colors"
              >
                Reset to original
              </button>
            )}
          </div>

          <textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder={isCustom ? 'Describe your video: setting, action, camera style, lighting, mood…' : ''}
            rows={5}
            maxLength={1500}
            className="g-input resize-none leading-relaxed"
          />

          <div className="flex justify-between items-center">
            {!isCustom && videoPrompt.includes('[REF_Character]') && (
              <span className="text-[10px] text-white/28 flex items-center gap-1">
                <code className="text-[#4285F4] not-italic">[REF_Character]</code> will be replaced by your character image
              </span>
            )}
            {isCustom && videoPrompt.length < 20 && (
              <span className="text-xs text-[#EA4335]">Add more detail for better results</span>
            )}
            <span className="text-xs text-white/18 ml-auto">{videoPrompt.length} / 1500</span>
          </div>
        </div>
      )}
    </div>
  )
}
