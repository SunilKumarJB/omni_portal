import { Check, Copy, Download, ExternalLink, Images, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LANGUAGES } from '@/data/languages';
import { subscribeToStatus } from '@/lib/api';
import { formatPromptForDisplay } from '@/lib/prompt';
import type { LanguageCode, VideoRequestData, VideoTemplate } from '@/lib/types';
import GenerationOrb, { STAGE_LABELS } from './GenerationOrb';
import VideoPlayer from './VideoPlayer';

interface Props {
  requestData: VideoRequestData;
  selectedTemplate: VideoTemplate | null;
  dialogueText: string;
  selectedLanguage: LanguageCode;
  onReset: () => void;
  onRetry: () => void | Promise<void>;
  onEdit: () => void;
}

export default function ResultPanel({
  requestData: initial,
  selectedTemplate,
  dialogueText,
  selectedLanguage,
  onReset,
  onRetry,
  onEdit,
}: Props) {
  const [live, setLive] = useState<VideoRequestData | null>(null);
  const data = live?.request_id === initial.request_id ? live : initial;
  const [connectionLost, setConnectionLost] = useState(false);
  const [subscriptionKey, setSubscriptionKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const done = data.status === 'completed';
  const failed = data.status === 'failed';
  const active = !done && !failed;
  const sample = !!data.is_sample;
  const pageUrl = `${window.location.origin}/video/${data.request_id}`;
  const canOpen = !!data.request_id && !sample;
  const localOnly = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  useEffect(() => {
    if (!active || !data.request_id) return;
    return subscribeToStatus(
      data.request_id,
      (value) => {
        setLive(value);
        setConnectionLost(false);
      },
      () => setConnectionLost(true),
    );
  }, [active, data.request_id, subscriptionKey]);
  useEffect(() => {
    if (!active) return;
    const started = Date.parse(data.created_at ?? '') || Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active, data.created_at]);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success('Progress link copied');
    } catch {
      toast.error('Select the link and copy it manually.');
    }
  }
  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
            {sample ? 'Test mode · Style sample' : 'Your video'}
          </p>
          <h2
            tabIndex={-1}
            className="font-display text-2xl font-semibold tracking-tight outline-none"
            aria-live="polite"
          >
            {sample
              ? 'Sample video'
              : done
                ? 'Ready to watch'
                : failed
                  ? 'Video could not be created'
                  : STAGE_LABELS[data.stage ?? 'queued']}
          </h2>
        </div>
        {done && !sample && data.generation_seconds && (
          <p className="text-sm text-muted-foreground">
            Created in {Math.round(data.generation_seconds)} seconds
          </p>
        )}
      </div>
      {connectionLost && active && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/50 p-4 text-sm"
        >
          <span>
            Connection interrupted. Your video may still be running. We are checking again.
          </span>
          <Button size="sm" variant="outline" onClick={() => setSubscriptionKey((k) => k + 1)}>
            Check status again
          </Button>
        </div>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            {active ? (
              <GenerationOrb stage={data.stage} elapsed={elapsed} />
            ) : failed ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-lg text-white">We could not finish this video.</p>
                <p className="max-w-md break-words text-sm text-white/70">
                  {data.error || 'Try again, or edit your choices.'}
                </p>
                <Button onClick={onRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            ) : data.video_url ? (
              <div className="aspect-video">
                <VideoPlayer src={data.video_url} />
              </div>
            ) : (
              <p className="p-10 text-center text-white">
                No sample video is available for this scene. Choose a preset scene to see a sample.
              </p>
            )}
          </div>
          {sample && (
            <p className="rounded-xl bg-muted p-4 text-sm">
              This is a style example. It does not use your presenter, product, or dialogue. It is
              not saved to Gallery.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {done && data.video_url && !sample && (
              <Button asChild>
                <a href={data.video_url} download>
                  <Download className="h-4 w-4" />
                  Download video
                </a>
              </Button>
            )}
            {canOpen && (
              <Button variant="outline" asChild>
                <Link to={`/video/${data.request_id}`}>
                  <ExternalLink className="h-4 w-4" />
                  {active ? 'Open progress page' : 'Open video page'}
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/gallery">
                <Images className="h-4 w-4" />
                Gallery
              </Link>
            </Button>
            {!active && (
              <Button variant="outline" onClick={onEdit}>
                Edit and generate again
              </Button>
            )}
            {!active && (
              <Button variant="ghost" onClick={onReset}>
                New video
              </Button>
            )}
          </div>
          <Card className="space-y-3 p-5">
            <p className="font-semibold">{selectedTemplate?.title ?? 'Custom scene'}</p>
            <p className="text-xs text-muted-foreground">
              {LANGUAGES.find((l) => l.code === selectedLanguage)?.name}
            </p>
            <p
              lang={selectedLanguage}
              className="whitespace-pre-wrap break-words text-sm leading-relaxed"
            >
              {dialogueText.trim() || 'No spoken dialogue'}
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          {canOpen && (
            <Card className="space-y-4 p-5">
              <h3 className="font-semibold">
                {active
                  ? 'Come back when it is ready'
                  : failed
                    ? 'Saved request'
                    : 'Share your video'}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {failed
                  ? 'The request is saved, but no video is available. You can edit your choices and try again.'
                  : 'This link opens the latest status of your video. You can leave this page and return later.'}
              </p>
              {!localOnly && !failed && (
                <div className="inline-block rounded-xl bg-white p-3">
                  <QRCode value={pageUrl} size={128} />
                </div>
              )}
              {localOnly && (
                <p className="rounded-lg bg-muted p-3 text-sm">
                  Local preview: this link works on this computer. Phone sharing needs a publicly
                  reachable app address.
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  aria-label="Video progress link"
                  value={pageUrl}
                  readOnly
                  className="min-w-0"
                />
                <Button
                  aria-label="Copy progress link"
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </Card>
          )}
          {active && !canOpen && (
            <Card className="p-5 text-sm text-muted-foreground">
              Saving your request. A progress link will appear here shortly.
            </Card>
          )}
          <details className="rounded-xl border border-border bg-card p-5">
            <summary className="cursor-pointer text-sm font-semibold">Scene instructions</summary>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
              {formatPromptForDisplay(data.final_prompt || data.prompt)}
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
