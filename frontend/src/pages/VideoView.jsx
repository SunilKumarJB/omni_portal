import { ArrowLeft, Check, Download, Loader2, QrCode, Share2, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link, useParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { FieldLabel } from '@/components/StepHeading.jsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getVideo } from '../lib/api.js';

const STATUS_CFG = {
  pending: { label: 'Queued', variant: 'warning' },
  processing: { label: 'Generating', variant: 'secondary' },
  completed: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function VideoView() {
  const { requestId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [requestId]);

  useEffect(() => {
    if (video?.status !== 'processing' && video?.status !== 'pending') return;
    const t = setInterval(async () => {
      try {
        const d = await getVideo(requestId);
        setVideo(d);
        if (d.status === 'completed' || d.status === 'failed') clearInterval(t);
      } catch {}
    }, 6000);
    return () => clearInterval(t);
  }, [video?.status, requestId]);

  async function load() {
    try {
      setVideo(await getVideo(requestId));
    } catch {
      setError('Video not found');
    } finally {
      setLoading(false);
    }
  }

  const pageUrl = window.location.href;
  const s = video ? (STATUS_CFG[video.status] ?? STATUS_CFG.pending) : null;

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
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">Video not found</h2>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
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
      {/* Brand moment — confined four-color wash in the bottom-right corner */}
      <div className="ai-gradient-corner ai-gradient-corner--br" aria-hidden />

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
                <video
                  src={video.video_url}
                  controls
                  autoPlay
                  loop
                  className="h-full w-full object-contain"
                  poster={video.product_image_url}
                />
              ) : video.status === 'processing' || video.status === 'pending' ? (
                <div className="space-y-3 text-center">
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Omni is generating your video…</p>
                  {video.progress > 0 && (
                    <div className="mx-auto w-40">
                      <Progress value={video.progress} />
                      <p className="mt-1.5 text-center text-xs text-muted-foreground">
                        {video.progress}%
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
                  <a href={video.video_url} download>
                    <Download className="h-4 w-4" /> Download
                  </a>
                </Button>
                <Button variant="outline" onClick={() => navigator.share?.({ url: pageUrl })}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            )}

            {video.prompt && (
              <Card className="p-5">
                <FieldLabel>Prompt</FieldLabel>
                <p className="text-sm leading-relaxed text-muted-foreground">{video.prompt}</p>
                {(video.style_id || video.theme_id) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {video.style_id && <Badge variant="outline">{video.style_id}</Badge>}
                    {video.theme_id && <Badge variant="outline">{video.theme_id}</Badge>}
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
              <Row label="Request ID" value={requestId.slice(0, 8) + '…'} mono />
              <Row label="Status" value={s.label} />
              <Row label="Created" value={formatDate(video.created_at)} />
            </Card>

            {video.product_image_url && (
              <Card className="p-5">
                <FieldLabel>Product</FieldLabel>
                <img
                  src={video.product_image_url}
                  alt="Product"
                  className="aspect-square w-full rounded-md border border-border bg-muted/40 object-contain"
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs text-foreground/80' : 'text-foreground/90'}>
        {value}
      </span>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}
