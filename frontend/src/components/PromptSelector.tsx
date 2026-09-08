import { Check, MapPin, PenLine, Play, Sparkles } from 'lucide-react';
import type * as React from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VIDEO_TEMPLATES } from '@/data/scenarios';
import type { ProductPreset, VideoTemplate } from '@/lib/types';
import { cn } from '@/lib/utils';
import StepHeading from './StepHeading';

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
          autoPlay={false}
          controls={autoPlay}
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
  setVideoPrompt: (value: string) => void;
  onResetPrompt: () => void;
  dialogueText: string;
}

export default function PromptSelector({
  selectedTemplate,
  setSelectedTemplate,
  videoPrompt,
  setVideoPrompt,
  onResetPrompt,
  dialogueText,
}: PromptSelectorProps) {
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  function selectTemplate(tpl: VideoTemplate) {
    setSelectedTemplate(tpl);
  }

  function playCardVideo(id: string) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
        Choose a style example or write your own scene. Your video will use your selected presenter
        and product.{' '}
      </StepHeading>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        {/* Left Column: Dense grid of scenarios (3 columns on xl screens to fit 6 cards in 2 rows) */}
        <div className="min-h-0 lg:col-span-7">
          <div className="grid h-full min-h-0 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                    'group relative min-h-[270px] min-w-0 overflow-hidden rounded-xl border bg-card transition-all duration-200',
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
            <div className="flex h-full min-h-[580px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <TemplateThumbnail tpl={selectedTemplate} autoPlay />
              <p className="px-4 pt-3 text-xs text-muted-foreground">
                Style example — your presenter and product will differ. Press play to preview.
              </p>
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
                        onClick={() => onResetPrompt()}
                        className="text-xs xl:text-sm text-muted-foreground transition-colors hover:text-foreground underline underline-offset-2"
                      >
                        Reset to original
                      </button>
                    )}
                  </div>

                  <Textarea
                    aria-label="Scene instructions"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder={
                      isCustom
                        ? 'Describe your video: setting, action, camera style, lighting, mood…'
                        : ''
                    }
                    rows={4}
                    maxLength={1500}
                    className="min-h-[240px] flex-1 resize-y overflow-y-auto bg-background text-sm leading-relaxed"
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
                Choose a cinematic scenario above or beside this panel to start editing your prompt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
