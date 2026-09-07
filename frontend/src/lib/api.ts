import axios from 'axios';
import type { GenerateVideoInput, VideoRequestData } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function generateVideo({
  prompt,
  styleId,
  dialogue,
  language,
  characterPresetId,
  characterImage,
}: GenerateVideoInput): Promise<VideoRequestData> {
  const form = new FormData();
  form.append('prompt', prompt);
  if (styleId) form.append('style_id', styleId);
  if (dialogue) form.append('dialogue', dialogue);
  if (language) form.append('language', language);
  if (characterPresetId) form.append('character_preset_id', characterPresetId);
  if (characterImage) form.append('character_image', characterImage);

  const { data } = await api.post('/generate/video', form, { timeout: 60000 });
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
  let es: EventSource | null = null;

  const stopPolling = () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const startFallbackPolling = () => {
    if (isCleanedUp || streamEnded || pollTimer !== null) return;

    const poll = async () => {
      if (isCleanedUp || streamEnded) return;
      try {
        const data = await getStatus(requestId);
        if (isCleanedUp || streamEnded) return;
        onUpdate(data);
        if (data.status === 'completed' || data.status === 'failed') {
          streamEnded = true;
          stopPolling();
        }
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

  if (typeof EventSource === 'undefined') {
    startFallbackPolling();
  } else {
    try {
      es = new EventSource(`/api/generate/stream/${requestId}`);

      es.onmessage = (event: MessageEvent) => {
        if (isCleanedUp || streamEnded) return;
        try {
          const data: VideoRequestData = JSON.parse(event.data);
          onUpdate(data);
          if (data.status === 'completed' || data.status === 'failed') {
            streamEnded = true;
            if (es) {
              es.close();
              es = null;
            }
          }
        } catch (err) {
          onError?.(err);
        }
      };

      es.onerror = (err) => {
        if (isCleanedUp || streamEnded) return;
        onError?.(err);
        if (es) {
          es.close();
          es = null;
        }
        startFallbackPolling();
      };
    } catch (err) {
      if (!isCleanedUp) {
        onError?.(err);
        startFallbackPolling();
      }
    }
  }

  return () => {
    isCleanedUp = true;
    if (es) {
      es.close();
      es = null;
    }
    stopPolling();
  };
}

export default api;
