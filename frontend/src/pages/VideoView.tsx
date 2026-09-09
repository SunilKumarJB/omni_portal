import axios from 'axios';
import { ArrowLeft, Check, Download, Images, Loader2, QrCode, Share2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import GenerationOrb from '@/components/GenerationOrb';
import { FieldLabel } from '@/components/StepHeading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import VideoPlayer from '@/components/VideoPlayer';
import { formatPromptForDisplay } from '@/lib/prompt';
import { getVideo, subscribeToStatus } from '../lib/api';
import type { GenerationStatus, VideoRequestData } from '../lib/types';

const STATUS_CFG: Record<
  GenerationStatus,
  { label: string; variant: 'warning' | 'secondary' | 'success' | 'destructive' }
> = {
  pending: { label: 'Queued', variant: 'warning' },
  processing: { label: 'Generating', variant: 'secondary' },
  completed: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

const LOAD_ATTEMPTS = 3;
const LOAD_RETRY_MS = 1000;

export default function VideoView() {
  const { requestId } = useParams();
  const [video, setVideo] = useState<VideoRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [disconnected, setDisconnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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
    setVideo(null);
    void load();
    return () => {
      cancelled = true;
    };
  }, [requestId, reloadKey]);

  const loaded = video !== null;
  const isTerminal = video?.status === 'completed' || video?.status === 'failed';

  // One subscription per request while it is still running: `loaded` and `isTerminal`
  // each flip once, so the stream is opened once and torn down when it finishes.
  useEffect(() => {
    if (!requestId || !loaded || isTerminal) return;
    const unsubscribe = subscribeToStatus(
      requestId,
      (updated) => {
        setVideo(updated);
        setDisconnected(false);
      },
      () => setDisconnected(true),
    );
    return () => unsubscribe();
  }, [requestId, loaded, isTerminal]);

  useEffect(() => {
    if (!loaded || isTerminal) return;
    const started = Date.parse(video?.created_at ?? '') || Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [loaded, isTerminal, video?.created_at]);
  const localOnly = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
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
          <Button className="mr-2" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
          <Button variant="outline" asChild>
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
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/gallery">
                <Images className="h-3.5 w-3.5" /> Gallery
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-3.5 w-3.5" /> My draft
              </Link>
            </Button>
          </>
        }
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {video.is_sample ? 'Sample video · Test mode' : 'Generated video'}
          </h1>
          <Badge variant={s.variant}>
            {video.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
            {video.status === 'completed' && <Check className="h-3 w-3" />}
            {s.label}
          </Badge>
        </div>

        {disconnected && (
          <p role="status" className="mb-4 rounded-lg border border-border p-4 text-sm">
            Connection interrupted. We are checking your video again.{' '}
            <button className="underline" onClick={() => setReloadKey((k) => k + 1)}>
              Check now
            </button>
          </p>
        )}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Video */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
              {video.status === 'completed' && video.video_url ? (
                <div className="aspect-video w-full">
                  <VideoPlayer src={video.video_url} />
                </div>
              ) : video.status === 'processing' || video.status === 'pending' ? (
                <div className="w-full">
                  <GenerationOrb stage={video.stage} elapsed={elapsed} compact />
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
                  <a href={video.video_url} download>
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
                <span className="text-sm font-medium text-foreground">
                  {localOnly ? 'Local video page' : 'Video link'}
                </span>
              </div>
              {!localOnly && video.status !== 'failed' && (
                <div className="inline-block rounded-lg bg-white p-3">
                  <QRCode value={pageUrl} size={148} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {localOnly
                  ? 'This link works on this computer. Phone sharing needs a publicly reachable app address.'
                  : video.status === 'failed'
                    ? 'The request is saved, but no video is available.'
                    : 'Scan to open this video or check its progress.'}
              </p>
            </Card>

            <Card className="space-y-2.5 p-5">
              <FieldLabel>Details</FieldLabel>
              <Row label="Request ID" value={displayRequestId.slice(0, 8) + '…'} mono />
              <Row label="Status" value={s.label} />
              {video.generation_seconds && !video.is_sample ? (
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
