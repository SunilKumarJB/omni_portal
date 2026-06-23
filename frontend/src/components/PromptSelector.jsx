import { Check, ChevronDown, ChevronUp, MapPin, PenLine, Play } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading.jsx';

export const VIDEO_TEMPLATES = [
  {
    id: 'cyberpunk',
    number: '01',
    title: 'The Cyberpunk Neon Hustler',
    style: 'Cyberpunk · 8K · Drone tracking',
    location: 'Times Square, NYC — 2099',
    dialogue: 'They said the city never sleeps. Good… neither do I.',
    prompt:
      'One continuous tracking shot on a 35mm lens, gliding in front of [REF_Character] as they walk confidently through a futuristic Times Square at night. The scene has a cinematic style, illuminated by high-contrast cyan and magenta lighting that reflects off the rain-slicked streets and glowing holographic billboards. [REF_Character] wears sleek, modern streetwear with LED accents, moving smoothly and looking directly into the camera with a smirk. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
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
    dialogue: "Are you not entertained? Because I'm just getting started.",
    prompt:
      'A slow push-in, low-angle medium shot of [REF_Character] standing in the center of the historically accurate Roman Colosseum. Crisp golden hour backlighting casts warm, volumetric sun rays that illuminate floating dust particles in the air. [REF_Character] holds a victorious pose and performs a single, deliberate action: smoothly dusting off their right shoulder. They are wearing a heavy, battle-worn leather coat that billows consistently in a steady breeze. Shot on IMAX 70mm film, photorealistic style, with grounded, cinematic color grading. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
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
    prompt:
      "A cinematic 1940s black-and-white film noir shot. Locked-off camera, medium shot. [REF_Character] is framed in the center, leaning casually against a vintage streetlamp, leaving the left side of the frame open with clear negative space. Set on a foggy cobblestone street in Paris, with the Eiffel Tower glowing dimly in the background. Deep shadows and dramatic rim lighting from the streetlamp illuminate [REF_Character]'s face. Shot on vintage 35mm film with cinematic depth of field, evoking a moody and mysterious atmosphere.  The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.",
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
    prompt:
      'Medium shot with a slow, gentle push-in camera movement.A high-quality, high-end 3D computer-animated Pixar shot featuring rich textures, expressive character design, and a cinematic feel. [REF_Character] is standing in a lush, vibrant field of pink cherry blossom trees, with the majestic, snow-capped peak of Mount Fuji towering clearly in the background.Crisp, warm sunlight comes from off-screen, casting soft, flattering shadows and highlighting the vibrant, cheerful colors of the environment. [REF_Character] is initially looking away, then performs a sudden, snappy, comedic double-take directly toward the camera lens as a dynamic gust of wind blows cherry blossom petals rapidly across the foreground. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
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
    prompt:
      'A continuous, sweeping wide-angle drone shot smoothly circles [REF_Character], who is standing atop a towering sand dune. In the background, the Great Pyramids of Giza loom majestically. [REF_Character] is dressed in rugged, textured explorer gear and holds an ancient artifact emitting a soft, ethereal light. The scene is lit by a blazing high-noon sun that casts sharp, realistic shadows across the sand, while visible heat distortion waves ripple naturally in the dry air. The aesthetic is a cinematic, hyper-realistic 3D Unreal Engine animation style with a rich, warm orange and teal color grading. The character must look exactly like the provided [REF_Character] image, maintaining their precise likeness and facial features.',
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
    accent: '#888888',
    emoji: '✏️',
    videoSrc: null,
    poster: null,
  },
];

function TemplateThumbnail({ tpl }) {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);

  if (!tpl.videoSrc) {
    /* Custom card — show a thin brand-accent strip */
    return <div className="ai-gradient-line h-0.5 w-full" />;
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: videoReady ? 220 : 'auto' }}>
      {/* Accent strip shown until video loads (per-template "customer tone" nod) */}
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

      {videoReady && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          <div className="absolute bottom-1.5 right-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
            <Play className="h-2.5 w-2.5 fill-current" />
            Preview
          </div>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: tpl.accent }} />
        </>
      )}
    </div>
  );
}

