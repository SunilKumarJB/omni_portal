import { Check, MapPin, PenLine, Play, Sparkles } from 'lucide-react';
import type * as React from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { VideoTemplate } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

export const VIDEO_TEMPLATES: VideoTemplate[] = [
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

function TemplateThumbnail({ tpl }: { tpl: VideoTemplate }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  if (!tpl.videoSrc) {
    /* Custom card — show a thin brand-accent strip */
    return <div className="ai-gradient-line h-0.5 w-full" />;
  }

  return (
    <div className="relative aspect-[16/7] w-full min-w-0 overflow-hidden bg-muted/25">
      {!videoFailed ? (
        <video
          ref={videoRef}
          src={tpl.videoSrc}
          poster={tpl.poster || undefined}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onError={() => setVideoFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/30 text-2xl">
          {tpl.emoji}
        </div>
      )}

      {!videoFailed && (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          <div className="absolute bottom-2 right-2.5 hidden items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white 2xl:flex">
            <Play className="h-2.5 w-2.5 fill-current" />
            Preview
          </div>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: tpl.accent }} />
        </>
      )}
    </div>
  );
}

interface PromptSelectorProps {
  selectedTemplate: VideoTemplate | null;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<VideoTemplate | null>>;
  videoPrompt: string;
  setVideoPrompt: React.Dispatch<React.SetStateAction<string>>;
}

export default function PromptSelector({
  selectedTemplate,
  setSelectedTemplate,
  videoPrompt,
  setVideoPrompt,
}: PromptSelectorProps) {
  function selectTemplate(tpl: VideoTemplate) {
    setSelectedTemplate(tpl);
    if (tpl.id !== 'custom') setVideoPrompt(tpl.prompt);
    else setVideoPrompt('');
  }

  const isCustom = selectedTemplate?.id === 'custom';

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 1 of 5" title="Choose your scenario" className="mb-0">
        Pick a cinematic world or write your own.{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs xl:text-sm not-italic text-foreground">
          [REF_Character]
        </code>{' '}
        will be replaced by your character image.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        {/* Left Column: Dense grid of scenarios (3 columns on xl screens to fit 6 cards in 2 rows) */}
        <div className="min-h-0 lg:col-span-7">
          <div className="grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-3">
            {VIDEO_TEMPLATES.map((tpl) => {
              const selected = selectedTemplate?.id === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className={cn(
                    'group relative min-h-0 min-w-0 overflow-hidden rounded-xl border bg-card transition-all duration-200',
                    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                    selected
                      ? 'border-foreground ring-1 ring-foreground'
                      : 'border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-accent/40 hover:shadow-lg hover:shadow-black/5',
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Select scenario: ${tpl.title}`}
                    aria-pressed={selected}
                    onClick={() => selectTemplate(tpl)}
                    className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
                  />

                  <div className="pointer-events-none relative z-10 flex h-full min-h-0 min-w-0 flex-col">
                    <TemplateThumbnail tpl={tpl} />

                    <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span className="text-xl leading-none">{tpl.emoji}</span>
                          <div className="min-w-0">
                            <div className="line-clamp-2 text-[15px] font-bold leading-tight text-foreground">
                              {tpl.title}
                            </div>
                          </div>
                        </div>
                        {selected && (
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground">
                            <Check className="h-3 w-3 text-background" strokeWidth={3.5} />
                          </div>
                        )}
                      </div>

                      <div className="min-h-0 flex-1 rounded-lg border border-border/60 bg-background/35 p-2.5">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <span className="inline-block max-w-full truncate rounded-full border border-border bg-card/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {tpl.style.split(' · ')[0]}
                          </span>
                        </div>
                        <p className="line-clamp-4 text-xs font-medium leading-relaxed text-muted-foreground/90">
                          {tpl.id === 'custom'
                            ? 'Build a scene from scratch with your own setting, camera move, action, lighting, and mood.'
                            : tpl.dialogue}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 border-t border-border/60 pt-2 text-xs font-semibold text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: tpl.accent }} />
                        <span className="truncate">{tpl.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active details + Editor */}
        <div className="min-h-0 space-y-3 lg:col-span-5">
          {selectedTemplate ? (
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <TemplateThumbnail tpl={selectedTemplate} />
              <div className="flex min-h-0 flex-1 flex-col space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{selectedTemplate.emoji}</span>
                    <div>
                      <h3 className="text-base font-bold leading-tight text-foreground xl:text-lg">
                        {selectedTemplate.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium">
                  <span className="rounded-full border border-border bg-muted/30 px-2.5 py-0.5 text-muted-foreground">
                    {selectedTemplate.style}
                  </span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: selectedTemplate.accent }}
                    />
                    {selectedTemplate.location}
                  </div>
                </div>

                {selectedTemplate.id !== 'custom' && selectedTemplate.dialogue && (
                  <p
                    className="line-clamp-2 border-l-2 pl-3 text-xs font-medium italic leading-relaxed text-muted-foreground/90 xl:text-sm"
                    style={{ borderColor: `${selectedTemplate.accent}80` }}
                  >
                    "{selectedTemplate.dialogue}"
                  </p>
                )}

                {/* Prompt Editor */}
                <div className="flex min-h-0 flex-1 flex-col space-y-2.5 border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PenLine className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs xl:text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                        {isCustom ? 'Write your prompt' : 'Prompt (editable)'}
                      </span>
                    </div>
                    {!isCustom && (
                      <button
                        onClick={() => setVideoPrompt(selectedTemplate.prompt)}
                        className="text-xs xl:text-sm text-muted-foreground transition-colors hover:text-foreground underline underline-offset-2"
                      >
                        Reset to original
                      </button>
                    )}
                  </div>

                  <Textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder={
                      isCustom
                        ? 'Describe your video: setting, action, camera style, lighting, mood…'
                        : ''
                    }
                    rows={4}
                    maxLength={1500}
                    className="min-h-0 flex-1 resize-none overflow-hidden bg-background text-sm leading-relaxed"
                  />

                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    {!isCustom && videoPrompt.includes('[REF_Character]') ? (
                      <span>
                        <code className="font-mono not-italic text-foreground">
                          [REF_Character]
                        </code>{' '}
                        gets replaced by presenter
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="tabular-nums font-medium">{videoPrompt.length} / 1500</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
              <div className="rounded-full border border-border bg-muted/60 p-4 mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-bold text-sm xl:text-base text-foreground">No scenario selected</p>
              <p className="text-xs xl:text-sm text-muted-foreground mt-1.5 max-w-[240px] xl:max-w-[280px] leading-relaxed">
                Choose a cinematic scenario from the left to start editing your prompt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
