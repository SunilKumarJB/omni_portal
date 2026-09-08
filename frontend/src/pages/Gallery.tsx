import { ArrowLeft, Eye, EyeOff, ImageOff, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PRESET_CHARS } from '@/data/characters';
import { LANGUAGES } from '@/data/languages';
import { PRODUCT_CATALOG } from '@/data/products';
import { VIDEO_TEMPLATES } from '@/data/scenarios';
import { getStatus, listVideos, setVideoHidden } from '@/lib/api';
import type { GenerationStatus, VideoRequestData } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_CFG: Record<
  GenerationStatus,
  { label: string; variant: 'warning' | 'secondary' | 'success' | 'destructive' }
> = {
  pending: { label: 'Queued', variant: 'warning' },
  processing: { label: 'Generating', variant: 'secondary' },
  completed: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
};

const LIST_LIMIT = 24;

function scenarioTitle(styleId?: string) {
  return VIDEO_TEMPLATES.find((t) => t.id === styleId)?.title ?? 'Custom scenario';
}

function productName(productId?: string) {
  return PRODUCT_CATALOG.find((p) => p.id === productId)?.name;
}

function presenterName(item: VideoRequestData) {
  const preset = PRESET_CHARS.find((c) => c.id === item.character_preset_id);
  if (preset) return preset.name;
  return item.character_image_url ? 'Custom photo' : undefined;
}

