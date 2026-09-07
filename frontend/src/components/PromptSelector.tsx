import { Check, MapPin, PenLine, Play, Sparkles } from 'lucide-react';
import type * as React from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ProductPreset, VideoTemplate } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'bollywood_romance',
    number: '01',
    title: 'Bollywood Romance',
    style: 'Cinematic Drama · Warm Gold',
    location: 'Udaipur Palace / Punjab Fields',
    dialogue: 'They say love is in the air. Personally, I prefer a more premium elevation.',
    prompt:
      'A slow push-in, medium shot of [REF_Character] in a grand Bollywood romance scene. The lighting is warm and golden, casting a romantic glow. Wind gently blows through their hair and clothes as marigold petals drift in the background. High-saturation colors and dramatic slow-motion capture the emotional depth and premium grandeur of the moment.',
    accent: '#EA4335',
    emoji: '🎬',
    videoSrc: '/assets/videos/template_bollywood_romance.mp4',
    poster: null,
  },
  {
    id: 'cyberpunk_bengaluru',
    number: '02',
    title: 'Cyberpunk Bengaluru',
    style: 'Sci-Fi · Neon Saffron',
    location: 'Bengaluru Tech-Hub 2050',
    dialogue: 'They said the city never sleeps. Good… neither do my innovations.',
    prompt:
      'One continuous tracking shot on a 35mm lens, gliding in front of [REF_Character] as they walk through a futuristic Bengaluru in 2050 at night. The scene is illuminated by electric saffron and deep teal neon lights. Hovering auto-rickshaws fly in the background, and glowing Sanskrit holographic billboards light up the rain-slicked streets and futuristic street-food stalls.',
    accent: '#FF9900',
    emoji: '🛺',
    videoSrc: '/assets/videos/template_cyberpunk_bengaluru.mp4',
    poster: null,
  },
  {
    id: 'monsoon_drama',
    number: '03',
    title: 'Monsoon Backwaters',
    style: 'Moody Travelogue · Emerald Green',
    location: 'Kerala Houseboat',
    dialogue: 'In the heart of the monsoon, peace isn’t just a feeling. It’s a luxury.',
    prompt:
      'A serene, slow-drifting medium shot of [REF_Character] on a luxurious wooden houseboat drifting along the tranquil backwaters of Kerala during a lush monsoon. Moody slate-grey skies and rich emerald-green palms frame the scene. Heavy rain patters on the water, and mist rises from the canals, with slow-motion close-ups capturing the rich wood textures and rain droplets.',
    accent: '#34A853',
    emoji: '🌧️',
    videoSrc: '/assets/videos/template_monsoon_drama.mp4',
    poster: null,
  },
  {
    id: 'mythology_fusion',
    number: '04',
    title: 'Ancient-Tech Hampi',
    style: 'Epic Fantasy · Glowing Gold',
    location: 'Hampi Temple Ruins',
    dialogue: 'Some legends are carved in stone. Others are written in the stars.',
    prompt:
      'A majestic, sweeping wide shot of [REF_Character] standing amidst the grand stone ruins of an ancient temple in Hampi, infused with futuristic technology. Ancient stone carvings glow with golden energy runes, and stone monoliths float silently in the air. Dramatic volumetric sun rays stream through the pillars, creating an epic, mythological atmosphere of grand scale.',
    accent: '#4285F4',
    emoji: '🔱',
    videoSrc: '/assets/videos/template_mythology_fusion.mp4',
    poster: null,
  },
  {
    id: 'pixar_style',
    number: '05',
    title: '3D Pixar Style',
    style: '3D Animated · Warm Digital',
    location: 'Festive Indian Home',
    dialogue: 'Home is where the heart is. And today, it’s glowing.',
    prompt:
      'A warm, vibrant 3D Pixar-style digital animation. [REF_Character], a cute character with highly expressive eyes, is in a brightly lit Indian home decorated with marigold garlands. The camera captures the glossy surfaces, colorful design, and fun animations of the festive room in the soft, warm light.',
    accent: '#34A853',
    emoji: '🏡',
    videoSrc: '/assets/videos/template_pixar_style.mp4',
    poster: null,
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

const PRODUCT_POSTURES: Record<string, 'active' | 'relaxed' | 'vehicle'> = {
  aggressive_toaster: 'active',
  snooze_blanket: 'relaxed',
  flying_sneakers: 'active',
  flying_suv: 'vehicle',
  impatient_spoon: 'active',
  diet_plate: 'active',
};

const TAILORED_PROMPTS: Record<string, Record<'active' | 'relaxed' | 'vehicle', string>> = {
  bollywood_romance: {
    active:
      'A slow push-in, medium shot of [REF_Character] in a grand Bollywood romance scene. The lighting is warm and golden, casting a romantic glow. Wind gently blows through their hair and clothes as marigold petals drift in the background. High-saturation colors and dramatic slow-motion capture the emotional depth and premium grandeur of the moment as they actively showcase the product.',
    relaxed:
      'A serene, slow-drifting medium shot of [REF_Character] lounging peacefully on a luxurious heritage daybed on a palace balcony in Udaipur at sunset. Wrapped in the comfort of the product, they look completely relaxed as marigold petals drift around them in the warm, golden hour light, creating a quiet, romantic oasis.',
    vehicle:
      "A grand, low-angle wide shot of [REF_Character] standing beside the vehicle parked on a scenic lakeside palace road in Udaipur at sunset. The warm, golden hour sun casts a romantic glow. The camera sweeps around to showcase the vehicle's impressive scale, sleek lines, and premium details reflecting the vibrant colors of the palace.",
  },
  cyberpunk_bengaluru: {
    active:
      'One continuous tracking shot on a 35mm lens, gliding in front of [REF_Character] as they walk confidently through a futuristic Bengaluru in 2050 at night. The scene is illuminated by electric saffron and deep teal neon lights. [REF_Character] is actively using the product, and the camera focuses on a detailed close-up of the product in action against the backdrop of hovering auto-rickshaws and glowing Sanskrit holographic billboards.',
    relaxed:
      'A slow, atmospheric medium shot of [REF_Character] relaxing in a sleek, high-tech lounge overlooking the glowing neon streets of futuristic Bengaluru in 2050 at night. Illuminated by soft, moody saffron and teal ambient light, [REF_Character] is peacefully enjoying the product. The camera gently drifts, capturing the soothing textures and features of the product in the vibrant, high-tech city.',
    vehicle:
      "A dramatic, sweeping wide shot of [REF_Character] standing on a high-altitude neon-lit sky terrace overlooking futuristic Bengaluru in 2050 at night. The vehicle is parked prominently beside them. The camera pans to showcase the vehicle's sleek aerodynamic lines, glowing engines, and futuristic design reflecting the vibrant saffron and teal neon lights of the city below.",
  },
  monsoon_drama: {
    active:
      "A serene, slow-drifting medium shot of [REF_Character] on the covered deck of a luxurious wooden houseboat in Kerala during a lush monsoon. Moody slate-grey skies and rich emerald-green palms frame the scene. [REF_Character] is actively using the product, and the camera glides in for a close-up, capturing the product's sleek design and textures against the heavy rain pattering on the water.",
    relaxed:
      'A moody, atmospheric medium shot of [REF_Character] relaxing snugly inside the glass-walled cabin of a luxury Kerala houseboat. Wrapped in the comfort of the product, they watch the monsoon rain pour outside. The camera gently drifts, capturing the quiet, soothing comfort of the product against the backdrop of lush green palms and misty waters.',
    vehicle:
      "A dramatic, wet wide shot of the vehicle parked on a lush green jetty in the Kerala backwaters during a monsoon rain. [REF_Character] stands beside the vehicle under a large umbrella. The camera showcases the vehicle's sleek, water-glistening lines, retractable wings, and glowing engines standing out against the misty, emerald-green landscape.",
  },
  mythology_fusion: {
    active:
      "A majestic, sweeping wide shot of [REF_Character] standing amidst the grand stone ruins of an ancient temple in Hampi, infused with futuristic technology. [REF_Character] is actively using the product, which glows with energy. The camera glides in for a-close-up, showcasing the product's high-tech utility against the backdrop of ancient stone carvings glowing with golden energy runes and floating monoliths.",
    relaxed:
      "A serene, slow-drifting medium shot of [REF_Character] lounging peacefully on a stone veranda overlooking the grand temple ruins of Hampi. Wrapped in the comfort of the product, they find peace. Dramatic volumetric sun rays stream through the pillars, highlighting the product's rich textures against the mystical, ancient-tech ruins.",
    vehicle:
      "A grand, sweeping wide shot of the vehicle parked atop a rocky hill overlooking the ancient temple ruins of Hampi. [REF_Character] stands proudly beside the vehicle. The camera showcases the vehicle's impressive scale, sleek lines, and glowing engines standing out against the historic stone gopurams and floating ruins in the golden hour light.",
  },
  pixar_style: {
    active:
      'A warm, vibrant 3D Pixar-style digital animation. [REF_Character], a cute character with highly expressive eyes, is in a brightly lit Indian home decorated with marigold garlands. They are actively using the product, reacting with joyful amazement. The camera focuses on the product, showcasing its glossy surfaces, colorful design, and fun animations in the soft, warm light.',
    relaxed:
      "A cozy, warm 3D Pixar-style digital animation. [REF_Character], a cute expressive character, is lounging happily on a pile of colorful silk cushions in a festive Indian home. Snugly enjoying the product, they look blissfully happy. The camera zooms in on the product's soft, inviting textures and comforting features in the cheerful, sun-drenched room.",
    vehicle:
      "A cheerful, wide-angle shot in a vibrant 3D Pixar-style animation. The vehicle, with a friendly and sleek glossy design, is parked in the driveway of a festive Indian home decorated with lights. [REF_Character] stands beside it, gesturing happily. The camera sweeps around to show the vehicle's fun features and glossy reflections.",
  },
};

interface TemplateThumbnailProps {
  tpl: VideoTemplate;
  /** Detail panel keeps the classic autoplay/loop preview; cards default to hover-to-play. */
  autoPlay?: boolean;
  /** Card grid only: lets the parent drive play/pause on hover and focus. */
  videoRef?: (el: HTMLVideoElement | null) => void;
}

function TemplateThumbnail({ tpl, autoPlay = false, videoRef }: TemplateThumbnailProps) {
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
          autoPlay={autoPlay}
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
  userName: string;
  selectedProduct: ProductPreset | null;
  selectedTemplate: VideoTemplate | null;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<VideoTemplate | null>>;
  videoPrompt: string;
  setVideoPrompt: React.Dispatch<React.SetStateAction<string>>;
  dialogueText: string;
}

export default function PromptSelector({
  userName,
  selectedProduct,
  selectedTemplate,
  setSelectedTemplate,
  videoPrompt,
  setVideoPrompt,
  dialogueText,
}: PromptSelectorProps) {
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  function buildPromptForTemplate(tpl: VideoTemplate): string {
    if (tpl.id === 'custom') return '';

    const pName = selectedProduct?.name || 'our product';
    const pVisual = selectedProduct?.visualDescription || 'interacting with the product';
    const cName = userName || 'our character';
    const pId = selectedProduct?.id || '';

    const posture = PRODUCT_POSTURES[pId] || 'active';
    let basePrompt = TAILORED_PROMPTS[tpl.id]?.[posture] || tpl.prompt;

    // Dynamically inject the product name into the scenario prompt for maximum customization
    basePrompt = basePrompt
      .replace(/the product/g, pName)
      .replace(/the vehicle/g, pName)
      .replace(/product's/g, `${pName}'s`)
      .replace(/vehicle's/g, `${pName}'s`);

    return `A premium high-fidelity commercial for ${pName}, starring the character ${cName} (represented by [REF_Character]). In the scene, [REF_Character] is ${pVisual}. ${basePrompt}`;
  }

  function selectTemplate(tpl: VideoTemplate) {
    setSelectedTemplate(tpl);
    setVideoPrompt(buildPromptForTemplate(tpl));
  }

  function playCardVideo(id: string) {
    const el = videoElsRef.current.get(id);
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => {
      // Autoplay/hover-play can be rejected by the browser; the poster/last frame stays visible.
    });
  }

  function pauseCardVideo(id: string) {
    const el = videoElsRef.current.get(id);
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  const isCustom = selectedTemplate?.id === 'custom';

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-4">
      <StepHeading eyebrow="Step 5 of 6" title="Choose your scenario" className="mb-0">
        Pick a cinematic world or write your own.{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs xl:text-sm not-italic text-foreground">
          [REF_Character]
        </code>{' '}
        will be replaced by your character image.
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        {/* Left Column: Dense grid of scenarios (3 columns on xl screens to fit 6 cards in 2 rows) */}
        <div className="min-h-0 lg:col-span-7">
          <div className="grid h-full min-h-0 grid-cols-2 xl:grid-cols-3 gap-3">
            {VIDEO_TEMPLATES.map((tpl) => {
              const selected = selectedTemplate?.id === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onMouseEnter={() => playCardVideo(tpl.id)}
                  onMouseLeave={() => pauseCardVideo(tpl.id)}
                  onFocus={() => playCardVideo(tpl.id)}
                  onBlur={() => pauseCardVideo(tpl.id)}
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
                    <TemplateThumbnail
                      tpl={tpl}
                      videoRef={(el) => {
                        if (el) videoElsRef.current.set(tpl.id, el);
                        else videoElsRef.current.delete(tpl.id);
                      }}
                    />

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
              <TemplateThumbnail tpl={selectedTemplate} autoPlay />
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

                {dialogueText?.trim() ? (
                  <p
                    className="line-clamp-2 border-l-2 pl-3 text-xs font-medium italic leading-relaxed text-muted-foreground/90 xl:text-sm"
                    style={{ borderColor: `${selectedTemplate.accent}80` }}
                  >
                    "{dialogueText}"
                  </p>
                ) : (
                  <p className="text-xs italic text-muted-foreground pl-3 border-l-2 border-border">
                    Silent scene (no spoken dialogue)
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
                        onClick={() => setVideoPrompt(buildPromptForTemplate(selectedTemplate))}
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
