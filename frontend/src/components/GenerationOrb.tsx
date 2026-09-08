import type { GenerationStage } from '@/lib/types';

export const STAGE_LABELS: Record<GenerationStage, string> = {
  queued: 'Your video is in the queue',
  uploading: 'Preparing your presenter',
  submitting: 'Starting your video',
  generating: 'Creating your scene',
  finalizing: 'Finishing your video',
  completed: 'Your video is ready',
  failed: 'Video could not be created',
};

export function formatElapsed(seconds: number) {
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/** Decorative motion stays separate from the readable, live stage announcement. */
export default function GenerationOrb({
  stage = 'queued',
  elapsed = 0,
  compact = false,
}: {
  stage?: GenerationStage;
  elapsed?: number;
  compact?: boolean;
}) {
  return (
    <div className={`generation-wait ${compact ? 'generation-wait-compact' : ''}`}>
      <div className="generation-orb" aria-hidden="true">
        <div className="generation-orb-aura" />
        <div className="generation-orb-halo" />
        <div className="generation-orb-sphere">
          <div className="generation-orb-light" />
          <span className="generation-orb-mark">omni</span>
        </div>
        <div className="generation-orb-satellite" />
      </div>
      <div className="relative space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          A little imagination in motion
        </p>
        <p role="status" className="text-lg font-medium tracking-tight text-white">
          {STAGE_LABELS[stage]}
        </p>
        <p className="text-sm tabular-nums text-white/60">
          {formatElapsed(elapsed)} elapsed · Usually a few minutes
        </p>
      </div>
    </div>
  );
}