function languageName(code?: string) {
  if (!code) return undefined;
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function Gallery() {
  // The toggles live in the URL so a reload (or a link handed to someone mid-demo)
  // reopens the same view.
  const [searchParams, setSearchParams] = useSearchParams();
  const showHidden = searchParams.get('hidden') === '1';
  const showFailed = searchParams.get('failed') === '1';

  const [items, setItems] = useState<VideoRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const [refreshError, setRefreshError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const generation = useRef(0);
  const visibilityRevision = useRef(0);
  const visibilityChanges = useRef(new Map<string, { revision: number; hidden: boolean }>());
  const pendingRef = useRef(pendingIds);
  pendingRef.current = pendingIds;

  function preserveVisibility(item: VideoRequestData, readRevision: number) {
    const change = visibilityChanges.current.get(item.request_id);
    return change && (change.revision > readRevision || pendingRef.current.has(item.request_id))
      ? { ...item, hidden: change.hidden }
      : item;
  }

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const current = ++generation.current;
    const readRevision = visibilityRevision.current;
    setLoading(true);
    setLoadingMore(false);
    setRefreshError(false);
    setNextCursor(null);
    void listVideos({ includeHidden: showHidden, includeFailed: showFailed, limit: LIST_LIMIT })
      .then((data) => {
        if (generation.current !== current) return;
        setItems(data.items.map((item) => preserveVisibility(item, readRevision)));
        setNextCursor(data.next_cursor ?? null);
        setError(null);
      })
      .catch(() => {
        if (generation.current === current) setError('Could not load previous videos.');
      })
      .finally(() => {
        if (generation.current === current) setLoading(false);
      });
    return () => {
      generation.current++;
    };
  }, [showHidden, showFailed, reloadKey]);

  // Read only active jobs, without re-fetching completed history. Hidden tabs do no polling.
  useEffect(() => {
    if (!pageVisible || loading) return;
    const active = items.filter(
      (item) =>
        (showHidden || !item.hidden) && (item.status === 'pending' || item.status === 'processing'),
    );
    if (!active.length) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const readRevision = visibilityRevision.current;
      const results = await Promise.allSettled(active.map((item) => getStatus(item.request_id)));
      if (cancelled) return;
      const updates = new Map<string, VideoRequestData>();
      for (const result of results) {
        if (result.status === 'fulfilled')
          updates.set(result.value.request_id, preserveVisibility(result.value, readRevision));
      }
      setRefreshError(results.some((result) => result.status === 'rejected'));
      setItems((previous) =>
        previous.map((item) => {
          const update = updates.get(item.request_id);
          return update && !pendingRef.current.has(item.request_id) ? { ...item, ...update } : item;
        }),
      );
    }, 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [items, pageVisible, loading, showHidden]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    const current = generation.current;
    const readRevision = visibilityRevision.current;
    setLoadingMore(true);
    try {
      const data = await listVideos({
        includeHidden: showHidden,
        includeFailed: showFailed,
        limit: LIST_LIMIT,
        cursor: nextCursor,
      });
      if (generation.current !== current) return;
      setItems((previous) => {
        const known = new Set(previous.map((item) => item.request_id));
        return [
          ...previous,
          ...data.items
            .filter((item) => !known.has(item.request_id))
            .map((item) => preserveVisibility(item, readRevision)),
        ];
      });
      setNextCursor(data.next_cursor ?? null);
    } catch {
      if (generation.current === current) toast.error('Could not load more videos. Try again.');
    } finally {
      if (generation.current === current) setLoadingMore(false);
    }
  }

  function setToggle(key: 'hidden' | 'failed', value: boolean) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, '1');
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  async function toggleHidden(item: VideoRequestData) {
    const requestId = item.request_id;
    const nextHidden = !item.hidden;
    const patch = (hidden: boolean) => {
      visibilityChanges.current.set(requestId, { revision: ++visibilityRevision.current, hidden });
      setItems((prev) => prev.map((i) => (i.request_id === requestId ? { ...i, hidden } : i)));
    };

    patch(nextHidden);
    setPendingIds((prev) => new Set(prev).add(requestId));
    try {
      await setVideoHidden(requestId, nextHidden);
      patch(nextHidden);
    } catch {
      patch(!nextHidden);
      toast.error(nextHidden ? 'Could not hide that video.' : 'Could not unhide that video.');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  }

  // Hiding is optimistic, so the local flag — not the server query — decides what stays.
  const visible = items.filter(
    (item) => (showHidden || !item.hidden) && (showFailed || item.status !== 'failed'),
  );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="ai-gradient-top" aria-hidden />

      <AppHeader
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" /> My draft
            </Link>
          </Button>
        }
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Gallery</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent videos, newest first. Active videos update automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div className="flex select-none items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Show hidden</span>
              <Switch
                checked={showHidden}
                onCheckedChange={(v) => setToggle('hidden', v)}
                aria-label="Show hidden"
              />
            </div>
            <div className="flex select-none items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Show failed</span>
              <Switch
                checked={showFailed}
                onCheckedChange={(v) => setToggle('failed', v)}
                aria-label="Show failed"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
            </Button>
          </div>
        </div>

        {refreshError && (
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            Updates paused by a connection problem. We are trying again.
          </p>
        )}
        {!loading && !error && items.length > 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            Showing{' '}
            {
              items.filter(
                (item) => (showHidden || !item.hidden) && (showFailed || item.status !== 'failed'),
              ).length
            }{' '}
            videos{nextCursor ? ' · More available' : ''}.
          </p>
        )}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading previous generations…</p>
            </div>
          </div>
        ) : error ? (
          <Card className="mx-auto max-w-md space-y-3 p-6 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">
              The backend did not respond. Check your connection and try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="mx-auto max-w-md space-y-3 p-8 text-center">
            <ImageOff className="mx-auto h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-foreground">Nothing here yet</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {showHidden || showFailed
                ? 'No generations match these filters.'
                : 'Generated videos will appear here. Hidden and failed runs are filtered out.'}
            </p>
            <Button size="sm" asChild>
              <Link to="/">Create a video</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <GalleryCard
                key={item.request_id}
                item={item}
                busy={pendingIds.has(item.request_id)}
                onToggleHidden={() => void toggleHidden(item)}
              />
            ))}
          </div>
        )}
        {!loading && !error && nextCursor && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface GalleryCardProps {
  item: VideoRequestData;
  busy: boolean;
  onToggleHidden: () => void;
}

function GalleryCard({ item, busy, onToggleHidden }: GalleryCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const status = STATUS_CFG[item.status];
  const inProgress = item.status === 'pending' || item.status === 'processing';
  const product = productName(item.product_id);
  const presenter = presenterName(item);
  const language = languageName(item.language);
  const hasVideo = !!item.video_url && !videoFailed;

  function play() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => {
      // Hover-play can be rejected by the browser; the first frame stays visible.
    });
  }

  function pause() {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  return (
    <Card
      onMouseEnter={play}
      onMouseLeave={pause}
      onFocus={play}
      onBlur={pause}
      className={cn(
        'flex min-w-0 flex-col overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background hover:border-foreground/30',
        item.hidden && 'opacity-70',
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={item.video_url ?? undefined}
            muted
            playsInline
            loop
            preload="none"
            poster={item.thumbnail_url || item.character_image_url || undefined}
            className="h-full w-full object-cover"
            onError={() => setVideoFailed(true)}
          />
        ) : item.character_image_url ? (
          <img
            src={item.character_image_url}
            loading="lazy"
            decoding="async"
            alt=""
            className="h-full w-full object-cover opacity-60"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {inProgress ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <ImageOff className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            )}
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          <Badge variant={status.variant} className="bg-background/85 backdrop-blur-sm">
            {inProgress && <Loader2 className="h-3 w-3 animate-spin" />}
            {inProgress ? 'Generating' : status.label}
            {item.is_sample && ' · Sample'}
          </Badge>
          {item.hidden && (
            <Badge variant="outline" className="bg-background/85 backdrop-blur-sm">
              Hidden
            </Badge>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-bold text-foreground">
            {scenarioTitle(item.style_id)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
        </div>

        {(product || presenter || language) && (
          <div className="flex flex-wrap gap-1.5">
            {product && <Badge variant="outline">{product}</Badge>}
            {presenter && <Badge variant="outline">{presenter}</Badge>}
            {language && <Badge variant="outline">{language}</Badge>}
          </div>
        )}

        {item.status === 'failed' && item.error && (
          <p className="line-clamp-2 text-xs leading-relaxed text-destructive">{item.error}</p>
        )}

        {item.dialogue?.trim() && (
          <p
            className="line-clamp-1 text-xs font-medium italic text-muted-foreground"
            lang={item.language}
          >
            “{item.dialogue}”
          </p>
        )}

        {item.generation_seconds && !item.is_sample ? (
          <p className="text-xs tabular-nums text-muted-foreground">
            Generated in {Math.round(item.generation_seconds)} s
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/video/${item.request_id}`}>Open</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleHidden} disabled={busy}>
            {item.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {item.hidden ? 'Show in gallery' : 'Hide from gallery'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
