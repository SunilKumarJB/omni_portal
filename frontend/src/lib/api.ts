import axios from 'axios';
import type { GenerateVideoInput, VideoListResponse, VideoRequestData } from './types';

/** Single source of truth for the backend prefix — axios and the SSE URL must not drift. */
const API_BASE = '/api';

/** Optional shared secret; only sent on the writing calls, never on reads. */
const DEMO_API_KEY = import.meta.env.VITE_DEMO_API_KEY;

/** No SSE message for this long while non-terminal means the stream is stalled. */
const STALL_TIMEOUT_MS = 10000;
/** Re-check cadence once a stall has been detected. */
const STALL_RECHECK_MS = 5000;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export async function generateVideo({
  prompt,
  styleId,
  dialogue,
  language,
  characterPresetId,
  characterImage,
  productId,
  durationSeconds,
  aspectRatio,
}: GenerateVideoInput): Promise<VideoRequestData> {
  const form = new FormData();
  form.append('prompt', prompt);
  if (durationSeconds) form.append('duration_seconds', String(durationSeconds));
  if (aspectRatio) form.append('aspect_ratio', aspectRatio);
  if (styleId) form.append('style_id', styleId);
  if (dialogue) form.append('dialogue', dialogue);
  if (language) form.append('language', language);
  if (characterPresetId) form.append('character_preset_id', characterPresetId);
  if (characterImage) form.append('character_image', characterImage);
  if (productId) form.append('product_id', productId);

  const { data } = await api.post('/generate/video', form, {
    timeout: 60000,
    headers: DEMO_API_KEY ? { 'X-Demo-Key': DEMO_API_KEY } : undefined,
  });
  return data;
}

export interface ListVideosOptions {
  includeHidden?: boolean;
  includeFailed?: boolean;
  limit?: number;
}

export async function listVideos({
  includeHidden = false,
  includeFailed = false,
  limit = 50,
}: ListVideosOptions = {}): Promise<VideoRequestData[]> {
  const { data } = await api.get<VideoListResponse>('/videos', {
    params: {
      include_hidden: includeHidden,
      include_failed: includeFailed,
      limit,
    },
  });
  return data.items ?? [];
}

export async function setVideoHidden(
  requestId: string,
  hidden: boolean,
): Promise<VideoRequestData> {
  const { data } = await api.patch<VideoRequestData>(
    `/videos/${requestId}`,
    { hidden },
    { headers: DEMO_API_KEY ? { 'X-Demo-Key': DEMO_API_KEY } : undefined },
  );
  return data;
}

export async function getStatus(requestId: string): Promise<VideoRequestData> {
  const { data } = await api.get(`/generate/status/${requestId}`);
  return data;
}

export async function getVideo(requestId: string): Promise<VideoRequestData> {
  const { data } = await api.get(`/videos/${requestId}`);
  return data;
}

export function subscribeToStatus(
  requestId: string,
  onUpdate: (data: VideoRequestData) => void,
  onError?: (error: unknown) => void,
): () => void {
  let isCleanedUp = false;
  let streamEnded = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let stallTimer: ReturnType<typeof setTimeout> | null = null;
  let es: EventSource | null = null;

  const stopPolling = () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const stopStallWatchdog = () => {
    if (stallTimer !== null) {
      clearTimeout(stallTimer);
      stallTimer = null;
    }
  };

  const closeStream = () => {
    if (es) {
      es.close();
      es = null;
    }
  };

  const isTerminal = (data: VideoRequestData) =>
    data.status === 'completed' || data.status === 'failed';

  /** Terminal state reached: stop every timer and the stream. */
  const finish = () => {
    streamEnded = true;
    stopPolling();
    stopStallWatchdog();
    closeStream();
  };

  const startFallbackPolling = () => {
    if (isCleanedUp || streamEnded || pollTimer !== null) return;

    const poll = async () => {
      if (isCleanedUp || streamEnded) return;
      try {
        const data = await getStatus(requestId);
        if (isCleanedUp || streamEnded) return;
        onUpdate(data);
        if (isTerminal(data)) finish();
      } catch (err) {
        if (!isCleanedUp && !streamEnded) {
          onError?.(err);
        }
      }
    };

    void poll();

    pollTimer = setInterval(() => {
      void poll();
    }, 5000);
  };

  /**
   * The browser retries a dropped EventSource on its own, but a proxy that holds the
   * connection open without forwarding events looks healthy. Poll the status endpoint
   * whenever the stream goes quiet, and keep polling until it speaks again.
   */
  const armStallWatchdog = (delayMs: number) => {
    stopStallWatchdog();
    if (isCleanedUp || streamEnded) return;
    stallTimer = setTimeout(() => {
      void (async () => {
        if (isCleanedUp || streamEnded) return;
        try {
          const data = await getStatus(requestId);
          if (isCleanedUp || streamEnded) return;
          onUpdate(data);
          if (isTerminal(data)) {
            finish();
            return;
          }
        } catch (err) {
          if (isCleanedUp || streamEnded) return;
          onError?.(err);
        }
        armStallWatchdog(STALL_RECHECK_MS);
      })();
    }, delayMs);
  };

  if (typeof EventSource === 'undefined') {
    startFallbackPolling();
  } else {
    try {
      es = new EventSource(`${API_BASE}/generate/stream/${requestId}`);

      es.onmessage = (event: MessageEvent) => {
        if (isCleanedUp || streamEnded) return;
        try {
          const data: VideoRequestData = JSON.parse(event.data);
          onUpdate(data);
          if (isTerminal(data)) {
            finish();
            return;
          }
          armStallWatchdog(STALL_TIMEOUT_MS);
        } catch (err) {
          onError?.(err);
        }
      };

      es.onerror = (err) => {
        if (isCleanedUp || streamEnded) return;
        // A transient error is normal: the browser reconnects by itself and the stall
        // watchdog keeps the UI moving meanwhile. Only a closed stream is unrecoverable.
        if (es?.readyState === EventSource.CLOSED) {
          onError?.(err);
          closeStream();
          stopStallWatchdog();
          startFallbackPolling();
        }
      };

      armStallWatchdog(STALL_TIMEOUT_MS);
    } catch (err) {
      if (!isCleanedUp) {
        onError?.(err);
        startFallbackPolling();
      }
    }
  }

  return () => {
    isCleanedUp = true;
    closeStream();
    stopPolling();
    stopStallWatchdog();
  };
}

export default api;