export default function PromptSelector({
  selectedTemplate,
  setSelectedTemplate,
  videoPrompt,
  setVideoPrompt,
}) {
  const [expanded, setExpanded] = useState(null);

  function selectTemplate(tpl) {
    setSelectedTemplate(tpl);
    if (tpl.id !== 'custom') setVideoPrompt(tpl.prompt);
    else setVideoPrompt('');
  }

  const isCustom = selectedTemplate?.id === 'custom';

  return (
    <div className="mx-auto max-w-4xl">
      <StepHeading eyebrow="Step 1 of 5" title="Choose your scenario">
        Pick a cinematic world or write your own.{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] not-italic text-foreground">
          [REF_Character]
        </code>{' '}
        will be replaced by your character image.
      </StepHeading>

      {/* Template grid */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {VIDEO_TEMPLATES.map((tpl) => {
          const selected = selectedTemplate?.id === tpl.id;
          const isOpen = expanded === tpl.id;

          return (
            <div key={tpl.id} className="flex flex-col">
              <button
                onClick={() => selectTemplate(tpl)}
                className={cn(
                  'overflow-hidden rounded-lg border bg-card text-left transition-all duration-200',
                  selected
                    ? 'border-foreground ring-1 ring-foreground'
                    : 'border-border hover:border-foreground/30 hover:bg-accent/40',
                )}
              >
                <TemplateThumbnail tpl={tpl} />

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none">{tpl.emoji}</span>
                      <div>
                        <div className="mb-0.5 font-mono text-[10px] text-muted-foreground/60">
                          {tpl.number}
                        </div>
                        <div className="text-sm font-semibold leading-tight text-foreground">
                          {tpl.title}
                        </div>
                      </div>
                    </div>
                    {selected && (
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-foreground">
                        <Check className="h-3 w-3 text-background" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <span className="inline-block rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    {tpl.style}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: tpl.accent }} />
                    {tpl.location}
                  </div>

                  {tpl.id !== 'custom' ? (
                    <p
                      className="border-l-2 pl-3 text-xs italic leading-relaxed text-muted-foreground"
                      style={{ borderColor: `${tpl.accent}80` }}
                    >
                      "{tpl.dialogue}"
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted-foreground">{tpl.dialogue}</p>
                  )}

                  {tpl.id !== 'custom' && tpl.prompt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(isOpen ? null : tpl.id);
                      }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {isOpen ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {isOpen ? 'Hide prompt' : 'Preview prompt'}
                    </button>
                  )}

                  {isOpen && tpl.id !== 'custom' && (
                    <div className="mt-1 rounded-md border border-border bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
                      {tpl.prompt}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Prompt editor */}
      {selectedTemplate && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground/80">
                {isCustom ? 'Write your prompt' : 'Prompt (editable)'}
              </span>
            </div>
            {!isCustom && (
              <button
                onClick={() => setVideoPrompt(selectedTemplate.prompt)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Reset to original
              </button>
            )}
          </div>

          <Textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder={
              isCustom ? 'Describe your video: setting, action, camera style, lighting, mood…' : ''
            }
            rows={5}
            maxLength={1500}
            className="resize-none"
          />

          <div className="flex items-center justify-between">
            {!isCustom && videoPrompt.includes('[REF_Character]') && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <code className="font-mono not-italic text-foreground">[REF_Character]</code> will
                be replaced by your character image
              </span>
            )}
            {isCustom && videoPrompt.length < 20 && (
              <span className="text-xs text-destructive">Add more detail for better results</span>
            )}
            <span className="ml-auto text-xs text-muted-foreground/60">
              {videoPrompt.length} / 1500
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
