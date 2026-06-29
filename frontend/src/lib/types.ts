export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'pa';

export interface VideoTemplate {
  id: string;
  number: string;
  title: string;
  style: string;
  location: string;
  dialogue: string;
  prompt: string;
  accent: string;
  emoji: string;
  videoSrc: string | null;
  poster: string | null;
}

export interface ProductPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  visualDescription: string;
  emoji: string;
  gradient: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  gender: 'M' | 'F' | '';
  role: string;
  avatar: string;
  bg: string;
  img: string;
}

export interface AudioPreset {
  id: string;
  name: string;
  bpm: number;
  mood: string;
  src: string;
}

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerateVideoInput {
  prompt: string;
  styleId?: string;
  dialogue?: string;
  language?: string;
  characterPresetId?: string;
  audioPresetId?: string;
  characterImage?: File | null;
  audioFile?: File | null;
}

export interface VideoRequestData {
  request_id: string;
  status: GenerationStatus;
  progress?: number;
  prompt?: string;
  dialogue?: string;
  language?: string;
  style_id?: string;
  video_url?: string | null;
  video_page_url?: string | null;
  qr_code_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string;
  error?: string;
}
