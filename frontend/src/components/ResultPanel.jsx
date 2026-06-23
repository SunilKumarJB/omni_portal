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
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getStatus } from '../lib/api.js';
import { FieldLabel } from './StepHeading.jsx';

const LANG_NAMES = {
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

export default function ResultPanel({
  requestData: initial,
  selectedTemplate,
  dialogueText,
  selectedLanguage,
  onReset,
}) {
  const [data, setData] = useState(initial);
  const [copied, setCopied] = useState(false);

  const isDone = data.status === 'completed' || data.status === 'failed';
  const isCompleted = data.status === 'completed';
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
    <div className="min-h-screen bg-background">
      <AppHeader
        actions={
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Create another
          </Button>
        }
      />

      <div className="relative overflow-hidden">
        {/* Success brand moment — confined four-color wash, bottom-right only */}
        {isCompleted && <div className="ai-gradient-corner ai-gradient-corner--br" aria-hidden />}

        <div className="relative mx-auto max-w-5xl px-6 py-8">
          <StatusBanner status={data.status} progress={data.progress} requestId={data.request_id} />

          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {/* Left: Video + details */}
            <div className="space-y-4 lg:col-span-2">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/40">
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
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
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

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
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
              </div>

              {/* Scenario card */}
              {selectedTemplate && selectedTemplate.id !== 'custom' && (
                <Card className="overflow-hidden">
                  <div className="h-0.5 w-full" style={{ background: selectedTemplate.accent }} />
                  <div className="space-y-2 p-4">
                    <FieldLabel>Scenario</FieldLabel>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{selectedTemplate.emoji}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {selectedTemplate.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin
                        className="h-3 w-3 flex-shrink-0"
                        style={{ color: selectedTemplate.accent }}
                      />
                      {selectedTemplate.location}
                    </div>
                  </div>
                </Card>
              )}

              {/* Dialogue card */}
              {dialogueText?.trim() && (
                <Card className="overflow-hidden">
                  <div className="ai-gradient-line h-0.5 w-full" />
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <FieldLabel>Dialogue</FieldLabel>
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
                        {LANG_NAMES[selectedLanguage] ?? selectedLanguage}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <p
                        className="text-sm italic leading-relaxed text-foreground/80"
                        lang={selectedLanguage}
                      >
                        {dialogueText}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Prompt card */}
              <Card className="p-5">
                <FieldLabel>Prompt</FieldLabel>
                <p className="text-sm leading-relaxed text-muted-foreground">{data.prompt}</p>
              </Card>
            </div>

            {/* Right: QR + details */}
            <div className="space-y-4">
              <Card className="space-y-4 p-5 text-center">
                <div>
                  <p className="mb-1 text-sm font-semibold text-foreground">
                    Scan to view &amp; download
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDone
                      ? 'Video is ready on any device'
                      : 'QR ready — video generates in background'}
                  </p>
                </div>

                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="QR code"
                    className="mx-auto h-44 w-44 rounded-lg border border-border"
                  />
                ) : (
                  <div className="inline-block rounded-lg bg-white p-3">
                    <QRCode value={videoPageUrl} size={160} />
                  </div>
                )}

                <div className="flex gap-2 text-left">
                  <Input
                    value={videoPageUrl}
                    readOnly
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Shareable video link"
                    className="h-9 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    aria-label="Copy link"
                    className={cn(
                      'h-9 w-9 flex-shrink-0',
                      copied && 'border-success/40 text-success',
                    )}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>

              {/* Request details */}
              <Card className="space-y-2.5 p-5">
                <FieldLabel>Details</FieldLabel>
                <Row label="Request ID" value={data.request_id?.slice(0, 12) + '…'} mono />
                <Row label="Status" value={data.status} status={data.status} />
                <Row label="Progress" value={`${data.progress ?? 0}%`} />
                <Row label="Created" value={formatDate(data.created_at)} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_TONES = {
  pending: 'warning',
  processing: 'foreground',
  completed: 'success',
  failed: 'destructive',
};

function StatusBanner({ status, progress, requestId }) {
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

function Row({ label, value, mono, status }) {
  const statusTone = {
    completed: 'text-success',
    failed: 'text-destructive',
    processing: 'text-foreground',
    pending: 'text-warning',
  }[status];

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

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}
