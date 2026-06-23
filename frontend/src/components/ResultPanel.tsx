import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Quote,
  RotateCcw,
  Share2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { formatPromptForDisplay } from '@/lib/prompt';
import type { GenerationStatus, LanguageCode, VideoRequestData, VideoTemplate } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getStatus } from '../lib/api';
import { FieldLabel } from './StepHeading';

const LANG_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
};

interface ResultPanelProps {
  requestData: VideoRequestData;
  selectedTemplate: VideoTemplate | null;
  dialogueText: string;
  selectedLanguage: LanguageCode;
  onReset: () => void;
}

export default function ResultPanel({
  requestData: initial,
  selectedTemplate,
  dialogueText,
  selectedLanguage,
  onReset,
}: ResultPanelProps) {
  const [data, setData] = useState<VideoRequestData>(initial);
  const [copied, setCopied] = useState(false);

  const isDone = data.status === 'completed' || data.status === 'failed';
  const videoUrl = data.video_url;
  const qrUrl = data.qr_code_url;
  const videoPageUrl = data.video_page_url || `${window.location.origin}/video/${data.request_id}`;

  useEffect(() => {
    if (isDone) return;
    const t = setInterval(async () => {
      try {
        const updated = await getStatus(data.request_id);
        setData(updated);
        if (updated.status === 'completed' || updated.status === 'failed') clearInterval(t);
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [data.request_id, isDone]);

  function copyLink() {
    navigator.clipboard.writeText(videoPageUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1360px] flex-col gap-3">
      <StatusBanner status={data.status} progress={data.progress} requestId={data.request_id} />

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-7">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-black">
            {videoUrl ? (
              <>
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="h-full w-full object-contain"
                />
                {!isDone && (
                  <div className="absolute inset-x-3 bottom-3">
                    <div className="rounded-md border border-border bg-background/90 px-3 py-2.5 backdrop-blur-sm">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="inline h-3 w-3 animate-spin" />
                          Generating your video with Omni…
                        </span>
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {data.progress ?? 0}%
                        </span>
                      </div>
                      <Progress value={data.progress ?? 5} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="orb-container scale-75">
                  <div className="orb-blob orb-blob-blue" />
                  <div className="orb-blob orb-blob-red" />
                  <div className="orb-blob orb-blob-yellow" />
                  <div className="orb-blob orb-blob-green" />
                  <div className="orb-core" />
                  <div className="absolute z-10 flex h-14 w-14 flex-col items-center justify-center rounded-full border border-white/10 bg-black/45 shadow-lg backdrop-blur-md">
                    <span className="mb-0.5 text-[7px] font-extrabold uppercase leading-none tracking-[0.22em] text-white/50">
                      omni
                    </span>
                    <span className="text-xs font-bold leading-none tracking-tight text-white/90 tabular-nums">
                      {data.progress ?? 0}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Omni is generating your video
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.progress ?? 0}% · Takes 3–8 minutes
                  </p>
                </div>
                {(data.progress ?? 0) > 0 && (
                  <div className="w-48">
                    <Progress value={data.progress} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {videoUrl && isDone && (
              <Button asChild>
                <a href={videoUrl} download>
                  <Download className="h-4 w-4" /> Download video
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigator.share?.({ url: videoPageUrl, title: 'My Omni Video' })}
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/video/${data.request_id}`}>
                <ExternalLink className="h-4 w-4" /> Full page
              </Link>
            </Button>
            <Button variant="secondary" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Start over
            </Button>
          </div>

          <GenerationInputs
            selectedTemplate={selectedTemplate}
            dialogueText={dialogueText}
            selectedLanguage={selectedLanguage}
          />
        </div>

        <DeliveryPanel
          data={data}
          isDone={isDone}
          qrUrl={qrUrl}
          videoPageUrl={videoPageUrl}
          copied={copied}
          onCopy={copyLink}
        />
      </div>
    </div>
  );
}

interface GenerationInputsProps {
  selectedTemplate: VideoTemplate | null;
  dialogueText: string;
  selectedLanguage: LanguageCode;
}

function GenerationInputs({
  selectedTemplate,
  dialogueText,
  selectedLanguage,
}: GenerationInputsProps) {
  return (
    <Card className="shrink-0 overflow-hidden">
      <div className="ai-gradient-line h-0.5 w-full" />
      <div className="grid min-h-[84px] gap-0 sm:grid-cols-2">
        <div className="min-w-0 border-border/70 p-3 sm:border-r">
          <FieldLabel>Generation inputs</FieldLabel>
          {selectedTemplate ? (
            <div className="flex min-w-0 items-start gap-2.5">
              <span className="text-xl leading-none">{selectedTemplate.emoji}</span>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-bold text-foreground">
                  {selectedTemplate.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" style={{ color: selectedTemplate.accent }} />
                  <span className="truncate">{selectedTemplate.location}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">Custom generation</p>
          )}
        </div>

        <div className="min-w-0 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <FieldLabel className="mb-0">Spoken line</FieldLabel>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {LANG_NAMES[selectedLanguage] ?? selectedLanguage}
            </span>
          </div>
          {dialogueText?.trim() ? (
            <div className="flex gap-2">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p
                className="line-clamp-2 text-sm font-medium italic leading-relaxed text-foreground/80"
                lang={selectedLanguage}
              >
                {dialogueText}
              </p>
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">No dialogue selected</p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface DeliveryPanelProps {
  data: VideoRequestData;
  isDone: boolean;
  qrUrl?: string | null;
  videoPageUrl: string;
  copied: boolean;
  onCopy: () => void;
}

function DeliveryPanel({ data, isDone, qrUrl, videoPageUrl, copied, onCopy }: DeliveryPanelProps) {
  return (
    <Card className="grid min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-4 p-5 lg:col-span-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <FieldLabel>Delivery</FieldLabel>
          <h3 className="text-lg font-bold leading-tight text-foreground">
            {isDone ? 'Ready to share' : 'Preparing delivery'}
          </h3>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {isDone ? 'Open the video on any device.' : 'The share link will unlock when ready.'}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold capitalize',
            data.status === 'completed'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-border bg-muted/30 text-muted-foreground',
          )}
        >
          {data.status}
        </span>
      </div>

      <div className="grid min-h-0 grid-cols-[148px_minmax(0,1fr)] gap-4 rounded-xl border border-border bg-background/35 p-4">
        {isDone ? (
          qrUrl ? (
            <img
              src={qrUrl}
              alt="QR code"
              className="h-36 w-36 rounded-lg border border-border bg-white"
            />
          ) : (
            <div className="flex h-36 w-36 items-center justify-center rounded-lg bg-white p-2.5">
              <QRCode value={videoPageUrl} size={124} />
            </div>
          )
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-lg border border-border bg-muted/20">
            <div className="orb-container scale-50">
              <div className="orb-blob orb-blob-blue" />
              <div className="orb-blob orb-blob-red" />
              <div className="orb-blob orb-blob-yellow" />
              <div className="orb-blob orb-blob-green" />
              <div className="orb-core" />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-col justify-center gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">
              {isDone ? 'Scan to view & download' : 'Omni is compiling'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {isDone
                ? 'The QR code points to the full-screen video page.'
                : 'Generation progress updates automatically.'}
            </p>
          </div>

          {data.status === 'completed' && (
            <div className="flex gap-2">
              <Input
                value={videoPageUrl}
                readOnly
                autoComplete="off"
                spellCheck={false}
                aria-label="Shareable video link"
                className="h-9 min-w-0 flex-1 text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={onCopy}
                aria-label="Copy link"
                className={cn('h-9 w-9 shrink-0', copied && 'border-success/40 text-success')}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 rounded-xl border border-border/70 bg-muted/10 p-4">
        <div className="col-span-2">
          <FieldLabel>Render details</FieldLabel>
        </div>
        <Row label="Request" value={data.request_id?.slice(0, 12) + '…'} mono />
        <Row label="Status" value={data.status} status={data.status} />
        <Row label="Progress" value={`${data.progress ?? 0}%`} />
        <Row label="Created" value={formatDate(data.created_at)} />
      </div>

      <div className="flex min-h-0 flex-col rounded-xl border border-border/70 bg-muted/10 p-4">
        <FieldLabel>Prompt summary</FieldLabel>
        <p className="min-h-0 flex-1 overflow-hidden text-sm leading-relaxed text-muted-foreground">
          {formatPromptForDisplay(data.prompt) || 'Prompt unavailable for this render.'}
        </p>
      </div>
    </Card>
  );
}

const STATUS_TONES: Record<GenerationStatus, 'warning' | 'foreground' | 'success' | 'destructive'> =
  {
    pending: 'warning',
    processing: 'foreground',
    completed: 'success',
    failed: 'destructive',
  };

interface StatusBannerProps {
  status: GenerationStatus;
  progress?: number;
  requestId: string;
}

function StatusBanner({ status, progress, requestId }: StatusBannerProps) {
  const tone = STATUS_TONES[status] ?? 'foreground';
  const msg =
    {
      pending: 'Request queued',
      processing: 'Generating video with Omni…',
      completed: 'Your video is ready',
      failed: 'Generation failed',
    }[status] ?? status;

  const toneClasses = {
    warning: 'border-warning/20 bg-warning/[0.06] text-warning',
    foreground: 'border-border bg-muted/40 text-foreground',
    success: 'border-success/20 bg-success/[0.06] text-success',
    destructive: 'border-destructive/20 bg-destructive/[0.06] text-destructive',
  }[tone];

  return (
    <div
      aria-live="polite"
      className={cn('flex items-center gap-3 rounded-lg border px-5 py-3.5', toneClasses)}
    >
      {status === 'processing' && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />}
      {status === 'completed' && <Check className="h-4 w-4 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-sm font-semibold">{msg}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{requestId}</p>
      </div>
      {status === 'processing' && (
        <span className="text-sm font-semibold tabular-nums">{progress ?? 0}%</span>
      )}
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
  status?: GenerationStatus;
}

function Row({ label, value, mono = false, status }: RowProps) {
  const statusTone = status
    ? {
        completed: 'text-success',
        failed: 'text-destructive',
        processing: 'text-foreground',
        pending: 'text-warning',
      }[status]
    : undefined;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          mono ? 'font-mono text-xs text-foreground/80' : 'text-foreground/90',
          statusTone,
        )}
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
