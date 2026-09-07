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

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Fine-grained pipeline stage reported by the backend. Optional: older backends omit it. */
export type GenerationStage =
  | 'queued'
  | 'uploading'
  | 'submitting'
  | 'generating'
  | 'finalizing'
  | 'completed'
  | 'failed';

export interface GenerateVideoInput {
  prompt: string;
  styleId?: string;
  dialogue?: string;
  language?: string;
  characterPresetId?: string;
  characterImage?: File | null;
  productId?: string;
}

export interface VideoRequestData {
  request_id: string;
  status: GenerationStatus;
  stage?: GenerationStage;
  /** Per-stage durations in seconds, keyed by stage name. */
  timings?: Record<string, number>;
  generation_seconds?: number;
  /** The fully expanded prompt the backend sent to the model. */
  final_prompt?: string;
  progress?: number;
  prompt?: string;
  dialogue?: string;
  language?: string;
  style_id?: string;
  product_id?: string;
  character_preset_id?: string;
  character_image_url?: string | null;
  /** Hidden records are excluded from the gallery unless it is asked for them. */
  hidden?: boolean;
  video_url?: string | null;
  video_page_url?: string | null;
  qr_code_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string;
  error?: string;
}

/** Gallery listing. Items are a subset of VideoRequestData, not a separate shape. */
export interface VideoListResponse {
  items: VideoRequestData[];
}
