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
  audioPresetId,
  characterImage,
  audioFile,
}: GenerateVideoInput): Promise<VideoRequestData> {
  const form = new FormData();
  form.append('prompt', prompt);
  if (styleId) form.append('style_id', styleId);
  if (dialogue) form.append('dialogue', dialogue);
  if (language) form.append('language', language);
  if (characterPresetId) form.append('character_preset_id', characterPresetId);
  if (audioPresetId) form.append('audio_preset_id', audioPresetId);
  if (characterImage) form.append('character_image', characterImage);
  if (audioFile) form.append('audio_file', audioFile);

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

export default api;
