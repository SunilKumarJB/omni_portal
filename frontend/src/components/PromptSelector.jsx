import React, { useState, useRef } from 'react'
import clsx from 'clsx'
import { MapPin, PenLine, ChevronDown, ChevronUp, Check, Play } from 'lucide-react'

export const VIDEO_TEMPLATES = [
  {
    id: 'cyberpunk',
    number: '01',
    title: 'The Cyberpunk Neon Hustler',
    style: 'Cyberpunk · 8K · Drone tracking',
    location: 'Times Square, NYC — 2099',
    dialogue: 'They said the city never sleeps. Good… neither do I.',
    prompt: 'One continuous tracking shot on a 35mm lens, gliding in front of [REF_Character] as they walk confidently through a futuristic Times Square at night. The scene has a cinematic style, illuminated by high-contrast cyan and magenta lighting that reflects off the rain-slicked streets and glowing holographic billboards. [REF_Character] wears sleek, modern streetwear with LED accents, moving smoothly and looking directly into the camera with a smirk. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
    accent: '#00D4FF',
    emoji: '🌆',
    videoSrc: '/assets/videos/template_cyberpunk.mp4',
    poster: '/assets/videos/poster_cyberpunk.jpg',
  },
  {
    id: 'action_hero',
    number: '02',
    title: 'The Epic Action Hero',
    style: 'Action blockbuster · Slow-mo · IMAX',
    location: 'The Colosseum, Rome, Italy',
    dialogue: 'Are you not entertained? Because I\'m just getting started.',
    prompt: 'A slow push-in, low-angle medium shot of [REF_Character] standing in the center of the historically accurate Roman Colosseum. Crisp golden hour backlighting casts warm, volumetric sun rays that illuminate floating dust particles in the air. [REF_Character] holds a victorious pose and performs a single, deliberate action: smoothly dusting off their right shoulder. They are wearing a heavy, battle-worn leather coat that billows consistently in a steady breeze. Shot on IMAX 70mm film, photorealistic style, with grounded, cinematic color grading. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
    accent: '#F59E0B',
    emoji: '⚔️',
    videoSrc: '/assets/videos/template_action_hero.mp4',
    poster: '/assets/videos/poster_action_hero.jpg',
  },
  {
    id: 'film_noir',
    number: '03',
    title: 'The Vintage Film Noir Detective',
    style: '1940s Film Noir · B&W · 35mm grain',
    location: 'Eiffel Tower, Paris — Rainy 1920s',
    dialogue: 'Romance is just a myth we tell ourselves to survive the rain.',
    prompt: 'A cinematic 1940s black-and-white film noir shot. Locked-off camera, medium shot. [REF_Character] is framed in the center, leaning casually against a vintage streetlamp, leaving the left side of the frame open with clear negative space. Set on a foggy cobblestone street in Paris, with the Eiffel Tower glowing dimly in the background. Deep shadows and dramatic rim lighting from the streetlamp illuminate [REF_Character]\'s face. Shot on vintage 35mm film with cinematic depth of field, evoking a moody and mysterious atmosphere.  The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
    accent: '#94A3B8',
    emoji: '🕵️',
    videoSrc: '/assets/videos/template_film_noir.mp4',
    poster: '/assets/videos/poster_film_noir.jpg',
  },
  {
    id: 'animated',
    number: '04',
    title: 'The 3D Animated Mischief Maker',
    style: 'Pixar / Disney 3D · Vibrant · Soft lighting',
    location: 'Mount Fuji, Japan — Cherry blossom season',
    dialogue: 'Spring is here, the blossoms are blooming, and nothing is going to plan!',
    prompt: 'Medium shot with a slow, gentle push-in camera movement.A high-quality, high-end 3D computer-animated Pixar shot featuring rich textures, expressive character design, and a cinematic feel. [REF_Character] is standing in a lush, vibrant field of pink cherry blossom trees, with the majestic, snow-capped peak of Mount Fuji towering clearly in the background.Crisp, warm sunlight comes from off-screen, casting soft, flattering shadows and highlighting the vibrant, cheerful colors of the environment. [REF_Character] is initially looking away, then performs a sudden, snappy, comedic double-take directly toward the camera lens as a dynamic gust of wind blows cherry blossom petals rapidly across the foreground. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
    accent: '#F472B6',
    emoji: '🌸',
    videoSrc: '/assets/videos/template_animated.mp4',
    poster: '/assets/videos/poster_animated.jpg',
  },
  {
    id: 'treasure_hunter',
    number: '05',
    title: 'The Desert Treasure Hunter',
    style: 'Adventure-fantasy · Drone · Unreal Engine 5',
    location: 'Great Pyramids of Giza, Egypt',
    dialogue: 'Some secrets are meant to stay buried. Too bad I brought a shovel.',
    prompt: 'A continuous, sweeping wide-angle drone shot smoothly circles [REF_Character], who is standing atop a towering sand dune. In the background, the Great Pyramids of Giza loom majestically. [REF_Character] is dressed in rugged, textured explorer gear and holds an ancient artifact emitting a soft, ethereal light. The scene is lit by a blazing high-noon sun that casts sharp, realistic shadows across the sand, while visible heat distortion waves ripple naturally in the dry air. The aesthetic is a cinematic, hyper-realistic 3D Unreal Engine animation style with a rich, warm orange and teal color grading. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
    accent: '#F97316',
    emoji: '🏺',
    videoSrc: '/assets/videos/template_treasure_hunter.mp4',
    poster: '/assets/videos/poster_treasure_hunter.jpg',
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
    videoSrc: null,
    poster: null,
  },
]

function TemplateThumbnail({ tpl, selected }) {
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)

  if (!tpl.videoSrc) {
    /* Custom card — just show the accent strip */
    return <div className="h-0.5 w-full" style={{ background: tpl.accent }} />
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: videoReady ? 220 : 'auto' }}>
      {/* Accent strip shown until video loads */}
      {!videoReady && <div className="h-0.5 w-full" style={{ background: tpl.accent }} />}

      <video
        ref={videoRef}
        src={tpl.videoSrc}
        poster={tpl.poster || undefined}
        muted
        autoPlay
        loop
        playsInline
        className="w-full object-cover transition-opacity duration-300"
        style={{ height: 220, opacity: videoReady ? 1 : 0 }}
        onCanPlay={() => setVideoReady(true)}
        onError={() => setVideoReady(false)}
      />

      {/* Gradient overlay + play badge */}
      {videoReady && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, transparent 40%, ${tpl.accent}28 100%)` }}
          />
          <div
            className="absolute bottom-1.5 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{ background: 'rgba(0,0,0,0.55)', color: tpl.accent }}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            Preview
          </div>
          {/* Thin accent line at top when video is visible */}
          <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: tpl.accent }} />
        </>
      )}
    </div>
  )
}

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
                {/* Video thumbnail or accent strip */}
                <TemplateThumbnail tpl={tpl} selected={selected} />

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
