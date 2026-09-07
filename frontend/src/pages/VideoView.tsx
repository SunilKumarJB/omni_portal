import axios from 'axios';
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  QrCode,
  Share2,
  Volume2,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { FieldLabel } from '@/components/StepHeading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatPromptForDisplay } from '@/lib/prompt';
import { getVideo, subscribeToStatus } from '../lib/api';
import type { GenerationStage, GenerationStatus, VideoRequestData } from '../lib/types';

const STATUS_CFG: Record<
  GenerationStatus,
  { label: string; variant: 'warning' | 'secondary' | 'success' | 'destructive' }
> = {
  pending: { label: 'Queued', variant: 'warning' },
  processing: { label: 'Generating', variant: 'secondary' },
  completed: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

const STAGE_LABELS: Record<GenerationStage, string> = {
  queued: 'Queued',
  uploading: 'Uploading your presenter',
  submitting: 'Sending to Gemini Omni',
  generating: 'Gemini Omni is rendering your scene',
  finalizing: 'Finalizing your video',
  completed: 'Done',
  failed: 'Failed',
};

const LOAD_ATTEMPTS = 3;
const LOAD_RETRY_MS = 1000;

/**
 * Phones refuse unmuted autoplay and iOS goes fullscreen without playsInline, so the
 * video starts muted and inline with an explicit gesture to bring the sound in.
 */
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function enableSound() {
    const el = videoRef.current;
    setMuted(false);
    if (!el) return;
    el.muted = false;
    void el.play().catch(() => undefined);
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted={muted}
        playsInline
        loop
        controls
        className="h-full w-full object-contain"
      />
      {muted && (
        <button
          type="button"
          onClick={enableSound}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5 rounded-full border border-white/20 bg-black/70 px-6 py-3.5 text-base font-semibold text-white shadow-xl backdrop-blur-md transition-transform hover:scale-[1.03]"
        >
          <Volume2 className="h-5 w-5" /> Tap for sound
        </button>
      )}
    </div>
  );
}

export default function VideoView() {
  const { requestId } = useParams();
  const [video, setVideo] = useState<VideoRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phones opening the QR often land on a flaky first request; retry the transport
  // failures, but surface a real 404 immediately.
  useEffect(() => {
    if (!requestId) {
      setError('Video not found');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      for (let attempt = 1; attempt <= LOAD_ATTEMPTS; attempt++) {
        try {
          const data = await getVideo(requestId);
          if (cancelled) return;
          setVideo(data);
          setError(null);
          setLoading(false);
          return;
        } catch (err) {
          if (cancelled) return;
          const status = axios.isAxiosError(err) ? err.response?.status : undefined;
          if (status === 404) {
            setError('Video not found');
            setLoading(false);
            return;
          }
          if (status !== undefined || attempt === LOAD_ATTEMPTS) {
            setError('Could not reach the server');
            setLoading(false);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_MS));
        }
      }
    };

    setLoading(true);
    void load();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const loaded = video !== null;
  const isTerminal = video?.status === 'completed' || video?.status === 'failed';

  // One subscription per request while it is still running: `loaded` and `isTerminal`
  // each flip once, so the stream is opened once and torn down when it finishes.
  useEffect(() => {
    if (!requestId || !loaded || isTerminal) return;
    const unsubscribe = subscribeToStatus(requestId, (updated) => {
      setVideo(updated);
    });
    return () => unsubscribe();
  }, [requestId, loaded, isTerminal]);

  const pageUrl = window.location.href;
  const s = video ? STATUS_CFG[video.status] : STATUS_CFG.pending;
  const displayRequestId = requestId ?? video?.request_id ?? '';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );

  if (error || !video)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div>
          <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" strokeWidth={1.5} />
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">
            {error ?? 'Video not found'}
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {error === 'Video not found'
              ? 'This link does not match any generated video.'
              : 'The backend did not respond. Check your connection and try again.'}
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Create a new video
            </Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Brand moment — four-color AI gradient hugging the top edge */}
      <div className="ai-gradient-top" aria-hidden />

      <AppHeader
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" /> Create new
            </Link>
          </Button>
        }
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Generated video</h1>
          <Badge variant={s.variant}>
            {video.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
            {video.status === 'completed' && <Check className="h-3 w-3" />}
            {s.label}
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Video */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
              {video.status === 'completed' && video.video_url ? (
                <VideoPlayer src={video.video_url} />
              ) : video.status === 'processing' || video.status === 'pending' ? (
                <div className="space-y-3 px-6 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="text-sm text-muted-foreground">
                    {video.stage ? STAGE_LABELS[video.stage] : 'Omni is generating your video…'}
                  </p>
                  {(video.progress ?? 0) > 0 && (
                    <div className="mx-auto w-40">
                      <Progress value={video.progress ?? 0} />
                      <p className="mt-1.5 text-center text-xs text-muted-foreground tabular-nums">
                        {video.progress ?? 0}%
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="mx-auto mb-2 h-10 w-10 text-destructive" strokeWidth={1.5} />
                  <p className="text-sm text-destructive">Generation failed</p>
                  {video.error && (
                    <p className="mt-1 text-xs text-muted-foreground">{video.error}</p>
                  )}
                </div>
              )}
            </div>

            {video.status === 'completed' && video.video_url && (
              <div className="flex gap-3">
                <Button asChild>
                  <a href={video.video_url} download target="_blank" rel="noopener">
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
                {canShare && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      void navigator.share?.({ url: pageUrl }).catch(() => undefined);
                    }}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                )}
              </div>
            )}

            {video.prompt && (
              <Card className="p-5">
                <FieldLabel>Prompt</FieldLabel>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {formatPromptForDisplay(video.prompt)}
                </p>
                {(video.style_id || video.language) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {video.style_id && <Badge variant="outline">{video.style_id}</Badge>}
                    {video.language && <Badge variant="outline">{video.language}</Badge>}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="space-y-3 p-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Share via QR</span>
              </div>
              <div className="inline-block rounded-lg bg-white p-3">
                <QRCode value={pageUrl} size={148} />
              </div>
              <p className="text-xs text-muted-foreground">Scan to open on any device</p>
            </Card>

            <Card className="space-y-2.5 p-5">
              <FieldLabel>Details</FieldLabel>
              <Row label="Request ID" value={displayRequestId.slice(0, 8) + '…'} mono />
              <Row label="Status" value={s.label} />
              {video.generation_seconds ? (
                <Row
                  label="Generated in"
                  value={`${Math.round(video.generation_seconds)} s by Gemini Omni`}
                />
              ) : null}
              <Row label="Created" value={formatDate(video.created_at)} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={
          mono ? 'truncate font-mono text-xs text-foreground/80' : 'truncate text-foreground/90'
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}
